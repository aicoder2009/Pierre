"use client";

import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState, useCallback } from "react";

export function useAgent() {
  const runAgent = useAction(api.agent.run);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (
      conversationId: Id<"conversations">,
      userId: string,
      prompt: string
    ) => {
      setIsRunning(true);
      setError(null);
      try {
        const result = await runAgent({ conversationId, userId, prompt });
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong";
        setError(message);
        console.error("[useAgent] Agent run failed:", err);
        return null;
      } finally {
        setIsRunning(false);
      }
    },
    [runAgent]
  );

  const clearError = useCallback(() => setError(null), []);

  return { run, isRunning, error, clearError };
}
