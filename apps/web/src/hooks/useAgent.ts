"use client";

import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
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
      const result = await runAgent({ conversationId, userId, prompt });
      return result;
    } finally {
      setIsRunning(false);
    }
  };

  return { run, isRunning };
}
