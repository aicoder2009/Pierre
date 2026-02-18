"use client";

import { useState, useRef, useCallback } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({
  onSend,
  disabled = false,
  placeholder = "Message Pierre...",
}: MessageInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
  };

  const canSend = input.trim().length > 0 && !disabled;

  return (
    <div className="relative flex items-end gap-2 rounded-2xl border border-border/60 bg-muted/30 p-2 focus-within:border-border focus-within:bg-muted/50 transition-all">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground/60 disabled:opacity-50 max-h-[200px]"
      />
      <button
        onClick={handleSubmit}
        disabled={!canSend}
        className={cn(
          "shrink-0 rounded-xl p-2 transition-all",
          canSend
            ? "bg-primary text-primary-foreground hover:bg-primary/90 scale-100"
            : "bg-muted text-muted-foreground/40 scale-95"
        )}
      >
        <ArrowUp className="w-4 h-4" />
      </button>
    </div>
  );
}
