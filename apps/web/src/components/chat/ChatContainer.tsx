"use client";

import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
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
      {/* Slim title bar */}
      {title && title !== "New conversation" && (
        <div className="shrink-0 px-4 py-2.5 border-b border-border/40">
          <p className="text-sm font-medium text-center text-foreground/60 truncate max-w-md mx-auto">
            {title}
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages} isLoading={isLoading} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 pb-6 pt-2">
        <div className="max-w-3xl mx-auto">
          <MessageInput
            onSend={onSend}
            disabled={isRunning}
            placeholder={isRunning ? "Pierre is thinking..." : "Message Pierre..."}
          />
          <p className="text-center text-[11px] text-muted-foreground/30 mt-3">
            Pierre can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}
