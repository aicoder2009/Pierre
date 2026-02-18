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
  ActivityIndicator,
} from "react-native";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ChatBubble } from "@/components/ChatBubble";
import { ChatInput } from "@/components/ChatInput";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUser();
  const navigation = useNavigation();

  // Safely cast the id parameter
  const conversationId = id as Id<"conversations">;

  const messages = useQuery(
    api.messages.list,
    conversationId ? { conversationId } : "skip"
  );
  const conversation = useQuery(
    api.conversations.get,
    conversationId ? { id: conversationId } : "skip"
  );
  const sendMessage = useMutation(api.messages.send);
  const runAgent = useAction(api.agent.run);

  const [isRunning, setIsRunning] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const isLoading = messages === undefined;

  // Reverse messages for inverted FlatList (newest at bottom)
  const invertedMessages = useMemo(() => {
    if (!messages) return [];
    return [...messages].reverse();
  }, [messages]);

  // Update header title when conversation title loads
  useEffect(() => {
    if (conversation?.title && conversation.title !== "New conversation") {
      navigation.setOptions({ title: conversation.title });
    }
  }, [conversation?.title, navigation]);

  const handleSend = useCallback(
    async (content: string) => {
      if (!user?.id || !conversationId || isRunning) return;

      try {
        // Send the user message first
        await sendMessage({
          conversationId,
          role: "user",
          content,
        });

        // Then run the agent
        setIsRunning(true);
        await runAgent({
          conversationId,
          userId: user.id,
          prompt: content,
        });
      } catch (err) {
        // Error message will show up in the chat from the agent's error handling
        console.warn("Failed to send message or run agent:", err);
      } finally {
        setIsRunning(false);
      }
    },
    [user?.id, conversationId, isRunning, sendMessage, runAgent]
  );

  const renderMessage = useCallback(
    ({ item }: { item: (typeof invertedMessages)[0] }) => (
      <ChatBubble message={item} />
    ),
    []
  );

  const keyExtractor = useCallback(
    (item: (typeof invertedMessages)[0]) => item._id,
    []
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={invertedMessages}
        keyExtractor={keyExtractor}
        renderItem={renderMessage}
        inverted
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Chat with Pierre</Text>
            <Text style={styles.emptyText}>
              Ask me anything -- I can search the web,{"\n"}
              remember things, and help you stay organized.
            </Text>
          </View>
        }
        // When the list is empty and inverted, the empty component
        // renders upside down. We fix this with a transform.
        ListEmptyComponentStyle={styles.emptyContainer}
      />

      <View style={styles.inputContainer}>
        {isRunning && (
          <View style={styles.thinkingContainer}>
            <ActivityIndicator size="small" color="#888" />
            <Text style={styles.thinkingText}>Pierre is thinking...</Text>
          </View>
        )}
        <ChatInput onSend={handleSend} disabled={isRunning} />
      </View>
    </KeyboardAvoidingView>
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
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    // Inverted FlatList flips children, so we un-flip the empty component
    transform: [{ scaleY: -1 }],
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: "#888",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyText: {
    color: "#555",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingBottom: Platform.select({ ios: 8, default: 12 }),
    paddingTop: 4,
  },
  thinkingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingBottom: 8,
  },
  thinkingText: {
    color: "#888",
    fontSize: 12,
  },
});
