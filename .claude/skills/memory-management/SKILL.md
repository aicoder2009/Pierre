# Memory Management Skill

## Overview

Pierre uses a 3-tier memory system to maintain context across conversations. Proactive memory management is critical to being an effective personal assistant.

## Memory Tiers

### Session Memory
- Automatically managed within the current conversation.
- Stores working context: what the user asked, decisions made this session, intermediate results.
- Cleared when the conversation ends.
- No explicit save needed -- this is handled by the conversation itself.

### Persistent Memory
- Important facts that should survive across sessions.
- Stored in Convex via the memory MCP server.
- Examples: user preferences, personal facts, recurring tasks, project context, key decisions.

### Archival Memory
- Long-form content and reference material.
- Used for research results, detailed notes, saved articles, large context blocks.
- Searchable but not loaded by default.

## When to Search Memory

**Always search at conversation start.** Run `memory_search` with a general query to load user context before responding to the first message.

Search memory when:
- The user references something from a past conversation ("remember when...", "like last time...")
- Context about the user would improve your response (preferences, background, projects)
- The user asks about something you previously discussed
- You need to recall a saved decision, action item, or fact

## When to Save to Persistent Memory

Save immediately when the user shares:
- **Personal facts**: name, job, team, location, timezone, birthday
- **Preferences**: communication style, tools they use, how they like summaries formatted
- **Decisions**: architectural choices, policy decisions, agreed-upon plans
- **Action items**: tasks they commit to, deadlines, follow-ups
- **Project context**: what they're working on, key stakeholders, goals

Save after a conversation reveals:
- A recurring pattern (e.g., they always check Slack first thing)
- Important context that would be lost when the session ends

## When to Save to Archival Memory

Save to archival when:
- Web research produces useful reference material
- The user explicitly asks to "save this" or "remember this for later"
- A conversation produces a detailed plan, analysis, or summary worth preserving
- Content is too large or detailed for persistent memory

## Importance Scoring (1-10)

When saving memories, assign an importance score:

| Score | Criteria | Examples |
|-------|----------|----------|
| 9-10 | Critical personal/professional facts | Name, role, key relationships, major deadlines |
| 7-8 | Important preferences and decisions | Communication preferences, architectural decisions |
| 5-6 | Useful context | Project details, tool preferences, recurring topics |
| 3-4 | Nice to know | Minor preferences, one-off facts |
| 1-2 | Low value | Trivial details, transient context |

## Memory Categories

Use these categories when saving:
- `personal` -- Facts about the user (name, role, location)
- `preference` -- User preferences and settings
- `decision` -- Decisions and rationale
- `action_item` -- Tasks, deadlines, follow-ups
- `project` -- Project context and details
- `research` -- Saved research and reference material
- `relationship` -- People the user mentions (colleagues, contacts)
- `routine` -- Recurring patterns and habits

## Upgrading Session to Persistent

At the end of a meaningful conversation, review what was discussed and save anything important to persistent memory. Ask yourself:
- Did the user share new personal facts?
- Were any decisions made?
- Are there action items to track?
- Did I learn a new preference?

If yes to any of these, save before the session ends.

## Deduplication

Before saving, search existing memories to avoid duplicates. If a similar memory exists, use `memory_update` instead of `memory_save` to merge or update the existing entry.
