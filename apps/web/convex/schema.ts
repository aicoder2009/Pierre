import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  conversations: defineTable({
    userId: v.string(),
    title: v.string(),
    sessionId: v.optional(v.string()),
    lastMessageAt: v.number(),
    isArchived: v.boolean(),
  })
    .index("by_user", ["userId", "lastMessageAt"])
    .index("by_session", ["sessionId"]),

  messages: defineTable({
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
    isStreaming: v.optional(v.boolean()),
    costUsd: v.optional(v.number()),
    tokenCount: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_conversation", ["conversationId", "createdAt"]),

  memories: defineTable({
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
    isActive: v.boolean(),
    lastAccessedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId", "isActive"])
    .index("by_user_type", ["userId", "type", "isActive"])
    .index("by_user_category", ["userId", "category", "isActive"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["userId", "type", "isActive"],
    }),

  userSettings: defineTable({
    userId: v.string(),
    displayName: v.optional(v.string()),
    timezone: v.optional(v.string()),
    enabledTools: v.array(v.string()),
    morningBriefingEnabled: v.boolean(),
    pushNotificationsEnabled: v.boolean(),
    preferredModel: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  scheduledTasks: defineTable({
    userId: v.string(),
    taskType: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed")
    ),
    result: v.optional(v.string()),
    scheduledFor: v.number(),
    executedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId", "status"])
    .index("by_status", ["status", "scheduledFor"]),
});
