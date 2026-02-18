import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

export function useConversations(userId: string | undefined) {
  const conversations = useQuery(
    api.conversations.list,
    userId ? { userId } : "skip"
  );
  const createConversation = useMutation(api.conversations.create);

  return {
    conversations: conversations ?? [],
    isLoading: conversations === undefined,
    create: async (title?: string) => {
      if (!userId) return null;
      return await createConversation({ userId, title });
    },
  };
}
