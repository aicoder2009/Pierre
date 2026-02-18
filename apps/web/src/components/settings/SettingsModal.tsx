"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { X, Settings, Bell, Brain, Clock } from "lucide-react";
import { ToolToggle } from "./ToolToggle";
import { useState, useEffect } from "react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user } = useUser();
  const settings = useQuery(
    api.settings.get,
    user?.id ? { userId: user.id } : "skip"
  );
  const upsert = useMutation(api.settings.upsert);

  const [displayName, setDisplayName] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [morningBriefing, setMorningBriefing] = useState(false);
  const [enabledTools, setEnabledTools] = useState<string[]>([
    "memory",
    "web_search",
  ]);

  useEffect(() => {
    if (settings) {
      setDisplayName(settings.displayName ?? "");
      setTimezone(settings.timezone ?? "America/New_York");
      setMorningBriefing(settings.morningBriefingEnabled);
      setEnabledTools(settings.enabledTools);
    }
  }, [settings]);

  const handleSave = async () => {
    if (!user?.id) return;
    await upsert({
      userId: user.id,
      displayName,
      timezone,
      morningBriefingEnabled: morningBriefing,
      enabledTools,
    });
    onClose();
  };

  if (!isOpen) return null;

  const allTools = [
    { id: "memory", label: "Memory", desc: "Remember facts across conversations" },
    { id: "web_search", label: "Web Search", desc: "Search the internet" },
    { id: "slack", label: "Slack", desc: "Search and read Slack messages" },
    { id: "gmail", label: "Gmail", desc: "Search and read emails" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background border border-border rounded-2xl w-full max-w-lg mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            <h2 className="font-semibold">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Display Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Brain className="w-4 h-4" /> Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How should Pierre address you?"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" /> Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Asia/Tokyo">Tokyo</option>
              <option value="UTC">UTC</option>
            </select>
          </div>

          {/* Morning Briefing */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <div>
                <p className="text-sm font-medium">Morning Briefing</p>
                <p className="text-xs text-muted-foreground">
                  Daily summary of emails and Slack
                </p>
              </div>
            </div>
            <button
              onClick={() => setMorningBriefing(!morningBriefing)}
              className={`w-11 h-6 rounded-full transition-colors ${
                morningBriefing ? "bg-primary" : "bg-muted"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                  morningBriefing ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Tool Toggles */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Enabled Tools</p>
            {allTools.map((tool) => (
              <ToolToggle
                key={tool.id}
                id={tool.id}
                label={tool.label}
                description={tool.desc}
                enabled={enabledTools.includes(tool.id)}
                onToggle={(enabled) => {
                  setEnabledTools((prev) =>
                    enabled
                      ? [...prev, tool.id]
                      : prev.filter((t) => t !== tool.id)
                  );
                }}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
