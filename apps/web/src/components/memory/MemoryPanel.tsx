"use client";

import { useUser } from "@clerk/nextjs";
import { useMemories } from "@/hooks/useMemories";
import { MemoryItem } from "./MemoryItem";
import { Brain, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface MemoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type MemoryType = "session" | "persistent" | "archival";

export function MemoryPanel({ isOpen, onClose }: MemoryPanelProps) {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<MemoryType>("persistent");
  const { memories, isLoading, remove } = useMemories(user?.id, activeTab);

  const tabs: { label: string; value: MemoryType }[] = [
    { label: "Persistent", value: "persistent" },
    { label: "Session", value: "session" },
    { label: "Archival", value: "archival" },
  ];

  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 w-96 bg-background border-l border-border shadow-xl transition-transform duration-300 z-50",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          <h2 className="font-semibold">Memories</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-accent transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "flex-1 py-2.5 text-sm font-medium transition-colors border-b-2",
              activeTab === tab.value
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Memory List */}
      <div className="overflow-y-auto h-[calc(100%-120px)] p-4 space-y-3">
        {isLoading ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            Loading memories...
          </p>
        ) : memories.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            No {activeTab} memories yet
          </p>
        ) : (
          memories.map((memory) => (
            <MemoryItem
              key={memory._id}
              memory={memory}
              onDelete={() => remove({ id: memory._id })}
            />
          ))
        )}
      </div>
    </div>
  );
}
