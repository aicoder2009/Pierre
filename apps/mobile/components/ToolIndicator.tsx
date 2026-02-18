import { View, Text, StyleSheet } from "react-native";
import { Wrench } from "lucide-react-native";

interface ToolIndicatorProps {
  toolName: string;
}

export function ToolIndicator({ toolName }: ToolIndicatorProps) {
  return (
    <View style={styles.container}>
      <Wrench size={12} color="#666" />
      <Text style={styles.text}>
        Used <Text style={styles.toolName}>{toolName}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  text: { color: "#666", fontSize: 12 },
  toolName: { fontWeight: "600" },
});
