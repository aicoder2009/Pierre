"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

export const run = action({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    // Get conversation for session resume
    const conversation = await ctx.runQuery(api.conversations.get, {
      id: args.conversationId,
    });

    // Get persistent memories for context (most important first)
    const listedMemories = await ctx.runQuery(api.memories.list, {
      userId: args.userId,
      type: "persistent",
      limit: 15,
    });

    // Also search for memories relevant to the current prompt
    const searchedMemories = args.prompt.length > 3
      ? await ctx.runQuery(api.memories.search, {
          userId: args.userId,
          query: args.prompt.slice(0, 200),
          limit: 10,
        })
      : [];

    // De-duplicate by ID, preserving order (listed first, then search additions)
    const seenIds = new Set(listedMemories.map((m) => m._id));
    const uniqueSearched = searchedMemories.filter((m) => !seenIds.has(m._id));
    const memories = [...listedMemories, ...uniqueSearched];

    const memoryContext = memories.length > 0
      ? "\n\nRelevant memories about the user:\n" +
        memories.map((m) => `- [${m.category}] ${m.content}`).join("\n")
      : "";

    // Get user settings
    const settings = await ctx.runQuery(api.settings.get, {
      userId: args.userId,
    });

    const displayName = settings?.displayName ?? "there";

    // Build system prompt
    const systemPrompt = `You are Pierre, a personal AI assistant for ${displayName}. You are helpful, concise, and personable. You have access to memory tools to remember important information about the user across conversations.${memoryContext}

Current date/time: ${new Date().toISOString()}
Timezone: ${settings?.timezone ?? "UTC"}`;

    try {
      // Import the Agent SDK dynamically
      const { query } = await import("@anthropic-ai/claude-code");

      const queryOptions: Parameters<typeof query>[0] = {
        prompt: args.prompt,
        options: {
          customSystemPrompt: systemPrompt,
          permissionMode: "bypassPermissions" as const,
          allowedTools: ["WebSearch", "WebFetch"],
          maxTurns: 10,
        },
      };

      // If we have a session ID, resume it
      if (conversation?.sessionId && queryOptions.options) {
        queryOptions.options.resume = conversation.sessionId;
      }

      let assistantMessageId: string | null = null;
      let fullContent = "";
      let sessionId: string | null = null;
      let totalCost = 0;

      for await (const message of query(queryOptions)) {
        if (message.type === "system" && "subtype" in message && message.subtype === "init") {
          sessionId = message.session_id;
          // Save session ID to conversation
          if (sessionId) {
            await ctx.runMutation(api.conversations.updateSessionId, {
              id: args.conversationId,
              sessionId,
            });
          }
        } else if (message.type === "assistant") {
          // Extract text from the assistant message content blocks
          const contentBlocks = message.message.content;
          let textContent = "";
          for (const block of contentBlocks) {
            if (block.type === "text") {
              textContent += block.text;
            }
          }
          if (textContent) {
            fullContent = textContent;
            // Upsert streaming message
            const msgId = await ctx.runMutation(api.messages.upsertAssistant, {
              conversationId: args.conversationId,
              messageId: assistantMessageId as any,
              content: fullContent,
              isStreaming: true,
            });
            if (!assistantMessageId) {
              assistantMessageId = msgId as any;
            }
          }

          // Check for tool use blocks
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
            ? (message.usage.input_tokens ?? 0) + (message.usage.output_tokens ?? 0)
            : 0;

          const resultContent = "result" in message ? message.result : "";

          // Finalize the assistant message
          if (assistantMessageId) {
            await ctx.runMutation(api.messages.upsertAssistant, {
              conversationId: args.conversationId,
              messageId: assistantMessageId as any,
              content: fullContent || resultContent || "I'm sorry, I couldn't generate a response.",
              isStreaming: false,
              costUsd: totalCost,
              tokenCount: totalTokens,
            });
          } else {
            // No streaming happened, just create the message
            await ctx.runMutation(api.messages.upsertAssistant, {
              conversationId: args.conversationId,
              content: resultContent || fullContent || "I'm sorry, I couldn't generate a response.",
              isStreaming: false,
              costUsd: totalCost,
              tokenCount: totalTokens,
            });
          }
        }
      }

      // Auto-generate title for new conversations
      if (conversation && !conversation.sessionId) {
        const titlePrompt = `Generate a short title (max 6 words) for a conversation that starts with: "${args.prompt.slice(0, 200)}". Return ONLY the title, no quotes.`;
        let title = args.prompt.slice(0, 50);
        try {
          for await (const msg of query({ prompt: titlePrompt, options: { maxTurns: 1 } })) {
            if (msg.type === "result" && "result" in msg && msg.result) {
              title = msg.result.trim().replace(/^["']|["']$/g, "");
            }
          }
        } catch {
          // Use truncated prompt as fallback
        }
        await ctx.runMutation(api.conversations.updateTitle, {
          id: args.conversationId,
          title,
        });
      }

      return { success: true, sessionId, cost: totalCost };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      // Save error as assistant message
      await ctx.runMutation(api.messages.upsertAssistant, {
        conversationId: args.conversationId,
        content: `I encountered an error: ${errorMessage}. Please check the API configuration.`,
        isStreaming: false,
      });
      return { success: false, error: errorMessage };
    }
  },
});
