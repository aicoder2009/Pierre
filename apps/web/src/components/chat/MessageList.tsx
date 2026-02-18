"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import { Loader2 } from "lucide-react";
import { Doc } from "../../../convex/_generated/dataModel";

interface MessageListProps {
  messages: Doc<"messages">[];
  isLoading: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No messages yet. Start a conversation!</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full overflow-y-auto px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-1">
        {messages.map((message) => (
          <MessageBubble key={message._id} message={message} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
