# Pierre - Personal AI Assistant

Pierre is a personal AI assistant powered by Claude, built as a multi-platform app with deep integrations into your digital life. It features persistent memory, Slack and Gmail integrations, and web search -- all orchestrated through the Claude Code SDK or the Anthropic API.

> **Credit:** Original idea from [Chris Raroque](https://youtu.be/_h2EnRfxMQE?si=pOdvYnVKACdcUWhD).

## Prerequisites

- **Node.js 18+** (check with `node -v`)
- **Convex account** -- [dashboard.convex.dev](https://dashboard.convex.dev)
- **Clerk account** -- [clerk.com](https://clerk.com)
- One of the following for Claude access:
  - **Claude Max subscription** with Claude Code installed (`npm install -g @anthropic-ai/claude-code`)
  - **Anthropic API key** from [console.anthropic.com](https://console.anthropic.com)

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/your-username/Pierre.git
cd Pierre

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Copy the environment template
cp .env.example apps/web/.env.local

# 4. Run the interactive setup (configures Convex, Clerk, and API keys)
bash setup.sh

# 5. Start Convex (in one terminal)
npm run convex:dev

# 6. Start the dev server (in another terminal)
npm run dev:web

# 7. Open http://localhost:3000
```

If you prefer manual setup over `setup.sh`, see the sections below.

## Using with Claude Max Subscription

When you have a Claude Max (or Pro/Team) subscription with Claude Code installed globally, Pierre can use your subscription directly -- **no API key required**.

How it works:
1. Install Claude Code globally: `npm install -g @anthropic-ai/claude-code`
2. Leave `ANTHROPIC_API_KEY` blank in your `.env.local`
3. The agent detects the missing key and automatically uses the Claude Code SDK (`@anthropic-ai/claude-code`), which authenticates through your logged-in Claude Code session
4. Run `npx convex dev` locally -- the Convex action runs on your machine where Claude Code credentials are available

This is ideal for personal use and development. You get access to Claude without per-token billing.

## Using with Anthropic API Key

For production deployments or when you prefer pay-per-use pricing:

1. Get an API key from [console.anthropic.com](https://console.anthropic.com)
2. Set it in `apps/web/.env.local`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
3. Also set it in your Convex deployment:
   ```bash
   cd apps/web && npx convex env set ANTHROPIC_API_KEY "sk-ant-..."
   ```

When `ANTHROPIC_API_KEY` is present, Pierre uses the direct Anthropic API with full conversation history and tool use.

## Architecture

```
Pierre/
├── apps/
│   ├── web/              # Next.js 15 frontend + Convex backend
│   │   ├── convex/       # Serverless functions, schema, agent logic
│   │   └── src/          # React UI (Tailwind + Radix)
│   ├── desktop/          # Tauri desktop app (planned)
│   └── mobile/           # Expo mobile app (planned)
├── mcp-servers/
│   ├── memory-mcp/       # 3-tier memory system (session/persistent/archival)
│   ├── slack-mcp/        # Slack workspace integration
│   └── gmail-mcp/        # Gmail inbox integration
└── .claude/              # Claude Code project instructions & skills
```

**Stack:** Next.js (frontend) | Convex (real-time database + serverless) | Clerk (auth) | Claude Code SDK or Anthropic API (AI) | MCP (tool integrations)

The agent lives in `apps/web/convex/agent.ts`. It supports two execution paths:
- **Claude Code SDK** -- streams responses via `@anthropic-ai/claude-code`, supports MCP servers natively, uses your Max subscription
- **Anthropic API** -- direct API calls with an agentic tool-use loop, requires an API key

## MCP Servers

Pierre uses [Model Context Protocol](https://modelcontextprotocol.io) servers for tool integrations. Each server is a standalone Node.js process.

### Building MCP Servers

```bash
# Build all MCP servers
cd mcp-servers/memory-mcp && npm install && npm run build
cd ../slack-mcp && npm install && npm run build
cd ../gmail-mcp && npm install && npm run build
```

### Memory MCP (`@pierre/memory-mcp`)

A 3-tier memory system backed by Convex:
- **Session memory** -- current conversation context (auto-cleared per session)
- **Persistent memory** -- facts, preferences, decisions (survives across sessions)
- **Archival memory** -- long-form research and reference material (searchable)

Tools: `memory_search`, `memory_save`, `memory_update`, `memory_delete`, `memory_list`

### Slack MCP (`@pierre/slack-mcp`)

Read and search Slack workspace messages. Requires a Slack Bot OAuth token (`xoxb-...`).

Tools: `slack_search`, `slack_get_channels`, `slack_get_messages`, `slack_get_unread`

### Gmail MCP (`@pierre/gmail-mcp`)

Read and search your Gmail inbox. Requires Google OAuth2 credentials.

Tools: `gmail_search`, `gmail_get_message`, `gmail_get_unread`, `gmail_list_labels`

## Environment Variables

Copy `.env.example` to `apps/web/.env.local` and fill in the values.

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_CONVEX_URL` | Yes | Convex deployment URL (from `npx convex dev`) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key (`pk_...`) |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key (`sk_...`) |
| `ANTHROPIC_API_KEY` | No | Anthropic API key; omit to use Claude Code SDK |
| `SLACK_TOKEN` | No | Slack Bot OAuth token (`xoxb-...`) for Slack integration |
| `GMAIL_CREDENTIALS` | No | Path to Gmail OAuth2 credentials JSON |

**Convex environment variables** (set via `npx convex env set`):

| Variable | Required | Description |
|----------|----------|-------------|
| `CLERK_JWT_ISSUER_DOMAIN` | Yes | Clerk JWT issuer URL for Convex auth |
| `ANTHROPIC_API_KEY` | No | Same API key, needed if deploying to Convex cloud |

### Clerk JWT Template Setup

1. In the [Clerk Dashboard](https://dashboard.clerk.com), go to **JWT Templates**
2. Click **New template** and select **Convex**
3. Keep the defaults and click **Save**
4. Copy the Issuer URL and set it in Convex:
   ```bash
   npx convex env set CLERK_JWT_ISSUER_DOMAIN "https://your-issuer.clerk.accounts.dev"
   ```

## License

Private project. Not for commercial use.
