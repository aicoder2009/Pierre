import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { useState } from "react";

export function useAgent() {
  const runAgent = useAction(api.agent.run);
  const [isRunning, setIsRunning] = useState(false);

  const run = async (
    conversationId: Id<"conversations">,
    userId: string,
    prompt: string
  ) => {
    setIsRunning(true);
    try {
      return await runAgent({ conversationId, userId, prompt });
    } finally {
      setIsRunning(false);
    }
  };

  return { run, isRunning };
}
