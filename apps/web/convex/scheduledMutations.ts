import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const archiveOldSessions = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Deactivate session memories older than 7 days
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const oldMemories = await ctx.db
      .query("memories")
      .filter((q) =>
        q.and(
          q.eq(q.field("type"), "session"),
          q.eq(q.field("isActive"), true),
          q.lt(q.field("lastAccessedAt"), sevenDaysAgo)
        )
      )
      .collect();

    for (const memory of oldMemories) {
      await ctx.db.patch(memory._id, { isActive: false });
    }

    console.log(`Archived ${oldMemories.length} old session memories`);
  },
});

export const logBriefingTask = internalMutation({
  args: {
    userId: v.string(),
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("scheduledTasks", {
      userId: args.userId,
      taskType: "morningBriefing",
      status: "running",
      scheduledFor: Date.now(),
      createdAt: Date.now(),
    });
  },
});
