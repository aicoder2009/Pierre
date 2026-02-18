"use client";

import { useUser } from "@clerk/nextjs";
import { useConversations } from "@/hooks/useConversation";
import { NewChatButton } from "./NewChatButton";
import { ConversationItem } from "./ConversationItem";
import { UserMenu } from "./UserMenu";
import { MemoryPanelToggle } from "./MemoryPanelToggle";
import { MemoryPanel } from "@/components/memory/MemoryPanel";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { Bot, PanelLeftClose, PanelLeft } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { user } = useUser();
  const { conversations, isLoading } = useConversations(user?.id);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMemoryPanelOpen, setIsMemoryPanelOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  return (
    <>
      <div
        className={cn(
          "flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
          isCollapsed ? "w-16" : "w-72"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-sidebar-border">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <span className="font-semibold text-sm text-sidebar-foreground">
                Pierre
              </span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground"
          >
            {isCollapsed ? (
              <PanelLeft className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* New Chat */}
        <div className="p-2">
          <NewChatButton isCollapsed={isCollapsed} />
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
          {isLoading ? (
            <div className="p-3 text-center text-xs text-muted-foreground">
              Loading...
            </div>
          ) : conversations.length === 0 ? (
            !isCollapsed && (
              <div className="p-3 text-center text-xs text-muted-foreground">
                No conversations yet
              </div>
            )
          ) : (
            conversations.map((conv) => (
              <ConversationItem
                key={conv._id}
                conversation={conv}
                isCollapsed={isCollapsed}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-2 space-y-1">
          {!isCollapsed && (
            <MemoryPanelToggle
              onClick={() => setIsMemoryPanelOpen(true)}
            />
          )}
          <UserMenu
            isCollapsed={isCollapsed}
            onSettingsClick={() => setIsSettingsModalOpen(true)}
          />
        </div>
      </div>

      {/* Memory Panel (slide-over) */}
      <MemoryPanel
        isOpen={isMemoryPanelOpen}
        onClose={() => setIsMemoryPanelOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </>
  );
}
