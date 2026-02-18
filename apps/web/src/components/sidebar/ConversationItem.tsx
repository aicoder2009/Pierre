"use client";

import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useConversations } from "@/hooks/useConversation";
import { cn } from "@/lib/utils";
import { MessageSquare, Trash2, Archive } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Doc } from "../../../convex/_generated/dataModel";
import { useState } from "react";

interface ConversationItemProps {
  conversation: Doc<"conversations">;
  isCollapsed: boolean;
}

export function ConversationItem({
  conversation,
  isCollapsed,
}: ConversationItemProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();
  const { archive, remove } = useConversations(user?.id);
  const [showActions, setShowActions] = useState(false);
  const isActive = pathname === `/chat/${conversation._id}`;

  return (
    <div
      className={cn(
        "group relative flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
      )}
      onClick={() => router.push(`/chat/${conversation._id}`)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <MessageSquare className="w-4 h-4 shrink-0" />
      {!isCollapsed && (
        <>
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate">{conversation.title}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(conversation.lastMessageAt, {
                addSuffix: true,
              })}
            </p>
          </div>
          {showActions && (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  archive(conversation._id);
                  if (isActive) router.push("/chat");
                }}
                className="p-1 rounded hover:bg-background/50 transition-colors"
                title="Archive"
              >
                <Archive className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  remove(conversation._id);
                  if (isActive) router.push("/chat");
                }}
                className="p-1 rounded hover:bg-destructive/20 text-destructive transition-colors"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
