import { useState, useRef, useCallback } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { Send } from "lucide-react-native";

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<TextInput>(null);

  const canSend = text.trim().length > 0 && !disabled;

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
    // Keep focus on the input after sending
    inputRef.current?.focus();
  }, [text, disabled, onSend]);

  return (
    <View style={styles.container}>
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Message Pierre..."
        placeholderTextColor="#555"
        multiline
        maxLength={4000}
        editable={!disabled}
        returnKeyType="default"
        blurOnSubmit={false}
        textAlignVertical="center"
        accessibilityLabel="Message input"
        accessibilityHint="Type a message to send to Pierre"
      />
      <TouchableOpacity
        style={[
          styles.sendButton,
          canSend ? styles.sendButtonActive : null,
        ]}
        onPress={handleSend}
        disabled={!canSend}
        activeOpacity={0.6}
        accessibilityLabel="Send message"
        accessibilityRole="button"
      >
        <Send size={18} color={canSend ? "#0a0a0a" : "#555"} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#1a1a1a",
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#333",
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    maxHeight: 120,
    minHeight: 36,
    paddingVertical: Platform.OS === "ios" ? 8 : 6,
    paddingRight: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonActive: {
    backgroundColor: "#fff",
  },
});
