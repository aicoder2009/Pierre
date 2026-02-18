# Web Research Skill

## Overview

Pierre can search the web and fetch content from URLs to provide the user with current, accurate information beyond the AI's training data.

## Available Tools

- `WebSearch` -- Search the web with a query string. Returns search results with titles, snippets, and URLs.
- `WebFetch` -- Fetch and parse content from a specific URL. Converts HTML to readable text.

## When to Use Web Research

- The user asks about current events, recent news, or time-sensitive information
- The user asks a factual question you are not confident about
- The user asks about a product, service, or tool and wants up-to-date details
- The user provides a URL and asks you to read or summarize it
- The user asks to "look up" or "search for" something
- Information from your training data may be outdated

## Search Strategy

### Step 1: Formulate the Query
- Use specific, targeted search terms
- Include relevant qualifiers: dates, names, technical terms
- For technical topics, include the technology name and version
- Avoid overly broad queries -- narrow down to what the user actually needs

### Step 2: Execute the Search
- Use `WebSearch` with a clear query
- Review the results for relevance before presenting them
- If initial results are insufficient, refine the query and search again (up to 2-3 attempts)

### Step 3: Deep Dive (if needed)
- Use `WebFetch` to read the full content of the most relevant results
- Extract the specific information the user needs
- Cross-reference multiple sources for important claims

### Step 4: Synthesize and Present
- Combine information from multiple sources into a coherent answer
- Present findings in a structured, readable format
- Always cite sources (see Citation Guidelines below)

## Citation Guidelines

Always cite sources when presenting web research. Use inline citations:

```
According to [Source Name](URL), the latest version supports...
```

For multi-source summaries, include a sources list:

```
## Summary
[Your synthesized findings here]

**Sources:**
- [Article Title](URL) -- brief description of what this source covers
- [Article Title](URL) -- brief description of what this source covers
```

Rules:
- Never present web-sourced information without attribution.
- Link to the original source, not an intermediary.
- If multiple sources agree, cite the most authoritative one.
- If sources conflict, note the disagreement and cite both.

## Saving Research to Memory

Save research to archival memory when:
- The user explicitly asks to save or bookmark the information
- The research is on a topic the user is actively working on (check memory for projects)
- The findings include reference material the user is likely to need again
- The research took significant effort and would be costly to reproduce

When saving, include:
- A clear title/topic
- The key findings (summarized, not raw content)
- Source URLs for future reference
- The date of the research (information may become outdated)

## Error Handling

- If `WebSearch` returns no results, try alternative search terms before telling the user.
- If `WebFetch` fails on a URL, inform the user and suggest alternatives (cached version, different source).
- If content is paywalled or inaccessible, let the user know and summarize whatever is available from the search snippet.
- Never fabricate URLs or citations. If you cannot find a source, say so.
