# Morning Briefing Skill

## Overview

Generate a concise daily briefing that helps the user start their day informed and organized. The briefing combines data from Slack, Gmail, and memory into a single digestible summary.

## When to Trigger

- When the user says "good morning", "morning briefing", "what did I miss?", or similar
- When it appears to be the user's first interaction of the day (check memory for timezone)
- When the user explicitly asks for a daily summary or status update

## Briefing Generation Steps

### 1. Load User Context
Search memory for:
- User's name and role
- Known timezone and work schedule
- Important ongoing projects
- Pending action items from previous sessions
- Key contacts and relationships

### 2. Check Slack
Use `slack_get_unread` to pull unread messages, then:
- Filter and prioritize using the Slack integration skill guidelines
- Identify urgent items and direct mentions
- Summarize key discussions and decisions
- Note any action items assigned to the user

### 3. Check Gmail
Use `gmail_get_unread` to pull unread emails, then:
- Filter and prioritize using the Gmail integration skill guidelines
- Identify action-required emails
- Summarize important correspondence
- Note deadlines and meeting changes

### 4. Review Pending Items
From memory, gather:
- Outstanding action items and their deadlines
- Scheduled tasks or follow-ups for today
- Any reminders set in previous sessions

### 5. Compile and Format

## Briefing Format

```
# Good morning, [Name]!

## Urgent
- [Anything requiring immediate attention from Slack or Gmail]

## Slack Highlights
- **#channel**: Summary of key discussion (N unread messages)
- **#channel**: Summary of key discussion (N unread messages)
- [DMs]: Summary of direct messages

## Email Highlights
- **Subject** from Sender -- action needed / FYI
- **Subject** from Sender -- action needed / FYI

## Today's Action Items
- [ ] Item from previous session or discovered today
- [ ] Item from Slack/email
- [ ] Scheduled follow-up

## Quick Stats
- Unread Slack messages: N
- Unread emails: N
- Pending action items: N
```

## Formatting Guidelines

- Keep the entire briefing scannable -- no walls of text.
- Use bullet points, not paragraphs.
- Lead with urgent items. If nothing is urgent, say so ("Nothing urgent overnight").
- Cap Slack highlights to the top 5-7 most relevant items.
- Cap email highlights to the top 5-7 most relevant items.
- Include a "Quick Stats" section so the user knows the overall volume.
- If a section has nothing to report, include it with "Nothing new" rather than omitting it.

## After the Briefing

- Save any new action items discovered during the briefing to persistent memory.
- Update the status of any previously saved action items if new information is found.
- Ask the user if they want to dive deeper into any section.
