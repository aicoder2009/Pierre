"use client";

import { cn } from "@/lib/utils";
import { Bot, Wrench, Copy, Check, ChevronDown, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { useState, useCallback } from "react";
import { Doc } from "../../../convex/_generated/dataModel";

interface MessageBubbleProps {
  message: Doc<"messages">;
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1 h-6">
      <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]" />
      <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]" />
      <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" />
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-1.5 rounded-md bg-zinc-700/80 hover:bg-zinc-600 text-zinc-300 hover:text-zinc-100 transition-colors opacity-0 group-hover/code:opacity-100"
      title="Copy code"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isTool = message.role === "tool";
  const isAssistant = message.role === "assistant";
  const isStreaming = message.isStreaming;

  if (isTool) {
    return <ToolIndicator message={message} />;
  }

  if (isUser) {
    return (
      <div className="flex justify-end py-2 px-4 max-w-3xl mx-auto w-full">
        <div className="max-w-[75%] rounded-3xl bg-primary text-primary-foreground px-5 py-3 text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex gap-3 py-4 px-4 max-w-3xl mx-auto w-full">
      <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
        <Bot className="w-3.5 h-3.5 text-primary" />
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        {isStreaming && !message.content ? (
          <TypingDots />
        ) : (
          <div
            className={cn(
              "prose prose-invert prose-sm max-w-none",
              "prose-p:leading-relaxed prose-p:my-2 first:prose-p:mt-0 last:prose-p:mb-0",
              "prose-li:my-0.5 prose-ul:my-2 prose-ol:my-2",
              "prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-700/60 prose-pre:rounded-xl prose-pre:text-xs prose-pre:my-3 prose-pre:p-0",
              "prose-code:text-pink-400 prose-code:bg-zinc-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono",
              "prose-headings:text-foreground prose-headings:font-semibold",
              "prose-strong:text-foreground prose-strong:font-semibold",
              "prose-blockquote:border-l-primary/40 prose-blockquote:text-muted-foreground prose-blockquote:not-italic",
              "prose-hr:border-border/40",
              "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
              "prose-table:text-sm prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2 prose-th:border-border prose-td:border-border"
            )}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                pre({ children, ...props }) {
                  // Extract code text for copy button
                  const codeText = extractCodeText(children);
                  return (
                    <div className="relative group/code">
                      <pre {...props} className="overflow-x-auto p-4 text-xs">
                        {children}
                      </pre>
                      {codeText && <CopyButton text={codeText} />}
                    </div>
                  );
                },
                // Prevent double-styling inline code vs code blocks
                code({ className, children, ...props }) {
                  const isBlock = className?.includes("hljs") || className?.includes("language-");
                  if (isBlock) {
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }
                  return (
                    <code
                      className="text-pink-400 bg-zinc-800/80 px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-0.5 h-4 bg-primary/80 animate-pulse ml-0.5 align-text-bottom" />
            )}
          </div>
        )}

        {!isStreaming && isAssistant && message.costUsd !== undefined && message.costUsd > 0 && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground/40 pt-1">
            <span>${message.costUsd.toFixed(4)}</span>
            {message.tokenCount && (
              <span>{message.tokenCount.toLocaleString()} tokens</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tool Indicator ──────────────────────────────────────────────────────────

function ToolIndicator({ message }: { message: Doc<"messages"> }) {
  const [expanded, setExpanded] = useState(false);
  const hasInput = message.toolInput && message.toolInput !== "{}";

  const toolDisplayName = getToolDisplayName(message.toolName ?? "unknown");

  return (
    <div className="py-1.5 px-4 my-1 max-w-3xl mx-auto w-full">
      <button
        onClick={() => hasInput && setExpanded(!expanded)}
        className={cn(
          "flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 transition-colors",
          hasInput && "hover:bg-muted/60 cursor-pointer"
        )}
      >
        <Wrench className="w-3 h-3 shrink-0 text-muted-foreground/60" />
        <span>
          Used{" "}
          <span className="font-medium text-foreground/70">
            {toolDisplayName}
          </span>
        </span>
        {hasInput && (
          expanded ? (
            <ChevronDown className="w-3 h-3 ml-1" />
          ) : (
            <ChevronRight className="w-3 h-3 ml-1" />
          )
        )}
      </button>
      {expanded && hasInput && (
        <div className="mt-1 ml-8 text-xs text-muted-foreground/60 bg-muted/20 rounded-lg p-2 font-mono">
          {formatToolInput(message.toolInput!)}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractCodeText(children: any): string {
  if (!children) return "";
  if (typeof children === "string") return children;
  if (Array.isArray(children)) {
    return children.map(extractCodeText).join("");
  }
  if (children?.props?.children) {
    return extractCodeText(children.props.children);
  }
  return "";
}

function getToolDisplayName(toolName: string): string {
  const names: Record<string, string> = {
    memory_search: "Memory Search",
    memory_save: "Save to Memory",
    memory_update: "Update Memory",
    web_search: "Web Search",
    WebSearch: "Web Search",
    WebFetch: "Web Fetch",
    slack_search_messages: "Slack Search",
    slack_list_channels: "Slack Channels",
    slack_read_channel: "Read Slack Channel",
    slack_get_unread: "Slack Unread",
    gmail_search: "Gmail Search",
    gmail_read_email: "Read Email",
    gmail_list_unread: "Unread Emails",
    gmail_list_labels: "Gmail Labels",
  };
  return names[toolName] ?? toolName;
}

function formatToolInput(input: string): string {
  try {
    const parsed = JSON.parse(input);
    return Object.entries(parsed)
      .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
      .join("\n");
  } catch {
    return input;
  }
}
