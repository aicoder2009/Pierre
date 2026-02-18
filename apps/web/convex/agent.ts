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
  // Add MCP tool names if memory is enabled
  if (enabledTools.includes("memory")) {
    allowedTools.push(
      "mcp__memory__memory_search",
      "mcp__memory__memory_save",
      "mcp__memory__memory_update",
      "mcp__memory__memory_delete",
      "mcp__memory__memory_list"
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

  // Build tools
  const tools: any[] = [...memoryTools];
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
