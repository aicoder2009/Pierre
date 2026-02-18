import { View, Text, StyleSheet } from "react-native";
import { Wrench } from "lucide-react-native";
import { memo } from "react";

interface ToolIndicatorProps {
  toolName: string;
}

const TOOL_LABELS: Record<string, string> = {
  memory_search: "Searching memory",
  memory_save: "Saving to memory",
  memory_update: "Updating memory",
  web_search: "Searching the web",
};

export const ToolIndicator = memo(function ToolIndicator({ toolName }: ToolIndicatorProps) {
  const label = TOOL_LABELS[toolName] ?? `Used ${toolName}`;

  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <View style={styles.badge}>
        <Wrench size={10} color="#888" />
        <Text style={styles.text}>{label}</Text>
      </View>
      <View style={styles.line} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 8,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#222",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#111",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: { color: "#666", fontSize: 11 },
});
