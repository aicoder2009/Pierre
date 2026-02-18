"use client";

import { Brain } from "lucide-react";

interface MemoryPanelToggleProps {
  onClick?: () => void;
}

export function MemoryPanelToggle({ onClick }: MemoryPanelToggleProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent text-sidebar-foreground"
    >
      <Brain className="w-4 h-4" />
      <span>Memories</span>
    </button>
  );
}
