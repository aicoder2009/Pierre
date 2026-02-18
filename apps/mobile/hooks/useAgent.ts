import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { useState, useCallback, useRef } from "react";

interface AgentResult {
  success: boolean;
  cost?: number;
  error?: string;
}

export function useAgent() {
  const runAgent = useAction(api.agent.run);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  const run = useCallback(
    async (
      conversationId: Id<"conversations">,
      userId: string,
      prompt: string
    ): Promise<AgentResult | null> => {
      if (isRunning) return null;

      setIsRunning(true);
      setError(null);
      abortRef.current = false;

      try {
        const result = await runAgent({ conversationId, userId, prompt });

        if (abortRef.current) return null;

        if (result && !result.success) {
          setError(result.error ?? "Unknown error");
        }

        return result as AgentResult;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to run agent";
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsRunning(false);
      }
    },
    [isRunning, runAgent]
  );

  const clearError = useCallback(() => setError(null), []);

  return { run, isRunning, error, clearError };
}
