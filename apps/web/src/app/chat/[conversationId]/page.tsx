"use client";

import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { Id } from "../../../../convex/_generated/dataModel";
import { useMessages } from "@/hooks/useMessages";
import { useConversation } from "@/hooks/useConversation";
import { useAgent } from "@/hooks/useAgent";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { Loader2 } from "lucide-react";

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const conversationId = params.conversationId as Id<"conversations">;

  const { conversation, isLoading: convLoading } = useConversation(conversationId);
  const { messages, isLoading, send } = useMessages(conversationId);
  const { run, isRunning, error, clearError } = useAgent();

  // Redirect to /chat if the conversation doesn't exist (after loading)
  useEffect(() => {
    if (!convLoading && conversation === null) {
      router.replace("/chat");
    }
  }, [convLoading, conversation, router]);

  const handleSend = async (content: string) => {
    if (!user?.id || !conversationId) return;
    await send(content);
    run(conversationId, user.id, content);
  };

  // Show a loading skeleton while the conversation record itself is loading
  if (convLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <ChatContainer
      messages={messages}
      isLoading={isLoading}
      isRunning={isRunning}
      onSend={handleSend}
      title={conversation?.title}
      error={error}
      onDismissError={clearError}
    />
  );
}
