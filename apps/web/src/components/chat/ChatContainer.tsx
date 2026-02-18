"use client";

import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { Bot, Loader2 } from "lucide-react";
import { Doc } from "../../../convex/_generated/dataModel";

interface ChatContainerProps {
  messages: Doc<"messages">[];
  isLoading: boolean;
  isRunning: boolean;
  onSend: (content: string) => void;
  title?: string;
}

export function ChatContainer({
  messages,
  isLoading,
  isRunning,
  onSend,
  title,
}: ChatContainerProps) {
  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border px-6 py-3 flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Bot className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="font-medium text-sm">{title ?? "Pierre"}</h2>
          {isRunning && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Thinking...
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages} isLoading={isLoading} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-4 shrink-0">
        <div className="max-w-3xl mx-auto">
          <MessageInput
            onSend={onSend}
            disabled={isRunning}
            placeholder="Message Pierre..."
          />
        </div>
      </div>
    </div>
  );
}
