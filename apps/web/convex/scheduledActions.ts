"use node";

import { internalAction } from "./_generated/server";
import { internal, api } from "./_generated/api";

const MORNING_BRIEFING_PROMPT = `Good morning! Please give me my morning briefing for today.

Review my memories for any pending action items, upcoming deadlines, or important context.
If I have Slack or Gmail connected, check for unread messages overnight.

Format the briefing as:
# Good morning!

## Urgent
[Anything requiring immediate attention, or "Nothing urgent"]

## Pending Action Items
[Action items from memory, or "No pending items"]

## Today's Focus
[Key things to be aware of today based on memory context]

Keep it concise and scannable. End by asking if I want to dive deeper into anything.`;

export const runMorningBriefings = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    console.log("Morning briefing cron triggered at", now.toISOString());

    // Find all users with morning briefing enabled
    const users = await ctx.runQuery(internal.settings.listWithBriefingEnabled);
    console.log(`Found ${users.length} users with morning briefing enabled`);

    const dateLabel = now.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    for (const userSettings of users) {
      try {
        // Create a new conversation for this briefing
        const conversationId = await ctx.runMutation(api.conversations.create, {
          userId: userSettings.userId,
          title: `Morning Briefing – ${dateLabel}`,
        });

        // Save the briefing request as a user message
        await ctx.runMutation(api.messages.send, {
          conversationId,
          role: "user",
          content: MORNING_BRIEFING_PROMPT,
        });

        // Log the scheduled task
        await ctx.runMutation(internal.scheduledMutations.logBriefingTask, {
          userId: userSettings.userId,
          conversationId,
        });

        // Run the agent to generate the briefing
        await ctx.runAction(api.agent.run, {
          conversationId,
          userId: userSettings.userId,
          prompt: MORNING_BRIEFING_PROMPT,
        });

        console.log(`Morning briefing completed for user ${userSettings.userId}`);
      } catch (err) {
        console.error(`Morning briefing failed for user ${userSettings.userId}:`, err);
      }
    }
  },
});

export const cleanupSessionMemories = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log("Session memory cleanup triggered at", new Date().toISOString());
    await ctx.runMutation(internal.scheduledMutations.archiveOldSessions);
  },
});
