import { useUser } from "@clerk/clerk-expo";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc } from "../../convex/_generated/dataModel";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { Brain, Trash2, Tag, Archive, Clock, Database } from "lucide-react-native";

type MemoryType = "persistent" | "session" | "archival";

const TABS: { label: string; value: MemoryType; icon: typeof Database }[] = [
  { label: "Persistent", value: "persistent", icon: Database },
  { label: "Session", value: "session", icon: Clock },
  { label: "Archival", value: "archival", icon: Archive },
];

export default function MemoryScreen() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<MemoryType>("persistent");
  const [refreshing, setRefreshing] = useState(false);

  const memories = useQuery(
    api.memories.list,
    user?.id ? { userId: user.id, type: activeTab, limit: 50 } : "skip"
  );
  const removeMemory = useMutation(api.memories.remove);

  const isLoading = memories === undefined;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleDelete = useCallback(
    (item: Doc<"memories">) => {
      Alert.alert(
        "Delete Memory",
        "Are you sure you want to remove this memory? This cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => removeMemory({ id: item._id }),
          },
        ]
      );
    },
    [removeMemory]
  );

  const renderMemoryItem = useCallback(
    ({ item }: { item: Doc<"memories"> }) => (
      <View style={styles.memoryItem}>
        <View style={styles.memoryHeader}>
          <View style={styles.categoryBadge}>
            <Tag size={10} color="#aaa" />
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          <View style={styles.importanceBadge}>
            <Text style={styles.importanceText}>
              {item.importance}/10
            </Text>
          </View>
        </View>

        <Text style={styles.memoryContent} selectable>
          {item.content}
        </Text>

        <View style={styles.memoryFooter}>
          <Text style={styles.timeText}>
            {item.createdAt
              ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })
              : "Unknown"}
          </Text>
          {item.source ? (
            <Text style={styles.sourceText}>via {item.source}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Trash2 size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
    ),
    [handleDelete]
  );

  return (
    <View style={styles.container}>
      {/* Tab Bar */}
      <View style={styles.tabs}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.value;
          const IconComponent = tab.icon;
          return (
            <TouchableOpacity
              key={tab.value}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => setActiveTab(tab.value)}
              activeOpacity={0.7}
            >
              <IconComponent size={14} color={isActive ? "#fff" : "#666"} />
              <Text
                style={[styles.tabText, isActive && styles.activeTabText]}
              >
                {tab.label}
              </Text>
              {memories !== undefined && activeTab === tab.value && (
                <View style={[styles.countBadge, isActive && styles.activeCountBadge]}>
                  <Text style={[styles.countText, isActive && styles.activeCountText]}>
                    {memories.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : (
        <FlatList
          data={memories ?? []}
          keyExtractor={(item) => item._id}
          renderItem={renderMemoryItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#fff"
            />
          }
          contentContainerStyle={
            (memories ?? []).length === 0 ? styles.emptyContentContainer : undefined
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Brain size={48} color="#444" />
              <Text style={styles.emptyText}>No {activeTab} memories</Text>
              <Text style={styles.emptySubtext}>
                {activeTab === "persistent"
                  ? "Pierre will save important facts and preferences here"
                  : activeTab === "session"
                    ? "Current session context appears here"
                    : "Long-form research and notes are stored here"}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  // Tabs
  tabs: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#1a1a1a",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 6,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#fff",
  },
  tabText: { color: "#666", fontSize: 13, fontWeight: "500" },
  activeTabText: { color: "#fff" },
  countBadge: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: "center",
  },
  activeCountBadge: {
    backgroundColor: "#333",
  },
  countText: { color: "#666", fontSize: 11, fontWeight: "600" },
  activeCountText: { color: "#fff" },
  // Empty
  emptyContentContainer: { flexGrow: 1 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 },
  emptyText: { color: "#666", fontSize: 16, marginTop: 16, fontWeight: "600" },
  emptySubtext: {
    color: "#444",
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 18,
  },
  // Memory Item
  memoryItem: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#1a1a1a",
    position: "relative",
  },
  memoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#1a1a1a",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryText: { color: "#aaa", fontSize: 11, fontWeight: "500" },
  importanceBadge: {
    backgroundColor: "#1a1a1a",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  importanceText: { color: "#888", fontSize: 11, fontWeight: "500" },
  memoryContent: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 20,
    marginRight: 32,
  },
  memoryFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  timeText: { color: "#555", fontSize: 11 },
  sourceText: { color: "#555", fontSize: 11 },
  deleteButton: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 4,
  },
});
