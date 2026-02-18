import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const search = query({
  args: {
    userId: v.string(),
    query: v.string(),
    type: v.optional(
      v.union(
        v.literal("session"),
        v.literal("persistent"),
        v.literal("archival")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let searchQuery = ctx.db
      .query("memories")
      .withSearchIndex("search_content", (q) => {
        let sq = q.search("content", args.query).eq("userId", args.userId).eq("isActive", true);
        if (args.type) {
          sq = sq.eq("type", args.type);
        }
        return sq;
      });
    const results = await searchQuery.collect();
    const limit = args.limit ?? 10;
    return results.slice(0, limit);
  },
});

export const save = mutation({
  args: {
    userId: v.string(),
    type: v.union(
      v.literal("session"),
      v.literal("persistent"),
      v.literal("archival")
    ),
    category: v.string(),
    content: v.string(),
    source: v.optional(v.string()),
    conversationId: v.optional(v.id("conversations")),
    importance: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("memories", {
      userId: args.userId,
      type: args.type,
      category: args.category,
      content: args.content,
      source: args.source,
      conversationId: args.conversationId,
      importance: args.importance,
      isActive: true,
      lastAccessedAt: Date.now(),
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("memories"),
    content: v.optional(v.string()),
    category: v.optional(v.string()),
    importance: v.optional(v.number()),
    type: v.optional(
      v.union(
        v.literal("session"),
        v.literal("persistent"),
        v.literal("archival")
      )
    ),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(id, {
      ...filteredUpdates,
      lastAccessedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("memories") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isActive: false });
  },
});

export const list = query({
  args: {
    userId: v.string(),
    type: v.optional(
      v.union(
        v.literal("session"),
        v.literal("persistent"),
        v.literal("archival")
      )
    ),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const isActive = args.isActive ?? true;

    let results;
    if (args.type) {
      results = await ctx.db
        .query("memories")
        .withIndex("by_user_type", (q) =>
          q.eq("userId", args.userId).eq("type", args.type!).eq("isActive", isActive)
        )
        .order("desc")
        .collect();
    } else if (args.category) {
      results = await ctx.db
        .query("memories")
        .withIndex("by_user_category", (q) =>
          q.eq("userId", args.userId).eq("category", args.category!).eq("isActive", isActive)
        )
        .order("desc")
        .collect();
    } else {
      results = await ctx.db
        .query("memories")
        .withIndex("by_user", (q) =>
          q.eq("userId", args.userId).eq("isActive", isActive)
        )
        .order("desc")
        .collect();
    }

    const limit = args.limit ?? 50;
    return results.slice(0, limit);
  },
});

export const getById = query({
  args: { id: v.id("memories") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const markAccessed = mutation({
  args: { id: v.id("memories") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { lastAccessedAt: Date.now() });
  },
});
