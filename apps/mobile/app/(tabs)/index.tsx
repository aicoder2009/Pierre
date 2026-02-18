import { useUser } from "@clerk/clerk-expo";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { Plus, MessageSquare } from "lucide-react-native";

export default function ConversationsScreen() {
  const { user } = useUser();
  const router = useRouter();
  const conversations = useQuery(
    api.conversations.list,
    user?.id ? { userId: user.id } : "skip"
  );
  const createConversation = useMutation(api.conversations.create);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleNewChat = async () => {
    if (!user?.id) return;
    const id = await createConversation({ userId: user.id });
    router.push(`/chat/${id}`);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations ?? []}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
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
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => router.push(`/chat/${item._id}`)}
          >
            <View style={styles.itemIcon}>
              <MessageSquare size={20} color="#888" />
            </View>
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.itemTime}>
                {formatDistanceToNow(item.lastMessageAt, { addSuffix: true })}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={handleNewChat}>
        <Plus size={24} color="#0a0a0a" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 120 },
  emptyText: { color: "#888", fontSize: 18, marginTop: 16, fontWeight: "600" },
  emptySubtext: { color: "#555", fontSize: 14, marginTop: 8 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
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
  itemTitle: { color: "#fff", fontSize: 16 },
  itemTime: { color: "#666", fontSize: 12, marginTop: 4 },
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
});
