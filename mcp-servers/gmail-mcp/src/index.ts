import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { google } from "googleapis";
import { z } from "zod";
import { readFileSync } from "node:fs";

const GMAIL_CREDENTIALS = process.env.GMAIL_CREDENTIALS;
if (!GMAIL_CREDENTIALS) {
  console.error("GMAIL_CREDENTIALS environment variable is required (path to OAuth2 JSON file)");
  process.exit(1);
}

function createGmailClient() {
  const credentials = JSON.parse(readFileSync(GMAIL_CREDENTIALS!, "utf-8"));

  const { client_id, client_secret, refresh_token } = credentials.installed
    ? { ...credentials.installed, refresh_token: credentials.refresh_token }
    : credentials;

  const auth = new google.auth.OAuth2(client_id, client_secret);
  auth.setCredentials({ refresh_token });

  return google.gmail({ version: "v1", auth });
}

const gmail = createGmailClient();

const server = new McpServer({
  name: "pierre-gmail",
  version: "0.1.0",
});

function decodeBase64Url(data: string): string {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
}

function extractBody(payload: any): string {
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  if (payload.parts) {
    // Prefer text/plain, fall back to text/html
    const textPart = payload.parts.find(
      (p: any) => p.mimeType === "text/plain"
    );
    if (textPart?.body?.data) {
      return decodeBase64Url(textPart.body.data);
    }

    const htmlPart = payload.parts.find(
      (p: any) => p.mimeType === "text/html"
    );
    if (htmlPart?.body?.data) {
      return decodeBase64Url(htmlPart.body.data);
    }

    // Recurse into nested multipart
    for (const part of payload.parts) {
      if (part.parts) {
        const nested = extractBody(part);
        if (nested) return nested;
      }
    }
  }

  return "";
}

function getHeader(headers: any[], name: string): string {
  const header = headers?.find(
    (h: any) => h.name.toLowerCase() === name.toLowerCase()
  );
  return header?.value ?? "";
}

// gmail_search - Search emails with Gmail query syntax
server.tool(
  "gmail_search",
  "Search emails with Gmail query syntax. Returns formatted results with subject, from, date, snippet.",
  {
    query: z
      .string()
      .describe("Gmail search query (e.g., 'from:someone subject:hello')"),
    maxResults: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe("Maximum number of results (default 10)"),
  },
  async ({ query, maxResults }) => {
    try {
      const listResult = await gmail.users.messages.list({
        userId: "me",
        q: query,
        maxResults: maxResults ?? 10,
      });

      const messages = listResult.data.messages ?? [];
      const results = await Promise.all(
        messages.map(async (msg) => {
          const detail = await gmail.users.messages.get({
            userId: "me",
            id: msg.id!,
            format: "metadata",
            metadataHeaders: ["Subject", "From", "Date"],
          });

          const headers = detail.data.payload?.headers ?? [];
          return {
            id: msg.id,
            threadId: msg.threadId,
            subject: getHeader(headers, "Subject"),
            from: getHeader(headers, "From"),
            date: getHeader(headers, "Date"),
            snippet: detail.data.snippet ?? "",
          };
        })
      );

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              { total: listResult.data.resultSizeEstimate ?? 0, results },
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
        content: [{ type: "text" as const, text: `Error searching emails: ${message}` }],
        isError: true,
      };
    }
  }
);

// gmail_read_email - Read full email content by message ID
server.tool(
  "gmail_read_email",
  "Read full email content by message ID",
  {
    messageId: z.string().describe("The Gmail message ID to read"),
  },
  async ({ messageId }) => {
    try {
      const detail = await gmail.users.messages.get({
        userId: "me",
        id: messageId,
        format: "full",
      });

      const headers = detail.data.payload?.headers ?? [];
      const body = extractBody(detail.data.payload);

      const email = {
        id: detail.data.id,
        threadId: detail.data.threadId,
        subject: getHeader(headers, "Subject"),
        from: getHeader(headers, "From"),
        to: getHeader(headers, "To"),
        cc: getHeader(headers, "Cc"),
        date: getHeader(headers, "Date"),
        body,
        labels: detail.data.labelIds ?? [],
      };

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(email, null, 2),
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
            text: `Error reading email ${messageId}: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// gmail_list_unread - List unread emails with optional limit
server.tool(
  "gmail_list_unread",
  "List unread emails with optional limit",
  {
    maxResults: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe("Maximum number of unread emails to return (default 10)"),
  },
  async ({ maxResults }) => {
    try {
      const listResult = await gmail.users.messages.list({
        userId: "me",
        q: "is:unread",
        maxResults: maxResults ?? 10,
      });

      const messages = listResult.data.messages ?? [];
      const results = await Promise.all(
        messages.map(async (msg) => {
          const detail = await gmail.users.messages.get({
            userId: "me",
            id: msg.id!,
            format: "metadata",
            metadataHeaders: ["Subject", "From", "Date"],
          });

          const headers = detail.data.payload?.headers ?? [];
          return {
            id: msg.id,
            threadId: msg.threadId,
            subject: getHeader(headers, "Subject"),
            from: getHeader(headers, "From"),
            date: getHeader(headers, "Date"),
            snippet: detail.data.snippet ?? "",
          };
        })
      );

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                totalUnread: listResult.data.resultSizeEstimate ?? 0,
                results,
              },
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
          { type: "text" as const, text: `Error listing unread emails: ${message}` },
        ],
        isError: true,
      };
    }
  }
);

// gmail_list_labels - List all Gmail labels
server.tool(
  "gmail_list_labels",
  "List all Gmail labels",
  {},
  async () => {
    try {
      const result = await gmail.users.labels.list({ userId: "me" });
      const labels = (result.data.labels ?? []).map((label) => ({
        id: label.id,
        name: label.name,
        type: label.type,
        messagesTotal: label.messagesTotal ?? 0,
        messagesUnread: label.messagesUnread ?? 0,
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(labels, null, 2),
          },
        ],
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      return {
        content: [
          { type: "text" as const, text: `Error listing labels: ${message}` },
        ],
        isError: true,
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Pierre Gmail MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
