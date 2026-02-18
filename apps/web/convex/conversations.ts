import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) =>
        q.eq("userId", args.userId)
      )
      .order("desc")
      .filter((q) => q.eq(q.field("isArchived"), false))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getBySessionId = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("conversations")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();
  },
});

export const create = mutation({
  args: {
    userId: v.string(),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("conversations", {
      userId: args.userId,
      title: args.title ?? "New conversation",
      lastMessageAt: Date.now(),
      isArchived: false,
    });
  },
});

export const updateTitle = mutation({
  args: {
    id: v.id("conversations"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { title: args.title });
  },
});

export const updateSessionId = mutation({
  args: {
    id: v.id("conversations"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { sessionId: args.sessionId });
  },
});

export const archive = mutation({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isArchived: true });
  },
});

export const remove = mutation({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.id))
      .collect();
    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }
    await ctx.db.delete(args.id);
  },
});

export const touch = mutation({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { lastMessageAt: Date.now() });
  },
});
