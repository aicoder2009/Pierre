import { FlatList, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare } from "lucide-react-native";
import { Doc } from "../convex/_generated/dataModel";

interface ConversationListProps {
  conversations: Doc<"conversations">[];
  refreshing: boolean;
  onRefresh: () => void;
}

export function ConversationList({
  conversations,
  refreshing,
  onRefresh,
}: ConversationListProps) {
  const router = useRouter();

  return (
    <FlatList
      data={conversations}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.item}
          onPress={() => router.push(`/chat/${item._id}`)}
        >
          <View style={styles.icon}>
            <MessageSquare size={20} color="#888" />
          </View>
          <View style={styles.content}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.time}>
              {formatDistanceToNow(item.lastMessageAt, { addSuffix: true })}
            </Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
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
  title: { color: "#fff", fontSize: 16 },
  time: { color: "#666", fontSize: 12, marginTop: 4 },
});
