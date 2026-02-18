"use node";

import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

export const runMorningBriefings = internalAction({
  args: {},
  handler: async (ctx) => {
    // Find all users who have morning briefing enabled
    // In production, this would query userSettings and trigger agent runs
    // For now, this is a placeholder for the morning briefing cron
    console.log("Morning briefing cron triggered at", new Date().toISOString());

    // TODO: Query all users with morningBriefingEnabled = true
    // For each user, create a conversation and run the morning-briefing skill
  },
});

export const cleanupSessionMemories = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log("Session memory cleanup triggered at", new Date().toISOString());
    await ctx.runMutation(internal.scheduledActions.archiveOldSessions);
  },
});

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
