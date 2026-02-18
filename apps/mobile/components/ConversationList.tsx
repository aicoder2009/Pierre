import { FlatList, View, Text, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare } from "lucide-react-native";
import { Doc } from "../convex/_generated/dataModel";
import { memo, useCallback } from "react";

interface ConversationListProps {
  conversations: Doc<"conversations">[];
  refreshing?: boolean;
  onRefresh?: () => void;
}

const ConversationItem = memo(function ConversationItem({
  item,
  onPress,
}: {
  item: Doc<"conversations">;
  onPress: (id: string) => void;
}) {
  return (
    <TouchableOpacity
      style={styles.item}
      onPress={() => onPress(item._id)}
      activeOpacity={0.6}
    >
      <View style={styles.icon}>
        <MessageSquare size={20} color="#888" />
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title || "New conversation"}
        </Text>
        <Text style={styles.time}>
          {item.lastMessageAt
            ? formatDistanceToNow(new Date(item.lastMessageAt), { addSuffix: true })
            : "Just now"}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

export function ConversationList({
  conversations,
  refreshing = false,
  onRefresh,
}: ConversationListProps) {
  const router = useRouter();

  const handlePress = useCallback(
    (id: string) => {
      router.push(`/chat/${id}`);
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: Doc<"conversations"> }) => (
      <ConversationItem item={item} onPress={handlePress} />
    ),
    [handlePress]
  );

  const keyExtractor = useCallback(
    (item: Doc<"conversations">) => item._id,
    []
  );

  return (
    <FlatList
      data={conversations}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
        ) : undefined
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <MessageSquare size={48} color="#444" />
          <Text style={styles.emptyText}>No conversations yet</Text>
        </View>
      }
      contentContainerStyle={conversations.length === 0 ? styles.emptyContentContainer : undefined}
    />
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#1a1a1a",
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  content: { flex: 1 },
  title: { color: "#fff", fontSize: 16, fontWeight: "500" },
  time: { color: "#666", fontSize: 12, marginTop: 4 },
  emptyContentContainer: { flexGrow: 1 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 120,
  },
  emptyText: { color: "#666", fontSize: 16, marginTop: 16 },
});
