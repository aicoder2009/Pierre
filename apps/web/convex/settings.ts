import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";

export const get = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

export const upsert = mutation({
  args: {
    userId: v.string(),
    displayName: v.optional(v.string()),
    timezone: v.optional(v.string()),
    enabledTools: v.optional(v.array(v.string())),
    morningBriefingEnabled: v.optional(v.boolean()),
    pushNotificationsEnabled: v.optional(v.boolean()),
    preferredModel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      const updates: Record<string, unknown> = {};
      if (args.displayName !== undefined) updates.displayName = args.displayName;
      if (args.timezone !== undefined) updates.timezone = args.timezone;
      if (args.enabledTools !== undefined) updates.enabledTools = args.enabledTools;
      if (args.morningBriefingEnabled !== undefined) updates.morningBriefingEnabled = args.morningBriefingEnabled;
      if (args.pushNotificationsEnabled !== undefined) updates.pushNotificationsEnabled = args.pushNotificationsEnabled;
      if (args.preferredModel !== undefined) updates.preferredModel = args.preferredModel;
      await ctx.db.patch(existing._id, updates);
      return existing._id;
    }

    return await ctx.db.insert("userSettings", {
      userId: args.userId,
      displayName: args.displayName,
      timezone: args.timezone ?? "America/New_York",
      enabledTools: args.enabledTools ?? ["memory", "web_search"],
      morningBriefingEnabled: args.morningBriefingEnabled ?? false,
      pushNotificationsEnabled: args.pushNotificationsEnabled ?? false,
      preferredModel: args.preferredModel,
    });
  },
});

// Internal: find all users who have morning briefing enabled
export const listWithBriefingEnabled = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("userSettings")
      .filter((q) => q.eq(q.field("morningBriefingEnabled"), true))
      .collect();
  },
});
