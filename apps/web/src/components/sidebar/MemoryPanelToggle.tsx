"use client";

import { Brain } from "lucide-react";
import { useRouter } from "next/navigation";

export function MemoryPanelToggle() {
  const router = useRouter();

  return (
    <button
      onClick={() => {
        // TODO: Open memory panel as a slide-over or modal
      }}
      className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent text-sidebar-foreground"
    >
      <Brain className="w-4 h-4" />
      <span>Memories</span>
    </button>
  );
}
