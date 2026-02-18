import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { useCallback } from "react";

export function useMessages(conversationId: Id<"conversations"> | undefined) {
  const messages = useQuery(
    api.messages.list,
    conversationId ? { conversationId } : "skip"
  );
  const sendMessage = useMutation(api.messages.send);

  const send = useCallback(
    async (content: string, role: "user" | "assistant" | "system" = "user") => {
      if (!conversationId) return null;
      return await sendMessage({
        conversationId,
        role,
        content,
      });
    },
    [conversationId, sendMessage]
  );

  return {
    messages: messages ?? [],
    isLoading: messages === undefined,
    send,
  };
}
