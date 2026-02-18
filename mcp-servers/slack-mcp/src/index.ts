import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { WebClient } from "@slack/web-api";
import { z } from "zod";

const SLACK_TOKEN = process.env.SLACK_TOKEN;
if (!SLACK_TOKEN) {
  console.error("SLACK_TOKEN environment variable is required");
  process.exit(1);
}

const slack = new WebClient(SLACK_TOKEN);

const server = new McpServer({
  name: "pierre-slack",
  version: "0.1.0",
});

// slack_search_messages - Search Slack messages with a query string
server.tool(
  "slack_search_messages",
  "Search Slack messages with a query string. Returns formatted results with channel, author, timestamp, text.",
  {
    query: z.string().describe("Search query string"),
    count: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe("Number of results to return (default 20)"),
    sort: z
      .enum(["score", "timestamp"])
      .optional()
      .describe("Sort order (default score)"),
  },
  async ({ query, count, sort }) => {
    try {
      const result = await slack.search.messages({
        query,
        count: count ?? 20,
        sort: sort ?? "score",
      });

      const matches = result.messages?.matches ?? [];
      const formatted = matches.map((msg: any) => ({
        channel: msg.channel?.name ?? "unknown",
        author: msg.username ?? msg.user ?? "unknown",
        timestamp: msg.ts
          ? new Date(parseFloat(msg.ts) * 1000).toISOString()
          : "unknown",
        text: msg.text ?? "",
        permalink: msg.permalink ?? "",
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              { total: result.messages?.total ?? 0, results: formatted },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      return {
        content: [
          { type: "text" as const, text: `Error searching Slack messages: ${message}` },
        ],
        isError: true,
      };
    }
  }
);

// slack_list_channels - List all accessible channels
server.tool(
  "slack_list_channels",
  "List all accessible Slack channels",
  {
    limit: z
      .number()
      .int()
      .min(1)
      .max(1000)
      .optional()
      .describe("Maximum number of channels to return (default 100)"),
    types: z
      .string()
      .optional()
      .describe(
        "Comma-separated channel types: public_channel, private_channel, mpim, im (default public_channel)"
      ),
  },
  async ({ limit, types }) => {
    try {
      const result = await slack.conversations.list({
        limit: limit ?? 100,
        types: types ?? "public_channel",
      });

      const channels = (result.channels ?? []).map((ch: any) => ({
        id: ch.id,
        name: ch.name ?? ch.id,
        topic: ch.topic?.value ?? "",
        purpose: ch.purpose?.value ?? "",
        memberCount: ch.num_members ?? 0,
        isArchived: ch.is_archived ?? false,
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(channels, null, 2),
          },
        ],
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      return {
        content: [
          { type: "text" as const, text: `Error listing Slack channels: ${message}` },
        ],
        isError: true,
      };
    }
  }
);

// slack_read_channel - Read recent messages from a specific channel
server.tool(
  "slack_read_channel",
  "Read recent messages from a specific Slack channel",
  {
    channelId: z.string().describe("The channel ID to read messages from"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe("Number of messages to retrieve (default 20)"),
  },
  async ({ channelId, limit }) => {
    try {
      const result = await slack.conversations.history({
        channel: channelId,
        limit: limit ?? 20,
      });

      const messages = (result.messages ?? []).map((msg: any) => ({
        user: msg.user ?? "unknown",
        text: msg.text ?? "",
        timestamp: msg.ts
          ? new Date(parseFloat(msg.ts) * 1000).toISOString()
          : "unknown",
        threadTs: msg.thread_ts ?? null,
        replyCount: msg.reply_count ?? 0,
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              { channel: channelId, messages },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      return {
        content: [
          {
            type: "text" as const,
            text: `Error reading Slack channel ${channelId}: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// slack_get_unread - Get unread messages/mentions for the authenticated user
server.tool(
  "slack_get_unread",
  "Get unread messages and mentions for the authenticated user",
  {
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe("Maximum number of unread items to return (default 20)"),
  },
  async ({ limit }) => {
    try {
      // Get channels with unread messages
      const channelsResult = await slack.conversations.list({
        limit: 200,
        types: "public_channel,private_channel,mpim,im",
      });

      const unreadChannels: Array<{
        channelId: string;
        channelName: string;
        unreadCount: number;
        messages: Array<{ user: string; text: string; timestamp: string }>;
      }> = [];

      const maxItems = limit ?? 20;
      let totalCollected = 0;

      for (const channel of channelsResult.channels ?? []) {
        if (totalCollected >= maxItems) break;
        if (!channel.id) continue;

        // Check for unread messages via conversations.info
        try {
          const info = await slack.conversations.info({ channel: channel.id });
          const unreadCount = (info.channel as any)?.unread_count ?? 0;

          if (unreadCount > 0) {
            const remaining = maxItems - totalCollected;
            const fetchCount = Math.min(unreadCount, remaining, 10);

            const history = await slack.conversations.history({
              channel: channel.id,
              limit: fetchCount,
            });

            const messages = (history.messages ?? []).map((msg: any) => ({
              user: msg.user ?? "unknown",
              text: msg.text ?? "",
              timestamp: msg.ts
                ? new Date(parseFloat(msg.ts) * 1000).toISOString()
                : "unknown",
            }));

            unreadChannels.push({
              channelId: channel.id,
              channelName: channel.name ?? channel.id,
              unreadCount,
              messages,
            });

            totalCollected += messages.length;
          }
        } catch {
          // Skip channels we can't access
        }
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              { totalUnreadChannels: unreadChannels.length, channels: unreadChannels },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      return {
        content: [
          { type: "text" as const, text: `Error getting unread messages: ${message}` },
        ],
        isError: true,
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Pierre Slack MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
