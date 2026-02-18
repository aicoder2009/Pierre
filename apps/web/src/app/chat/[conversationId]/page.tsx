"use client";

import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Id } from "../../../../convex/_generated/dataModel";
import { useMessages } from "@/hooks/useMessages";
import { useConversation } from "@/hooks/useConversation";
import { useAgent } from "@/hooks/useAgent";
import { ChatContainer } from "@/components/chat/ChatContainer";

export default function ConversationPage() {
  const params = useParams();
  const { user } = useUser();
  const conversationId = params.conversationId as Id<"conversations">;

  const { conversation } = useConversation(conversationId);
  const { messages, isLoading, send } = useMessages(conversationId);
  const { run, isRunning } = useAgent();

  const handleSend = async (content: string) => {
    if (!user?.id || !conversationId) return;
    await send(content);
    run(conversationId, user.id, content);
  };

  return (
    <ChatContainer
      messages={messages}
      isLoading={isLoading}
      isRunning={isRunning}
      onSend={handleSend}
      title={conversation?.title}
    />
  );
}
