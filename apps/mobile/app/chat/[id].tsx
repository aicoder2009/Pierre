import { useLocalSearchParams, useNavigation } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
  View,
  Text,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { ChatBubble } from "@/components/ChatBubble";
import { ChatInput } from "@/components/ChatInput";

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useUser();
  const navigation = useNavigation();
  const conversationId = id as Id<"conversations">;

  const messages = useQuery(api.messages.list, { conversationId });
  const conversation = useQuery(api.conversations.get, { id: conversationId });
  const sendMessage = useMutation(api.messages.send);
  const runAgent = useAction(api.agent.run);

  const [isRunning, setIsRunning] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Update header title when conversation title loads
  useEffect(() => {
    if (conversation?.title) {
      navigation.setOptions({ title: conversation.title });
    }
  }, [conversation?.title, navigation]);

  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = async (content: string) => {
    if (!user?.id) return;

    await sendMessage({
      conversationId,
      role: "user",
      content,
    });

    setIsRunning(true);
    try {
      await runAgent({
        conversationId,
        userId: user.id,
        prompt: content,
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages ?? []}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <ChatBubble message={item} />}
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              Start chatting with Pierre
            </Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <ChatInput onSend={handleSend} disabled={isRunning} />
        {isRunning && (
          <Text style={styles.thinkingText}>Pierre is thinking...</Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  messageList: { paddingHorizontal: 16, paddingVertical: 8 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 100 },
  emptyText: { color: "#666", fontSize: 16 },
  inputContainer: { paddingHorizontal: 16, paddingBottom: 8 },
  thinkingText: { color: "#888", fontSize: 12, textAlign: "center", paddingTop: 4 },
});
