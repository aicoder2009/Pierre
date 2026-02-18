import { useUser } from "@clerk/clerk-expo";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Brain, Trash2, Tag } from "lucide-react-native";

type MemoryType = "persistent" | "session" | "archival";

export default function MemoryScreen() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<MemoryType>("persistent");
  const memories = useQuery(
    api.memories.list,
    user?.id ? { userId: user.id, type: activeTab, limit: 50 } : "skip"
  );
  const removeMemory = useMutation(api.memories.remove);

  const tabs: { label: string; value: MemoryType }[] = [
    { label: "Persistent", value: "persistent" },
    { label: "Session", value: "session" },
    { label: "Archival", value: "archival" },
  ];

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            style={[styles.tab, activeTab === tab.value && styles.activeTab]}
            onPress={() => setActiveTab(tab.value)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.value && styles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={memories ?? []}
        keyExtractor={(item) => item._id}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Brain size={48} color="#444" />
            <Text style={styles.emptyText}>No {activeTab} memories</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.memoryItem}>
            <Text style={styles.memoryContent}>{item.content}</Text>
            <View style={styles.memoryMeta}>
              <Tag size={12} color="#666" />
              <Text style={styles.metaText}>{item.category}</Text>
              <Text style={styles.metaText}>
                Importance: {item.importance}/10
              </Text>
              <Text style={styles.metaText}>
                {formatDistanceToNow(item.createdAt, { addSuffix: true })}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => removeMemory({ id: item._id })}
            >
              <Trash2 size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  tabs: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  tab: { flex: 1, paddingVertical: 14, alignItems: "center" },
  activeTab: { borderBottomWidth: 2, borderBottomColor: "#fff" },
  tabText: { color: "#666", fontSize: 14, fontWeight: "500" },
  activeTabText: { color: "#fff" },
  empty: { alignItems: "center", paddingTop: 80 },
  emptyText: { color: "#666", fontSize: 16, marginTop: 16 },
  memoryItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
    position: "relative",
  },
  memoryContent: { color: "#fff", fontSize: 14, lineHeight: 20 },
  memoryMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  metaText: { color: "#666", fontSize: 12 },
  deleteButton: { position: "absolute", top: 16, right: 16, padding: 4 },
});
