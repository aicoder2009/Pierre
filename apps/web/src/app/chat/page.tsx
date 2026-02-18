"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useConversations } from "@/hooks/useConversation";
import { useAgent } from "@/hooks/useAgent";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { MessageInput } from "@/components/chat/MessageInput";
import { Bot, Mail, Hash, Brain, Globe, AlertCircle, X } from "lucide-react";
import { useState } from "react";

const SUGGESTIONS = [
  { icon: Mail, title: "Summarize my emails", desc: "Check for important unread messages" },
  { icon: Hash, title: "What's new on Slack?", desc: "Get a summary of recent activity" },
  { icon: Brain, title: "Remember something", desc: "Save a fact or preference for later" },
  { icon: Globe, title: "Research a topic", desc: "Search the web and summarize findings" },
];

export default function NewChatPage() {
  const { user } = useUser();
  const router = useRouter();
  const { create } = useConversations(user?.id);
  const { run, isRunning, error, clearError } = useAgent();
  const sendMessage = useMutation(api.messages.send);
  const settings = useQuery(api.settings.get, user?.id ? { userId: user.id } : "skip");
  const [isCreating, setIsCreating] = useState(false);

  const displayName = settings?.displayName || user?.firstName || null;

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
    } catch (err) {
      console.error("[NewChatPage] Failed to create conversation:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const isBusy = isCreating || isRunning;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Bot className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {displayName ? `Hi, ${displayName}` : "Hi there"}
          </h1>
          <p className="text-muted-foreground">
            I&apos;m Pierre, your personal AI assistant. How can I help you today?
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {SUGGESTIONS.map(({ icon: Icon, title, desc }) => (
            <button
              key={title}
              onClick={() => handleSend(title)}
              className="text-left p-4 rounded-xl border border-border/60 hover:border-border hover:bg-accent/50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border/60 disabled:hover:bg-transparent"
              disabled={isBusy}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                <p className="font-medium text-sm">{title}</p>
              </div>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </button>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1 truncate">{error}</span>
            <button
              onClick={clearError}
              className="shrink-0 p-0.5 rounded hover:bg-destructive/20 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <MessageInput
          onSend={handleSend}
          disabled={isBusy}
          placeholder="Message Pierre..."
        />
      </div>
    </div>
  );
}
