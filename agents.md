# Pierre: Personal AI Agent - Implementation Plan

## Context

Rebuilding Chris Raroque's "Luna L1" AI agent (from [his video](https://youtu.be/_h2EnRfxMQE)) as "Pierre" - a personal AI assistant with a ChatGPT-like web interface, 3-tier memory system, Slack/Gmail integrations, and scheduled workflows. This is for **personal, non-commercial use only**, leveraging the Anthropic Agent SDK with Convex as the real-time database.

**Important API Key Note:** The Agent SDK requires API credentials (not a Claude Code subscription). Options:
- Anthropic API key from [console.anthropic.com](https://console.anthropic.com) (pay-per-use)
- AWS Bedrock (set `CLAUDE_CODE_USE_BEDROCK=1` + AWS creds from your SSO)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web Frontend | Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Desktop App | Tauri v2 (wraps Next.js web app as native macOS app) |
| Mobile App | React Native (Expo), TypeScript, NativeWind (Tailwind for RN) |
| Database | Convex (real-time sync, cron jobs, serverless functions) |
| Auth | Clerk (integrated with Convex, works with web + desktop + Expo) |
| AI Agent | Anthropic Agent SDK (`@anthropic-ai/claude-agent-sdk`) |
| Integrations | Memory MCP, Slack MCP, Gmail MCP |
| Deployment | Vercel (web) + Tauri (desktop .dmg) + Convex Cloud (backend) + Expo Go (mobile) |

---

## Project Structure

```
Pierre/
├── .claude/
│   ├── CLAUDE.md                          # Agent system instructions
│   └── skills/
│       ├── memory-management/SKILL.md     # Proactive memory management
│       ├── slack-integration/SKILL.md     # Slack search & summarize
│       ├── gmail-integration/SKILL.md     # Email search & summarize
│       ├── morning-briefing/SKILL.md      # Daily briefing generation
│       └── web-research/SKILL.md          # Web research guidelines
├── apps/
│   ├── desktop/                           # Tauri v2 desktop app (wraps web app)
│   │   ├── src-tauri/
│   │   │   ├── Cargo.toml                # Rust config for Tauri
│   │   │   ├── tauri.conf.json           # Tauri config (window size, title, etc.)
│   │   │   ├── src/
│   │   │   │   └── main.rs               # Tauri entry point
│   │   │   └── icons/                    # App icons (.icns for macOS)
│   │   ├── package.json
│   │   └── README.md                     # Desktop build instructions
│   ├── mobile/                            # React Native (Expo) mobile app
│   │   ├── app.json                       # Expo config
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── app/
│   │   │   ├── _layout.tsx               # Root layout (Clerk + Convex providers)
│   │   │   ├── (auth)/
│   │   │   │   ├── sign-in.tsx           # Sign-in screen
│   │   │   │   └── sign-up.tsx           # Sign-up screen
│   │   │   └── (tabs)/
│   │   │       ├── _layout.tsx           # Tab navigator
│   │   │       ├── index.tsx             # Chat list (conversations)
│   │   │       ├── chat/[id].tsx         # Conversation screen
│   │   │       ├── memory.tsx            # Memory browser
│   │   │       └── settings.tsx          # Settings screen
│   │   ├── components/
│   │   │   ├── ChatBubble.tsx            # Native message bubble
│   │   │   ├── ChatInput.tsx             # Native text input + send
│   │   │   ├── ConversationList.tsx       # FlatList of conversations
│   │   │   └── ToolIndicator.tsx         # Tool usage indicator
│   │   └── hooks/                         # Shared Convex hooks (same queries as web)
│   │       ├── useConversation.ts
│   │       ├── useMessages.ts
│   │       └── useAgent.ts
│   └── web/                               # Next.js frontend + Convex backend
│       ├── convex/
│       │   ├── schema.ts                  # Database schema (all tables)
│       │   ├── conversations.ts           # Conversation CRUD
│       │   ├── messages.ts                # Message CRUD + streaming
│       │   ├── memories.ts                # 3-tier memory system
│       │   ├── settings.ts                # User settings
│       │   ├── agent.ts                   # Agent SDK bridge action
│       │   ├── crons.ts                   # Scheduled tasks
│       │   └── auth.config.ts             # Clerk auth config
│       └── src/
│           ├── app/
│           │   ├── layout.tsx             # Root layout (Clerk + Convex providers)
│           │   ├── chat/
│           │   │   ├── layout.tsx         # Sidebar + chat area layout
│           │   │   ├── page.tsx           # New conversation view
│           │   │   └── [conversationId]/page.tsx  # Conversation view
│           │   ├── sign-in/[[...sign-in]]/page.tsx
│           │   └── sign-up/[[...sign-up]]/page.tsx
│           ├── components/
│           │   ├── chat/                  # ChatContainer, MessageList, MessageBubble, MessageInput, etc.
│           │   ├── sidebar/               # Sidebar, ConversationItem, NewChatButton, UserMenu
│           │   ├── memory/                # MemoryPanel, MemoryItem
│           │   └── settings/              # SettingsModal, ToolToggle
│           ├── hooks/                     # useConversation, useMessages, useAgent, useMemories
│           └── providers/
│               └── ConvexClientProvider.tsx
├── mcp-servers/
│   ├── memory-mcp/src/index.ts            # Memory CRUD via Convex
│   ├── slack-mcp/src/index.ts             # Slack Web API integration
│   └── gmail-mcp/src/index.ts             # Gmail API integration
├── package.json                           # Workspace root
├── .env.example
└── .gitignore
```

---

## Convex Schema (Critical File: `apps/web/convex/schema.ts`)

5 tables:
- **conversations**: userId, title, sessionId (for Agent SDK resume), lastMessageAt, isArchived
- **messages**: conversationId, role (user/assistant/system/tool), content, toolName, toolInput, toolResult, isStreaming, costUsd, tokenCount
- **memories**: userId, type (session/persistent/archival), category, content, source, conversationId, importance (1-10), isActive, lastAccessedAt
- **userSettings**: userId, displayName, timezone, enabledTools[], morningBriefingEnabled, pushNotificationsEnabled, preferredModel
- **scheduledTasks**: userId, taskType, status (pending/running/completed/failed), result, scheduledFor, executedAt

---

## 3-Tier Memory System

| Tier | What | When Loaded | Examples |
|------|------|-------------|----------|
| Session | Current conversation context | At session start | "Discussed Vercel deployment config" |
| Persistent | Long-term user facts | Every conversation | "Prefers TypeScript", "Dog named Pierre" |
| Archival | Heavy reference material | On demand | Full transcripts, project docs, meeting notes |

The Memory MCP server exposes 5 tools: `memory_search`, `memory_save`, `memory_update`, `memory_delete`, `memory_list`. The agent uses these proactively (instructed via the memory-management skill).

---

## Agent SDK Configuration (Critical File: `apps/web/convex/agent.ts`)

```typescript
// Core pattern: Convex action calls Agent SDK query()
const agentOptions = {
  permissionMode: "bypassPermissions",
  allowedTools: ["WebSearch", "WebFetch", "Skill", "Read", "Glob", "Grep"],
  settingSources: ["project"],         // Loads .claude/skills/
  cwd: projectRoot,                    // Project root for skills discovery
  resume: existingSessionId,           // Resume conversation if exists
  systemPrompt: "You are Pierre...",   // Custom system prompt
  mcpServers: {                        // Custom MCP tools
    memory: { command: "node", args: ["memory-mcp/dist/index.js"] },
    slack: { command: "node", args: ["slack-mcp/dist/index.js"] },
    gmail: { command: "node", args: ["gmail-mcp/dist/index.js"] },
  },
};

for await (const msg of query({ prompt, options: agentOptions })) {
  // Capture session_id from init message
  // Stream assistant messages to Convex for real-time UI
  // Finalize on result message
}
```

---

## Real-Time Message Flow

1. User types message → `messages.send` mutation stores user message
2. `agent.run` action invoked → calls Agent SDK `query()`
3. Agent streams responses → action writes to Convex via `messages.upsertAssistant`
4. Frontend subscribes via `useQuery(api.messages.list)` → auto-updates UI
5. Session ID saved to conversation for future resume

---

## Agent Teams for Development

### Team 1: Backend Dev
- Initialize monorepo, install dependencies
- Set up Convex project with schema
- Build all Convex functions (conversations, messages, memories, settings)
- Build the `agent.ts` bridge action
- Build all 3 MCP servers (memory, slack, gmail)
- Set up cron jobs
- Create all `.claude/skills/*.md` files

### Team 2: Frontend Dev
- Initialize Next.js app with Tailwind + shadcn/ui
- Set up ConvexClientProvider with Clerk
- Build chat layout (sidebar + chat area)
- Build all chat components (MessageList, MessageBubble, MessageInput)
- Build conversation management (create, list, archive)
- Build hooks (useConversation, useMessages, useAgent)
- Implement real-time message subscription

### Team 3: UI/UX
- Design and implement the visual design system
- Configure Tailwind theme (colors, typography, spacing)
- Install and configure all needed shadcn/ui components
- Build responsive layouts (mobile + desktop)
- Add animations, transitions, dark/light mode
- Create empty states, loading states, error states
- Polish the overall look to match a ChatGPT-like experience

### Team 4: QA/Diff Reporting
- Review all code for type safety, bugs, security issues
- Verify Convex schema matches all queries/mutations
- Check environment variables are documented
- Run TypeScript type checking
- Test conversation flow end-to-end
- Test memory persistence across sessions
- Review MCP servers for secure credential handling
- Generate diff reports of all changes

### Team 5: Mobile Dev (Expo/React Native)
- Initialize Expo project with Expo Router (file-based routing)
- Set up NativeWind (Tailwind CSS for React Native)
- Configure Clerk auth for Expo (`@clerk/clerk-expo`)
- Set up Convex React Native client (same `convex/` functions as web)
- Build native chat UI (FlatList messages, KeyboardAvoidingView input)
- Build conversation list with pull-to-refresh
- Build native settings and memory screens
- Configure Expo push notifications
- Real-time sync via Convex (same subscription pattern as web)
- Test on physical device via Expo Go (no Xcode needed)

### Team 6: Desktop Dev (Tauri)
- Initialize Tauri v2 project wrapping the Next.js web app
- Configure `tauri.conf.json` (window size, title bar, app icon)
- Set up macOS-specific features (dock icon, menu bar, system tray)
- Configure native desktop notifications
- Build `.dmg` for local installation
- Test auto-launch on startup (optional)

### Team 7: Code Efficiency Agent
- Monitor all code for bloat, unnecessary dependencies, and dead code
- Check bundle sizes (Next.js build, Expo bundle, Tauri binary)
- Flag over-engineered abstractions or premature optimization
- Ensure tree-shaking works properly (no barrel exports that break it)
- Review `package.json` dependencies - flag unused or duplicate packages
- Check for large imports (e.g., importing all of lodash instead of specific functions)
- Monitor Convex function sizes (serverless cold start optimization)
- Review Tailwind config for unused utility classes (purge config)
- Ensure images/assets are optimized
- Track and report build size metrics after each phase
- Suggest code splitting and lazy loading where appropriate

---

## Implementation Phases

### Phase 1: Foundation (Teams 1, 2, 3 in parallel)
- Backend: Monorepo setup, Convex schema, basic CRUD functions
- Frontend Web: Next.js init, providers, auth pages
- UI/UX: Design system, shadcn/ui setup, Tailwind config

### Phase 2: Core Chat (Teams 1, 2, 5, 6 in parallel)
- Backend: Agent SDK bridge action, session management, Memory MCP server
- Frontend Web: Chat UI components, real-time message flow, conversation management
- Mobile: Expo project init, Clerk + Convex setup, basic navigation structure
- Desktop: Tauri project init, wrap Next.js dev server, configure window/menu

### Phase 3: Memory & Skills (Teams 1, 2, 5, 7 in parallel)
- Backend: All 5 skills, memory management flow, cost tracking
- Frontend Web: Memory panel, settings modal, markdown rendering
- Mobile: Native chat UI (message list, input, streaming indicators)
- Efficiency: First audit - dependency check, bundle size baseline, dead code scan

### Phase 4: Integrations (Teams 1, 2, 4, 5, 6 in parallel)
- Backend: Slack MCP, Gmail MCP, cron jobs, morning briefing
- Frontend Web: Tool toggles, briefing history
- Mobile: Settings screen, memory browser, push notifications
- Desktop: Native notifications, system tray, .dmg build
- QA: Full code review, type checking, security audit across all platforms

### Phase 5: Polish (All 7 teams)
- Final UI polish on web, mobile, and desktop
- Error handling and edge cases
- Expo push notification testing
- Desktop .dmg packaging
- Efficiency: Final audit - bundle size report, optimization recommendations
- Deployment config (Vercel + Convex + Expo Go + Tauri)
- Documentation

---

## Key Files to Create (in priority order)

1. `package.json` (root) - Workspace config with all dependencies
2. `apps/web/convex/schema.ts` - Database schema (everything depends on this)
3. `apps/web/src/providers/ConvexClientProvider.tsx` - Auth + DB provider
4. `apps/web/convex/agent.ts` - Agent SDK bridge (core functionality)
5. `mcp-servers/memory-mcp/src/index.ts` - Memory tools for the agent
6. `apps/web/src/app/chat/[conversationId]/page.tsx` - Chat conversation UI
7. `.claude/skills/memory-management/SKILL.md` - Memory skill
8. `apps/web/convex/crons.ts` - Scheduled tasks

---

## Environment Variables Needed

```
NEXT_PUBLIC_CONVEX_URL=        # From Convex dashboard
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=  # From Clerk dashboard
CLERK_SECRET_KEY=              # From Clerk dashboard
ANTHROPIC_API_KEY=             # From console.anthropic.com (or use Bedrock)
SLACK_TOKEN=                   # Slack Bot Token (for Slack MCP)
GMAIL_CREDENTIALS=             # Gmail OAuth2 JSON (for Gmail MCP)
```

---

## Verification / Testing Plan

1. **Chat flow**: Send a message → see agent respond in real-time → verify message stored in Convex
2. **Session resume**: Close browser → reopen conversation → send follow-up → agent remembers context
3. **Memory**: Tell the agent a fact → start new conversation → ask about it → agent recalls from persistent memory
4. **Slack integration**: Ask "any urgent Slack messages?" → agent searches Slack and summarizes
5. **Cron job**: Trigger morning briefing manually → verify it creates a conversation with summary
6. **Cost tracking**: Send messages → check cost display in UI
7. **Auth**: Sign out → verify redirect to sign-in → sign in → see your conversations only
8. **Mobile (Expo)**: Open Expo Go on phone → scan QR → verify chat works natively with real-time sync
9. **Cross-device sync**: Send message on web → verify it appears on mobile instantly (and vice versa)
10. **Mobile push notifications**: Trigger a notification → verify it appears on phone
