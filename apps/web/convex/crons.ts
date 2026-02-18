import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Morning briefing - runs at 8 AM UTC daily
// Users can configure their timezone in settings
crons.daily(
  "morning-briefing",
  { hourUTC: 13, minuteUTC: 0 }, // 8 AM EST
  internal.scheduledActions.runMorningBriefings
);

// Memory cleanup - archive old session memories weekly
crons.weekly(
  "memory-cleanup",
  { dayOfWeek: "sunday", hourUTC: 4, minuteUTC: 0 },
  internal.scheduledActions.cleanupSessionMemories
);

export default crons;
