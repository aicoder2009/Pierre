"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useConversations } from "@/hooks/useConversation";
import { useAgent } from "@/hooks/useAgent";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { MessageInput } from "@/components/chat/MessageInput";
import { Bot } from "lucide-react";
import { useState } from "react";

export default function NewChatPage() {
  const { user } = useUser();
  const router = useRouter();
  const { create } = useConversations(user?.id);
  const { run, isRunning } = useAgent();
  const sendMessage = useMutation(api.messages.send);
  const [isCreating, setIsCreating] = useState(false);

  const handleSend = async (content: string) => {
    if (!user?.id || isCreating) return;
    setIsCreating(true);
    try {
      const conversationId = await create();
      if (!conversationId) return;

      await sendMessage({
        conversationId,
        role: "user",
        content,
      });

      router.push(`/chat/${conversationId}`);

      run(conversationId, user.id, content);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Bot className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Hi, I&apos;m Pierre
          </h1>
          <p className="text-muted-foreground text-lg">
            Your personal AI assistant. How can I help you today?
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { title: "Summarize my emails", desc: "Check for important unread messages" },
            { title: "What's new on Slack?", desc: "Get a summary of recent activity" },
            { title: "Remember something", desc: "Save a fact or preference for later" },
            { title: "Research a topic", desc: "Search the web and summarize findings" },
          ].map((suggestion) => (
            <button
              key={suggestion.title}
              onClick={() => handleSend(suggestion.title)}
              className="text-left p-4 rounded-xl border border-border hover:bg-accent transition-colors"
              disabled={isCreating || isRunning}
            >
              <p className="font-medium text-sm">{suggestion.title}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {suggestion.desc}
              </p>
            </button>
          ))}
        </div>

        <MessageInput
          onSend={handleSend}
          disabled={isCreating || isRunning}
          placeholder="Message Pierre..."
        />
      </div>
    </div>
  );
}
