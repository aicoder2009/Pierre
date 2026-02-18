import { View, Text, StyleSheet } from "react-native";
import { Doc } from "../convex/_generated/dataModel";
import { ToolIndicator } from "./ToolIndicator";
import { memo } from "react";

interface ChatBubbleProps {
  message: Doc<"messages">;
}

export const ChatBubble = memo(function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === "user";
  const isTool = message.role === "tool";
  const isSystem = message.role === "system";

  if (isTool) {
    return <ToolIndicator toolName={message.toolName ?? "tool"} />;
  }

  if (isSystem) {
    return (
      <View style={styles.systemContainer}>
        <Text style={styles.systemText}>{message.content}</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        <Text
          style={[styles.text, isUser ? styles.userText : styles.assistantText]}
          selectable
        >
          {message.content}
        </Text>
        {message.isStreaming && (
          <View style={styles.streamingDots}>
            <Text style={styles.streamingText}>...</Text>
          </View>
        )}
      </View>
      {!isUser && message.costUsd !== undefined && message.costUsd > 0 && (
        <Text style={styles.cost}>
          ${message.costUsd.toFixed(4)}
          {message.tokenCount ? ` \u00B7 ${message.tokenCount.toLocaleString()} tokens` : ""}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { marginVertical: 4 },
  userContainer: { alignItems: "flex-end" },
  assistantContainer: { alignItems: "flex-start" },
  bubble: {
    maxWidth: "85%",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: "#fff",
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: "#1a1a1a",
    borderBottomLeftRadius: 4,
  },
  text: { fontSize: 15, lineHeight: 22 },
  userText: { color: "#0a0a0a" },
  assistantText: { color: "#eee" },
  streamingDots: { marginTop: 2 },
  streamingText: { color: "#888", fontSize: 20, lineHeight: 22 },
  cost: {
    color: "#444",
    fontSize: 10,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  // System message
  systemContainer: {
    alignItems: "center",
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  systemText: {
    color: "#555",
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
  },
});
