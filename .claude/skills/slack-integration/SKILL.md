# Slack Integration Skill

## Overview

Pierre can read and search Slack messages to help the user stay informed about their workspace activity.

## Available Tools

- `slack_search` -- Search messages across channels by keyword or phrase
- `slack_get_channels` -- List available channels the bot has access to
- `slack_get_messages` -- Get recent messages from a specific channel
- `slack_get_unread` -- Get unread messages across channels

## When to Use Slack Tools

### Proactive Checks
- During morning briefings (see `morning-briefing` skill)
- When the user asks "what did I miss?" or "any updates?"
- When the user mentions a topic that likely has Slack discussion

### On Request
- When the user asks to search for a specific topic in Slack
- When the user asks about a specific channel's recent activity
- When the user wants a summary of a thread or discussion

## Searching Slack

When searching, use specific and relevant keywords:
- For project updates: search the project name or key terms
- For people: search by their name or username
- For decisions: search terms like "decided", "agreed", "let's go with"

Combine multiple searches if needed to build a complete picture.

## Formatting Slack Summaries

Structure Slack summaries as follows:

```
## Slack Summary

### #channel-name
- **@username** (timestamp): Key point or message summary
- **@username** (timestamp): Key point or message summary

### #another-channel
- **@username** (timestamp): Key point or message summary
```

Guidelines:
- Group messages by channel
- Include the sender and approximate time
- Summarize long messages -- don't reproduce them verbatim
- Highlight action items or decisions with bold text
- Omit low-signal messages (greetings, emoji-only reactions, "thanks" replies)

## Priority Detection

Flag messages as **urgent** if they contain:
- Direct mentions of the user (@username)
- Keywords: "urgent", "ASAP", "blocking", "blocker", "critical", "emergency", "deadline"
- Questions directed at the user that are unanswered
- Messages from the user's manager or leadership (if known from memory)

Flag messages as **action required** if they contain:
- Explicit asks: "can you", "please review", "need your input"
- Review requests or PR mentions
- Meeting invites or schedule changes

Present urgent items first in any summary.

## Channel Prioritization

When checking unread messages, prioritize:
1. Direct messages to the user
2. Channels the user has marked as important (check memory)
3. Project-specific channels relevant to current work
4. General/team channels
5. Social/random channels (summarize briefly or skip)

## Saving to Memory

After summarizing Slack activity:
- Save action items assigned to the user to persistent memory
- Save important decisions to persistent memory
- Save key deadlines or date-sensitive information
- Do not save routine chatter or low-importance messages
