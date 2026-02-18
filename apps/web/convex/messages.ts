import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .collect();
  },
});

export const send = mutation({
  args: {
    conversationId: v.id("conversations"),
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system"),
      v.literal("tool")
    ),
    content: v.string(),
    toolName: v.optional(v.string()),
    toolInput: v.optional(v.string()),
    toolResult: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      role: args.role,
      content: args.content,
      toolName: args.toolName,
      toolInput: args.toolInput,
      toolResult: args.toolResult,
      createdAt: Date.now(),
    });
    await ctx.db.patch(args.conversationId, { lastMessageAt: Date.now() });
    return messageId;
  },
});

export const upsertAssistant = mutation({
  args: {
    conversationId: v.id("conversations"),
    messageId: v.optional(v.id("messages")),
    content: v.string(),
    isStreaming: v.optional(v.boolean()),
    costUsd: v.optional(v.number()),
    tokenCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.messageId) {
      await ctx.db.patch(args.messageId, {
        content: args.content,
        isStreaming: args.isStreaming ?? false,
        costUsd: args.costUsd,
        tokenCount: args.tokenCount,
      });
      return args.messageId;
    }
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      role: "assistant",
      content: args.content,
      isStreaming: args.isStreaming ?? true,
      costUsd: args.costUsd,
      tokenCount: args.tokenCount,
      createdAt: Date.now(),
    });
    await ctx.db.patch(args.conversationId, { lastMessageAt: Date.now() });
    return messageId;
  },
});

export const addToolMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    toolName: v.string(),
    toolInput: v.string(),
    toolResult: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      role: "tool",
      content: `Used ${args.toolName}`,
      toolName: args.toolName,
      toolInput: args.toolInput,
      toolResult: args.toolResult,
      createdAt: Date.now(),
    });
  },
});

export const getLatest = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("desc")
      .first();
  },
});
