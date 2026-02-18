"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export function useMessages(conversationId: Id<"conversations"> | undefined) {
  const messages = useQuery(
    api.messages.list,
    conversationId ? { conversationId } : "skip"
  );
  const sendMessage = useMutation(api.messages.send);

  return {
    messages: messages ?? [],
    isLoading: messages === undefined,
    send: async (content: string) => {
      if (!conversationId) return null;
      return await sendMessage({
        conversationId,
        role: "user",
        content,
      });
    },
  };
}
