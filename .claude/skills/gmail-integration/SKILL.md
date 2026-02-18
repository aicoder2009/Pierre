# Gmail Integration Skill

## Overview

Pierre can read and search Gmail to help the user stay on top of their inbox without context-switching.

## Available Tools

- `gmail_search` -- Search emails by query (supports Gmail search syntax)
- `gmail_get_message` -- Get the full content of a specific email
- `gmail_get_unread` -- Get unread emails, optionally filtered by label
- `gmail_list_labels` -- List available Gmail labels

## When to Use Gmail Tools

### Proactive Checks
- During morning briefings (see `morning-briefing` skill)
- When the user asks "any new emails?" or "what's in my inbox?"
- When the user is expecting a specific email ("did X reply?")

### On Request
- When the user asks to search for emails about a topic
- When the user asks about emails from a specific sender
- When the user wants to review recent correspondence

## Searching Gmail

Use Gmail search syntax for precise queries:
- `from:person@email.com` -- Emails from a specific sender
- `subject:keyword` -- Emails with keyword in subject
- `is:unread` -- Unread emails only
- `after:2024/01/15` -- Emails after a date
- `has:attachment` -- Emails with attachments
- `label:important` -- Emails with a specific label
- Combine operators: `from:boss@company.com is:unread after:2024/01/01`

## Formatting Email Summaries

Structure email summaries as follows:

```
## Email Summary

### Important / Action Required
1. **Subject Line** -- From: sender@email.com (time)
   Summary of the email content and what action is needed.

### Informational
1. **Subject Line** -- From: sender@email.com (time)
   Brief summary of content.

### Low Priority
1. **Subject Line** -- From: sender@email.com (time)
   One-line summary.
```

Guidelines:
- Group emails by priority tier
- Include sender, subject, and timestamp
- Summarize the key content -- don't reproduce full emails
- Highlight explicit action items or deadlines
- Omit obvious spam, marketing, or automated notifications unless asked

## Priority Detection

Flag emails as **important / action required** if they contain:
- Direct requests to the user: "please review", "need your approval", "can you..."
- Deadlines or time-sensitive content
- Replies to threads the user started
- Emails from known important contacts (manager, key stakeholders -- check memory)
- Calendar invites or meeting changes
- Emails marked with high importance headers

Flag emails as **informational** if they contain:
- FYI/CC emails where the user isn't the primary recipient
- Status updates, newsletters from known senders
- Automated reports the user subscribes to

Flag emails as **low priority** if they contain:
- Marketing emails and promotions
- Automated notifications (CI/CD, monitoring, subscriptions)
- Bulk/mass emails

## Sender Prioritization

When processing unread emails, prioritize by sender:
1. User's manager, direct reports, key stakeholders (check memory)
2. Known colleagues and active collaborators
3. External contacts the user has corresponded with
4. Automated systems and notifications
5. Unknown senders and marketing

## Saving to Memory

After processing emails:
- Save action items and deadlines to persistent memory
- Save new contacts or relationships mentioned
- Save important decisions communicated via email
- Save meeting changes or schedule updates
- Do not save email content verbatim -- summarize key facts only
