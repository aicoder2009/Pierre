"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewChatButtonProps {
  isCollapsed: boolean;
}

export function NewChatButton({ isCollapsed }: NewChatButtonProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/chat")}
      className={cn(
        "flex items-center gap-2 w-full rounded-lg border border-sidebar-border px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent text-sidebar-foreground",
        isCollapsed && "justify-center px-2"
      )}
    >
      <Plus className="w-4 h-4" />
      {!isCollapsed && <span>New chat</span>}
    </button>
  );
}
