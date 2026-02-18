"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import * as path from "path";

// ─── Agent Action ────────────────────────────────────────────────────────────

export const run = action({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    // Create a streaming placeholder immediately
    const streamingMsgId = await ctx.runMutation(api.messages.upsertAssistant, {
      conversationId: args.conversationId,
      content: "",
      isStreaming: true,
    });

    try {
      // Load context in parallel
      const [conversation, persistentMemories, settings] = await Promise.all([
        ctx.runQuery(api.conversations.get, { id: args.conversationId }),
        ctx.runQuery(api.memories.list, {
          userId: args.userId,
          type: "persistent",
          limit: 20,
        }),
        ctx.runQuery(api.settings.get, { userId: args.userId }),
      ]);

      // Search for prompt-relevant memories
      const searchedMemories =
        args.prompt.length > 3
          ? await ctx.runQuery(api.memories.search, {
              userId: args.userId,
              query: args.prompt.slice(0, 200),
              limit: 10,
            })
          : [];

      // De-duplicate memories
      const seenIds = new Set(persistentMemories.map((m) => m._id));
      const uniqueSearched = searchedMemories.filter(
        (m) => !seenIds.has(m._id)
      );
      const allMemories = [...persistentMemories, ...uniqueSearched];

      const displayName = settings?.displayName ?? "there";
      const memoryBlock =
        allMemories.length > 0
          ? `\n\nUser memories:\n${allMemories.map((m) => `- [${m.category}] ${m.content}`).join("\n")}`
          : "";

      const systemPrompt = `You are Pierre, a personal AI assistant for ${displayName}. You are helpful, concise, and personable.

Core behaviors:
- Address the user by name when known.
- Be proactive: when the user shares preferences, facts, or corrections, use the memory_save tool to remember them.
- Search memory when the user asks about something you might have stored.
- Keep responses focused and actionable.
- Use markdown for structured responses.
- For code, always use fenced code blocks with language specified.
${memoryBlock}

Current date/time: ${new Date().toISOString()}
User timezone: ${settings?.timezone ?? "UTC"}`;

      // Try Claude Code SDK first (works with Max subscription), fall back to Anthropic API
      const useClaudeCode = !process.env.ANTHROPIC_API_KEY;

      let result;
      if (useClaudeCode) {
        result = await runWithClaudeCode(
          ctx,
          args,
          systemPrompt,
          conversation?.sessionId ?? null,
          streamingMsgId,
          settings?.enabledTools ?? ["memory", "web_search"]
        );
      } else {
        result = await runWithAnthropicAPI(
          ctx,
          args,
          systemPrompt,
          streamingMsgId,
          settings?.preferredModel ?? "claude-sonnet-4-20250514",
          settings?.enabledTools ?? ["memory", "web_search"]
        );
      }

      // Auto-title new conversations
      if (conversation?.title === "New conversation") {
        await generateTitle(
          ctx,
          args.conversationId,
          args.prompt,
          useClaudeCode
        );
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      await ctx.runMutation(api.messages.upsertAssistant, {
        conversationId: args.conversationId,
        messageId: streamingMsgId,
        content: `I encountered an error: ${errorMessage}. Please check the configuration.`,
        isStreaming: false,
      });
      return { success: false, error: errorMessage };
    }
  },
});

// ─── Claude Code SDK (Max Subscription) ──────────────────────────────────────

async function runWithClaudeCode(
  ctx: any,
  args: { conversationId: Id<"conversations">; userId: string; prompt: string },
  systemPrompt: string,
  existingSessionId: string | null,
  streamingMsgId: Id<"messages">,
  enabledTools: string[]
) {
  const { query } = await import("@anthropic-ai/claude-code");

  // Resolve project root for skills discovery
  const projectRoot = path.resolve(process.cwd());

  const allowedTools: string[] = ["WebSearch", "WebFetch"];
  // Add MCP tool names based on enabled integrations
  if (enabledTools.includes("memory")) {
    allowedTools.push(
      "mcp__memory__memory_search",
      "mcp__memory__memory_save",
      "mcp__memory__memory_update",
      "mcp__memory__memory_delete",
      "mcp__memory__memory_list"
    );
  }
  if (enabledTools.includes("slack")) {
    allowedTools.push(
      "mcp__slack__slack_search_messages",
      "mcp__slack__slack_list_channels",
      "mcp__slack__slack_read_channel",
      "mcp__slack__slack_get_unread"
    );
  }
  if (enabledTools.includes("gmail")) {
    allowedTools.push(
      "mcp__gmail__gmail_search",
      "mcp__gmail__gmail_read_email",
      "mcp__gmail__gmail_list_unread",
      "mcp__gmail__gmail_list_labels"
    );
  }

  const convexUrl =
    process.env.NEXT_PUBLIC_CONVEX_URL ?? "https://giddy-bass-710.convex.cloud";

  // Build MCP servers config
  const mcpServers: Record<string, any> = {};
  if (enabledTools.includes("memory")) {
    const memoryMcpPath = path.resolve(
      projectRoot,
      "mcp-servers/memory-mcp/dist/index.js"
    );
    mcpServers.memory = {
      command: "node",
      args: [memoryMcpPath],
      env: {
        CONVEX_URL: convexUrl,
        USER_ID: args.userId,
      },
    };
  }
  if (enabledTools.includes("slack") && process.env.SLACK_TOKEN) {
    const slackMcpPath = path.resolve(
      projectRoot,
      "mcp-servers/slack-mcp/dist/index.js"
    );
    mcpServers.slack = {
      command: "node",
      args: [slackMcpPath],
      env: {
        SLACK_TOKEN: process.env.SLACK_TOKEN,
      },
    };
  }
  if (enabledTools.includes("gmail") && process.env.GMAIL_CREDENTIALS) {
    const gmailMcpPath = path.resolve(
      projectRoot,
      "mcp-servers/gmail-mcp/dist/index.js"
    );
    mcpServers.gmail = {
      command: "node",
      args: [gmailMcpPath],
      env: {
        GMAIL_CREDENTIALS: process.env.GMAIL_CREDENTIALS,
      },
    };
  }

  const queryOptions: Parameters<typeof query>[0] = {
    prompt: args.prompt,
    options: {
      customSystemPrompt: systemPrompt,
      permissionMode: "bypassPermissions" as const,
      allowedTools,
      maxTurns: 15,
      cwd: projectRoot,
    },
  };

  // Add MCP servers if any
  if (Object.keys(mcpServers).length > 0) {
    (queryOptions.options as any).mcpServers = mcpServers;
  }

  // Resume session if exists
  if (existingSessionId && queryOptions.options) {
    queryOptions.options.resume = existingSessionId;
  }

  let fullContent = "";
  let sessionId: string | null = null;
  let totalCost = 0;

  for await (const message of query(queryOptions)) {
    if (
      message.type === "system" &&
      "subtype" in message &&
      message.subtype === "init"
    ) {
      sessionId = message.session_id;
      if (sessionId) {
        await ctx.runMutation(api.conversations.updateSessionId, {
          id: args.conversationId,
          sessionId,
        });
      }
    } else if (message.type === "assistant") {
      const contentBlocks = message.message.content;
      let textContent = "";
      for (const block of contentBlocks) {
        if (block.type === "text") {
          textContent += block.text;
        }
      }

      if (textContent) {
        fullContent = textContent;
        await ctx.runMutation(api.messages.upsertAssistant, {
          conversationId: args.conversationId,
          messageId: streamingMsgId,
          content: fullContent,
          isStreaming: true,
        });
      }

      // Log tool use blocks
      for (const block of contentBlocks) {
        if (block.type === "tool_use") {
          await ctx.runMutation(api.messages.addToolMessage, {
            conversationId: args.conversationId,
            toolName: block.name ?? "unknown",
            toolInput: JSON.stringify(block.input ?? {}),
            toolResult: "",
          });
        }
      }
    } else if (message.type === "result") {
      totalCost = message.total_cost_usd ?? 0;
      const totalTokens = message.usage
        ? (message.usage.input_tokens ?? 0) +
          (message.usage.output_tokens ?? 0)
        : 0;
      const resultContent = "result" in message ? message.result : "";

      await ctx.runMutation(api.messages.upsertAssistant, {
        conversationId: args.conversationId,
        messageId: streamingMsgId,
        content:
          fullContent ||
          resultContent ||
          "I'm sorry, I couldn't generate a response.",
        isStreaming: false,
        costUsd: totalCost,
        tokenCount: totalTokens,
      });
    }
  }

  return { success: true, sessionId, cost: totalCost };
}

// ─── Direct Anthropic API (API Key) ─────────────────────────────────────────

async function runWithAnthropicAPI(
  ctx: any,
  args: { conversationId: Id<"conversations">; userId: string; prompt: string },
  systemPrompt: string,
  streamingMsgId: Id<"messages">,
  model: string,
  enabledTools: string[]
) {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const anthropic = new Anthropic();

  // Build conversation history
  const existingMessages = await ctx.runQuery(api.messages.list, {
    conversationId: args.conversationId,
  });

  const apiMessages: any[] = [];
  for (const msg of existingMessages) {
    if (msg._id === streamingMsgId) continue;
    if (msg.role === "tool") continue;
    if (msg.role === "user") {
      apiMessages.push({ role: "user", content: msg.content });
    } else if (msg.role === "assistant" && !msg.isStreaming) {
      apiMessages.push({ role: "assistant", content: msg.content });
    }
  }

  // Ensure latest user message
  const lastUser = apiMessages.filter((m: any) => m.role === "user").pop();
  if (
    !lastUser ||
    (typeof lastUser.content === "string" && lastUser.content !== args.prompt)
  ) {
    apiMessages.push({ role: "user", content: args.prompt });
  }

  const messages = ensureAlternatingRoles(apiMessages);

  // Memory tools
  const memoryTools: any[] = enabledTools.includes("memory")
    ? [
        {
          name: "memory_search",
          description:
            "Search user's memories. Use to recall facts, preferences, or context.",
          input_schema: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search query" },
              type: {
                type: "string",
                enum: ["session", "persistent", "archival"],
              },
            },
            required: ["query"],
          },
        },
        {
          name: "memory_save",
          description:
            "Save important info to memory. Use proactively when user shares preferences, facts, or corrections.",
          input_schema: {
            type: "object",
            properties: {
              content: { type: "string" },
              category: { type: "string" },
              importance: { type: "number" },
              type: {
                type: "string",
                enum: ["persistent", "archival"],
              },
            },
            required: ["content", "category", "importance"],
          },
        },
      ]
    : [];

  // Slack tools (Anthropic API path - calls Slack Web API directly)
  const slackTools: any[] =
    enabledTools.includes("slack") && process.env.SLACK_TOKEN
      ? [
          {
            name: "slack_search_messages",
            description: "Search Slack messages with a query string.",
            input_schema: {
              type: "object",
              properties: {
                query: { type: "string", description: "Search query" },
                count: { type: "number", description: "Number of results (default 20)" },
              },
              required: ["query"],
            },
          },
          {
            name: "slack_get_unread",
            description: "Get unread Slack messages and mentions.",
            input_schema: {
              type: "object",
              properties: {
                limit: { type: "number", description: "Max results (default 20)" },
              },
            },
          },
        ]
      : [];

  // Gmail tools (Anthropic API path - calls Gmail API directly)
  const gmailTools: any[] =
    enabledTools.includes("gmail") && process.env.GMAIL_CREDENTIALS
      ? [
          {
            name: "gmail_search",
            description: "Search emails with Gmail query syntax (e.g., 'from:someone subject:hello').",
            input_schema: {
              type: "object",
              properties: {
                query: { type: "string", description: "Gmail search query" },
                maxResults: { type: "number", description: "Max results (default 10)" },
              },
              required: ["query"],
            },
          },
          {
            name: "gmail_list_unread",
            description: "List unread emails.",
            input_schema: {
              type: "object",
              properties: {
                maxResults: { type: "number", description: "Max results (default 10)" },
              },
            },
          },
        ]
      : [];

  // Build tools
  const tools: any[] = [...memoryTools, ...slackTools, ...gmailTools];
  if (enabledTools.includes("web_search")) {
    tools.push({
      type: "web_search_20250305",
      name: "web_search",
      max_uses: 5,
    });
  }

  // Agentic loop
  let currentMessages = [...messages];
  let fullContent = "";
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (let i = 0; i < 15; i++) {
    const createParams: any = {
      model,
      max_tokens: 8192,
      system: systemPrompt,
      messages: currentMessages,
    };
    if (tools.length > 0) createParams.tools = tools;

    const response = await anthropic.messages.create(createParams);
    totalInputTokens += response.usage.input_tokens;
    totalOutputTokens += response.usage.output_tokens;

    let textContent = "";
    const toolUseBlocks: any[] = [];

    for (const block of response.content) {
      if (block.type === "text") textContent += block.text;
      else if (block.type === "tool_use") toolUseBlocks.push(block);
    }

    if (textContent) {
      fullContent += (fullContent ? "\n\n" : "") + textContent;
      await ctx.runMutation(api.messages.upsertAssistant, {
        conversationId: args.conversationId,
        messageId: streamingMsgId,
        content: fullContent,
        isStreaming: true,
      });
    }

    if (response.stop_reason === "end_turn" || toolUseBlocks.length === 0)
      break;

    // Execute tools
    const toolResults: any[] = [];
    for (const toolUse of toolUseBlocks) {
      await ctx.runMutation(api.messages.addToolMessage, {
        conversationId: args.conversationId,
        toolName: toolUse.name,
        toolInput: JSON.stringify(toolUse.input ?? {}),
        toolResult: "",
      });

      const result = await executeTool(
        ctx,
        args.userId,
        args.conversationId,
        toolUse
      );
      toolResults.push({
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: result,
      });
    }

    currentMessages.push({ role: "assistant", content: response.content });
    currentMessages.push({ role: "user", content: toolResults });
  }

  // Calculate cost
  const { inputRate, outputRate } = getModelPricing(model);
  const totalCost =
    (totalInputTokens * inputRate + totalOutputTokens * outputRate) / 1_000_000;

  await ctx.runMutation(api.messages.upsertAssistant, {
    conversationId: args.conversationId,
    messageId: streamingMsgId,
    content: fullContent || "I couldn't generate a response.",
    isStreaming: false,
    costUsd: totalCost,
    tokenCount: totalInputTokens + totalOutputTokens,
  });

  return { success: true, cost: totalCost };
}

// ─── Tool Execution (for Anthropic API path) ────────────────────────────────

async function executeTool(
  ctx: any,
  userId: string,
  conversationId: Id<"conversations">,
  toolUse: any
): Promise<string> {
  const input = toolUse.input as Record<string, any>;
  switch (toolUse.name) {
    case "memory_search": {
      const results = await ctx.runQuery(api.memories.search, {
        userId,
        query: input.query,
        type: input.type,
        limit: 10,
      });
      if (results.length === 0) return "No memories found.";
      return results
        .map((m: any) => `[${m.type}/${m.category}] ${m.content}`)
        .join("\n");
    }
    case "memory_save": {
      const id = await ctx.runMutation(api.memories.save, {
        userId,
        type: input.type ?? "persistent",
        category: input.category,
        content: input.content,
        importance: Math.min(10, Math.max(1, Math.round(input.importance))),
        conversationId,
        source: "agent",
      });
      return `Memory saved (id: ${id}).`;
    }
    case "slack_search_messages": {
      try {
        const { WebClient } = await import("@slack/web-api");
        const slack = new WebClient(process.env.SLACK_TOKEN);
        const result = await slack.search.messages({
          query: input.query,
          count: input.count ?? 20,
        });
        const matches = result.messages?.matches ?? [];
        return JSON.stringify(
          matches.slice(0, 10).map((m: any) => ({
            channel: m.channel?.name ?? "unknown",
            author: m.username ?? m.user ?? "unknown",
            text: m.text?.slice(0, 300) ?? "",
            timestamp: m.ts ? new Date(parseFloat(m.ts) * 1000).toISOString() : "",
          })),
          null,
          2
        );
      } catch (e: any) {
        return `Slack search error: ${e.message}`;
      }
    }
    case "slack_get_unread": {
      try {
        const { WebClient } = await import("@slack/web-api");
        const slack = new WebClient(process.env.SLACK_TOKEN);
        const channels = await slack.conversations.list({ limit: 50, types: "public_channel,private_channel,im" });
        const unread: any[] = [];
        for (const ch of (channels.channels ?? []).slice(0, 20)) {
          if (!ch.id) continue;
          try {
            const info = await slack.conversations.info({ channel: ch.id });
            const count = (info.channel as any)?.unread_count ?? 0;
            if (count > 0) unread.push({ channel: ch.name ?? ch.id, unreadCount: count });
          } catch { /* skip inaccessible channels */ }
        }
        return unread.length > 0 ? JSON.stringify(unread, null, 2) : "No unread messages.";
      } catch (e: any) {
        return `Slack unread error: ${e.message}`;
      }
    }
    case "gmail_search": {
      try {
        const { google } = await import("googleapis");
        const { readFileSync } = await import("node:fs");
        const creds = JSON.parse(readFileSync(process.env.GMAIL_CREDENTIALS!, "utf-8"));
        const gmailCreds = creds.installed
          ? { client_id: creds.installed.client_id, client_secret: creds.installed.client_secret, refresh_token: creds.refresh_token }
          : { client_id: creds.client_id, client_secret: creds.client_secret, refresh_token: creds.refresh_token };
        const { client_id, client_secret, refresh_token } = gmailCreds;
        const auth = new google.auth.OAuth2(client_id, client_secret);
        auth.setCredentials({ refresh_token });
        const gmail = google.gmail({ version: "v1", auth });
        const list = await gmail.users.messages.list({ userId: "me", q: input.query, maxResults: input.maxResults ?? 10 });
        const msgs = await Promise.all(
          (list.data.messages ?? []).map(async (m) => {
            const d = await gmail.users.messages.get({ userId: "me", id: m.id!, format: "metadata", metadataHeaders: ["Subject", "From", "Date"] });
            const headers = d.data.payload?.headers ?? [];
            const get = (n: string) => headers.find((h: any) => h.name.toLowerCase() === n.toLowerCase())?.value ?? "";
            return { subject: get("Subject"), from: get("From"), date: get("Date"), snippet: d.data.snippet ?? "" };
          })
        );
        return JSON.stringify(msgs, null, 2);
      } catch (e: any) {
        return `Gmail search error: ${e.message}`;
      }
    }
    case "gmail_list_unread": {
      try {
        const { google } = await import("googleapis");
        const { readFileSync } = await import("node:fs");
        const creds = JSON.parse(readFileSync(process.env.GMAIL_CREDENTIALS!, "utf-8"));
        const gmailCreds = creds.installed
          ? { client_id: creds.installed.client_id, client_secret: creds.installed.client_secret, refresh_token: creds.refresh_token }
          : { client_id: creds.client_id, client_secret: creds.client_secret, refresh_token: creds.refresh_token };
        const { client_id, client_secret, refresh_token } = gmailCreds;
        const auth = new google.auth.OAuth2(client_id, client_secret);
        auth.setCredentials({ refresh_token });
        const gmail = google.gmail({ version: "v1", auth });
        const list = await gmail.users.messages.list({ userId: "me", q: "is:unread", maxResults: input.maxResults ?? 10 });
        const msgs = await Promise.all(
          (list.data.messages ?? []).map(async (m) => {
            const d = await gmail.users.messages.get({ userId: "me", id: m.id!, format: "metadata", metadataHeaders: ["Subject", "From", "Date"] });
            const headers = d.data.payload?.headers ?? [];
            const get = (n: string) => headers.find((h: any) => h.name.toLowerCase() === n.toLowerCase())?.value ?? "";
            return { subject: get("Subject"), from: get("From"), date: get("Date"), snippet: d.data.snippet ?? "" };
          })
        );
        return msgs.length > 0 ? JSON.stringify(msgs, null, 2) : "No unread emails.";
      } catch (e: any) {
        return `Gmail unread error: ${e.message}`;
      }
    }
    default:
      return `Unknown tool: ${toolUse.name}`;
  }
}

// ─── Title Generation ────────────────────────────────────────────────────────

async function generateTitle(
  ctx: any,
  conversationId: Id<"conversations">,
  prompt: string,
  useClaudeCode: boolean
) {
  const titleText = `Generate a short title (max 6 words) for: "${prompt.slice(0, 200)}". Return ONLY the title.`;

  try {
    if (useClaudeCode) {
      const { query } = await import("@anthropic-ai/claude-code");
      let title = prompt.slice(0, 50);
      for await (const msg of query({
        prompt: titleText,
        options: { maxTurns: 1 },
      })) {
        if (msg.type === "result" && "result" in msg && msg.result) {
          title = msg.result.trim().replace(/^["']|["']$/g, "");
        }
      }
      await ctx.runMutation(api.conversations.updateTitle, {
        id: conversationId,
        title,
      });
    } else {
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const anthropic = new Anthropic();
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 30,
        messages: [{ role: "user", content: titleText }],
      });
      let title = prompt.slice(0, 50);
      for (const block of response.content) {
        if (block.type === "text")
          title = block.text.trim().replace(/^["']|["']$/g, "");
      }
      await ctx.runMutation(api.conversations.updateTitle, {
        id: conversationId,
        title,
      });
    }
  } catch {
    await ctx.runMutation(api.conversations.updateTitle, {
      id: conversationId,
      title: prompt.slice(0, 50),
    });
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ensureAlternatingRoles(messages: any[]): any[] {
  if (messages.length === 0) return [];
  const result: any[] = [];
  for (const msg of messages) {
    const last = result[result.length - 1];
    if (last && last.role === msg.role) {
      if (typeof last.content === "string" && typeof msg.content === "string") {
        last.content = last.content + "\n\n" + msg.content;
      }
    } else {
      result.push({ ...msg });
    }
  }
  while (result.length > 0 && result[0].role !== "user") result.shift();
  return result;
}

function getModelPricing(model: string) {
  if (model.includes("opus")) return { inputRate: 15, outputRate: 75 };
  if (model.includes("haiku")) return { inputRate: 0.8, outputRate: 4 };
  return { inputRate: 3, outputRate: 15 };
}
