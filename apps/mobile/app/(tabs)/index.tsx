import { useUser } from "@clerk/clerk-expo";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc } from "../../convex/_generated/dataModel";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { Plus, MessageSquare, Trash2 } from "lucide-react-native";

export default function ConversationsScreen() {
  const { user } = useUser();
  const router = useRouter();
  const conversations = useQuery(
    api.conversations.list,
    user?.id ? { userId: user.id } : "skip"
  );
  const createConversation = useMutation(api.conversations.create);
  const archiveConversation = useMutation(api.conversations.archive);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);

  const isLoading = conversations === undefined;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Convex queries are reactive, so this is mainly for UX feedback.
    // The data will auto-refresh. We just dismiss the spinner after a short delay.
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleNewChat = useCallback(async () => {
    if (!user?.id || creating) return;
    setCreating(true);
    try {
      const id = await createConversation({ userId: user.id });
      router.push(`/chat/${id}`);
    } catch (err) {
      Alert.alert("Error", "Failed to create conversation. Please try again.");
    } finally {
      setCreating(false);
    }
  }, [user?.id, creating, createConversation, router]);

  const handleArchive = useCallback(
    (item: Doc<"conversations">) => {
      Alert.alert(
        "Delete Conversation",
        `Are you sure you want to delete "${item.title}"?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => archiveConversation({ id: item._id }),
          },
        ]
      );
    },
    [archiveConversation]
  );

  const renderItem = useCallback(
    ({ item }: { item: Doc<"conversations"> }) => (
      <TouchableOpacity
        style={styles.item}
        onPress={() => router.push(`/chat/${item._id}`)}
        onLongPress={() => handleArchive(item)}
        activeOpacity={0.6}
      >
        <View style={styles.itemIcon}>
          <MessageSquare size={20} color="#888" />
        </View>
        <View style={styles.itemContent}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {item.title || "New conversation"}
          </Text>
          <Text style={styles.itemTime}>
            {item.lastMessageAt
              ? formatDistanceToNow(new Date(item.lastMessageAt), {
                  addSuffix: true,
                })
              : "Just now"}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.archiveButton}
          onPress={() => handleArchive(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Trash2 size={16} color="#555" />
        </TouchableOpacity>
      </TouchableOpacity>
    ),
    [router, handleArchive]
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations ?? []}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
        }
        contentContainerStyle={
          (conversations ?? []).length === 0 ? styles.emptyContentContainer : undefined
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MessageSquare size={48} color="#444" />
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubtext}>
              Tap + to start a new chat with Pierre
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, creating && styles.fabDisabled]}
        onPress={handleNewChat}
        disabled={creating}
        activeOpacity={0.7}
      >
        {creating ? (
          <ActivityIndicator size="small" color="#0a0a0a" />
        ) : (
          <Plus size={24} color="#0a0a0a" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContentContainer: { flexGrow: 1 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 120,
  },
  emptyText: {
    color: "#888",
    fontSize: 18,
    marginTop: 16,
    fontWeight: "600",
  },
  emptySubtext: { color: "#555", fontSize: 14, marginTop: 8 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#1a1a1a",
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  itemContent: { flex: 1 },
  itemTitle: { color: "#fff", fontSize: 16, fontWeight: "500" },
  itemTime: { color: "#666", fontSize: 12, marginTop: 4 },
  archiveButton: {
    padding: 8,
    marginLeft: 8,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabDisabled: {
    opacity: 0.7,
  },
});
