import { View, Text, StyleSheet } from "react-native";
import { Doc } from "../convex/_generated/dataModel";
import { ToolIndicator } from "./ToolIndicator";

interface ChatBubbleProps {
  message: Doc<"messages">;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === "user";
  const isTool = message.role === "tool";

  if (isTool) {
    return <ToolIndicator toolName={message.toolName ?? "tool"} />;
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
        >
          {message.content}
        </Text>
        {message.isStreaming && (
          <Text style={styles.streaming}>...</Text>
        )}
      </View>
      {message.costUsd !== undefined && message.costUsd > 0 && (
        <Text style={styles.cost}>
          ${message.costUsd.toFixed(4)} - {message.tokenCount?.toLocaleString()} tokens
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 4 },
  userContainer: { alignItems: "flex-end" },
  assistantContainer: { alignItems: "flex-start" },
  bubble: {
    maxWidth: "80%",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userBubble: { backgroundColor: "#fff" },
  assistantBubble: { backgroundColor: "#1a1a1a" },
  text: { fontSize: 15, lineHeight: 22 },
  userText: { color: "#0a0a0a" },
  assistantText: { color: "#fff" },
  streaming: { color: "#888", fontSize: 18 },
  cost: { color: "#555", fontSize: 10, marginTop: 4, paddingHorizontal: 4 },
});
