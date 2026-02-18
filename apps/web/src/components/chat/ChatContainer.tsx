"use client";

import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { Doc } from "../../../convex/_generated/dataModel";
import { AlertCircle, X } from "lucide-react";

interface ChatContainerProps {
  messages: Doc<"messages">[];
  isLoading: boolean;
  isRunning: boolean;
  onSend: (content: string) => void;
  title?: string;
  error?: string | null;
  onDismissError?: () => void;
}

export function ChatContainer({
  messages,
  isLoading,
  isRunning,
  onSend,
  title,
  error,
  onDismissError,
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

      {/* Error banner */}
      {error && (
        <div className="shrink-0 px-4 pt-2">
          <div className="max-w-3xl mx-auto flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1 truncate">{error}</span>
            {onDismissError && (
              <button
                onClick={onDismissError}
                className="shrink-0 p-0.5 rounded hover:bg-destructive/20 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

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
