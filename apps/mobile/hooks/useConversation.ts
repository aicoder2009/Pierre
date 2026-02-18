import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { useCallback } from "react";

export function useConversations(userId: string | undefined) {
  const conversations = useQuery(
    api.conversations.list,
    userId ? { userId } : "skip"
  );
  const createConversation = useMutation(api.conversations.create);
  const archiveConversation = useMutation(api.conversations.archive);
  const removeConversation = useMutation(api.conversations.remove);

  const create = useCallback(
    async (title?: string) => {
      if (!userId) return null;
      return await createConversation({ userId, title });
    },
    [userId, createConversation]
  );

  const archive = useCallback(
    async (id: Id<"conversations">) => {
      await archiveConversation({ id });
    },
    [archiveConversation]
  );

  const remove = useCallback(
    async (id: Id<"conversations">) => {
      await removeConversation({ id });
    },
    [removeConversation]
  );

  return {
    conversations: conversations ?? [],
    isLoading: conversations === undefined,
    create,
    archive,
    remove,
  };
}

export function useConversation(conversationId: Id<"conversations"> | undefined) {
  const conversation = useQuery(
    api.conversations.get,
    conversationId ? { id: conversationId } : "skip"
  );
  const updateTitle = useMutation(api.conversations.updateTitle);

  const setTitle = useCallback(
    async (title: string) => {
      if (!conversationId) return;
      await updateTitle({ id: conversationId, title });
    },
    [conversationId, updateTitle]
  );

  return {
    conversation: conversation ?? null,
    isLoading: conversation === undefined,
    setTitle,
  };
}
