"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export function useConversations(userId: string | undefined) {
  const conversations = useQuery(
    api.conversations.list,
    userId ? { userId } : "skip"
  );
  const createConversation = useMutation(api.conversations.create);
  const archiveConversation = useMutation(api.conversations.archive);
  const removeConversation = useMutation(api.conversations.remove);
  const updateTitle = useMutation(api.conversations.updateTitle);

  return {
    conversations: conversations ?? [],
    isLoading: conversations === undefined,
    create: async (title?: string) => {
      if (!userId) return null;
      return await createConversation({ userId, title });
    },
    archive: async (id: Id<"conversations">) => {
      await archiveConversation({ id });
    },
    remove: async (id: Id<"conversations">) => {
      await removeConversation({ id });
    },
    updateTitle: async (id: Id<"conversations">, title: string) => {
      await updateTitle({ id, title });
    },
  };
}

export function useConversation(conversationId: Id<"conversations"> | undefined) {
  const conversation = useQuery(
    api.conversations.get,
    conversationId ? { id: conversationId } : "skip"
  );

  return {
    conversation: conversation ?? null,
    isLoading: conversation === undefined,
  };
}
