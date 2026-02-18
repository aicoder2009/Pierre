"use client";

import { formatDistanceToNow } from "date-fns";
import { Trash2, Tag } from "lucide-react";
import { Doc } from "../../../convex/_generated/dataModel";

interface MemoryItemProps {
  memory: Doc<"memories">;
  onDelete: () => void;
}

export function MemoryItem({ memory, onDelete }: MemoryItemProps) {
  return (
    <div className="group rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm flex-1">{memory.content}</p>
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/20 text-destructive transition-all"
          title="Delete memory"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
        <Tag className="w-3 h-3" />
        <span>{memory.category}</span>
        <span>-</span>
        <span>Importance: {memory.importance}/10</span>
        <span>-</span>
        <span>
          {formatDistanceToNow(memory.createdAt, { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}
