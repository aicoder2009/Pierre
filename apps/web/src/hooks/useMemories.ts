"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useMemories(userId: string | undefined, type?: "session" | "persistent" | "archival") {
  const memories = useQuery(
    api.memories.list,
    userId ? { userId, type, limit: 50 } : "skip"
  );
  const saveMemory = useMutation(api.memories.save);
  const removeMemory = useMutation(api.memories.remove);

  return {
    memories: memories ?? [],
    isLoading: memories === undefined,
    save: saveMemory,
    remove: removeMemory,
  };
}
