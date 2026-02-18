import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ConvexHttpClient } from "convex/browser";
import { z } from "zod";

const CONVEX_URL = process.env.CONVEX_URL;
if (!CONVEX_URL) {
  console.error("CONVEX_URL environment variable is required");
  process.exit(1);
}

const USER_ID = process.env.USER_ID;
if (!USER_ID) {
  console.error("USER_ID environment variable is required");
  process.exit(1);
}

const convex = new ConvexHttpClient(CONVEX_URL);

const server = new McpServer({
  name: "pierre-memory",
  version: "0.1.0",
});

// memory_search - Search memories by query text and optional type filter
server.tool(
  "memory_search",
  "Search memories by query text and optional type filter (session/persistent/archival). Use this to recall facts, preferences, or context about the user.",
  {
    query: z.string().describe("Search query text"),
    type: z
      .enum(["session", "persistent", "archival"])
      .optional()
      .describe("Filter by memory type"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe("Maximum number of results (default 10)"),
  },
  async ({ query, type, limit }) => {
    try {
      const args: Record<string, unknown> = { userId: USER_ID, query };
      if (type) args.type = type;
      if (limit) args.limit = limit;

      const results = await convex.query("memories:search" as any, args);
      if (!results || (results as any[]).length === 0) {
        return {
          content: [{ type: "text" as const, text: "No memories found matching this query." }],
        };
      }
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [{ type: "text" as const, text: `Error searching memories: ${message}` }],
        isError: true,
      };
    }
  }
);

// memory_save - Save a new memory
server.tool(
  "memory_save",
  "Save important information to memory. Use this PROACTIVELY when the user shares preferences, facts, corrections, or anything worth remembering.",
  {
    content: z.string().describe("The memory content to save"),
    type: z
      .enum(["session", "persistent", "archival"])
      .describe("Memory type: persistent=cross-session facts, archival=reference material"),
    category: z.string().describe("Category (e.g., preference, fact, project, contact, decision)"),
    importance: z
      .number()
      .int()
      .min(1)
      .max(10)
      .describe("Importance 1-10 (10=critical, 5=useful, 1=minor)"),
    source: z.string().optional().describe("Source of the memory"),
    conversationId: z.string().optional().describe("Associated conversation ID"),
  },
  async ({ content, type, category, importance, source, conversationId }) => {
    try {
      const args: Record<string, unknown> = {
        userId: USER_ID,
        content,
        type,
        category,
        importance,
      };
      if (source) args.source = source;
      if (conversationId) args.conversationId = conversationId;

      const result = await convex.mutation("memories:save" as any, args);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ success: true, id: result }, null, 2),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [{ type: "text" as const, text: `Error saving memory: ${message}` }],
        isError: true,
      };
    }
  }
);

// memory_update - Update an existing memory by ID
server.tool(
  "memory_update",
  "Update an existing memory when information changes or needs correction.",
  {
    id: z.string().describe("The memory ID to update"),
    content: z.string().optional().describe("Updated memory content"),
    category: z.string().optional().describe("Updated category"),
    importance: z.number().int().min(1).max(10).optional().describe("Updated importance"),
  },
  async ({ id, content, category, importance }) => {
    try {
      const args: Record<string, unknown> = { id };
      if (content !== undefined) args.content = content;
      if (category !== undefined) args.category = category;
      if (importance !== undefined) args.importance = importance;

      await convex.mutation("memories:update" as any, args);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify({ success: true }, null, 2) },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [{ type: "text" as const, text: `Error updating memory: ${message}` }],
        isError: true,
      };
    }
  }
);

// memory_delete - Soft delete a memory by ID
server.tool(
  "memory_delete",
  "Delete a memory by ID (soft delete)",
  {
    id: z.string().describe("The memory ID to delete"),
  },
  async ({ id }) => {
    try {
      await convex.mutation("memories:remove" as any, { id });
      return {
        content: [
          { type: "text" as const, text: JSON.stringify({ success: true }, null, 2) },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [{ type: "text" as const, text: `Error deleting memory: ${message}` }],
        isError: true,
      };
    }
  }
);

// memory_list - List memories with optional filters
server.tool(
  "memory_list",
  "List memories with optional filters by type, category, and active status.",
  {
    type: z.enum(["session", "persistent", "archival"]).optional(),
    category: z.string().optional(),
    limit: z.number().int().min(1).max(100).optional(),
    isActive: z.boolean().optional(),
  },
  async ({ type, category, limit, isActive }) => {
    try {
      const args: Record<string, unknown> = { userId: USER_ID };
      if (type) args.type = type;
      if (category) args.category = category;
      if (limit) args.limit = limit;
      if (isActive !== undefined) args.isActive = isActive;

      const results = await convex.query("memories:list" as any, args);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(results, null, 2) },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [{ type: "text" as const, text: `Error listing memories: ${message}` }],
        isError: true,
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Pierre Memory MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
