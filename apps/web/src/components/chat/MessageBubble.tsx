"use client";

import { cn } from "@/lib/utils";
import { Bot, Wrench } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isTool = message.role === "tool";
  const isAssistant = message.role === "assistant";
  const isStreaming = message.isStreaming;

  if (isTool) {
    return (
      <div className="flex items-center gap-2 py-1.5 px-4 my-1 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-full px-3 py-1.5">
          <Wrench className="w-3 h-3 shrink-0" />
          <span>Used <span className="font-medium text-foreground/70">{message.toolName}</span></span>
        </div>
      </div>
    );
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

  // Assistant message — no bubble, flush left with avatar
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
              "prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-700/60 prose-pre:rounded-xl prose-pre:text-xs",
              "prose-code:text-pink-400 prose-code:bg-zinc-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono",
              "prose-headings:text-foreground prose-headings:font-semibold",
              "prose-strong:text-foreground prose-strong:font-semibold",
              "prose-blockquote:border-l-primary/40 prose-blockquote:text-muted-foreground prose-blockquote:not-italic",
              "prose-hr:border-border/40",
              "prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
            )}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
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
