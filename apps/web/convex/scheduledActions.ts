"use node";

import { internalAction } from "./_generated/server";
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
    await ctx.runMutation(internal.scheduledMutations.archiveOldSessions);
  },
});
