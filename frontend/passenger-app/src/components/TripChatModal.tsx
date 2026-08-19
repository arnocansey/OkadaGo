import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { X, Send, MessageSquare } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { passengerWs } from "@/lib/websocket";

const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

export type ChatMessage = {
  tripId: string;
  text: string;
  senderRole: "passenger" | "rider";
  senderUserId?: string;
  timestamp: string;
};

type Props = {
  visible: boolean;
  tripId: string;
  onClose: () => void;
};

const PRESET_CHIPS = [
  "I'm at the pickup spot",
  "Where are you currently?",
  "Please call when you arrive",
  "Heavy traffic ahead",
];

export function TripChatModal({ visible, tripId, onClose }: Props) {
  const { colors, typography } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.6)",
          justifyContent: "flex-end",
        },
        container: {
          height: "80%",
          backgroundColor: colors.background,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          overflow: "hidden",
        },
        header: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTitle: {
          ...typography.h3,
          color: colors.text,
        },
        closeButton: {
          padding: spacing.sm,
        },
        messageList: {
          padding: spacing.lg,
          gap: spacing.md,
        },
        bubblePassenger: {
          alignSelf: "flex-end",
          backgroundColor: colors.primary,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: 16,
          borderBottomRightRadius: 4,
          maxWidth: "80%",
        },
        bubbleRider: {
          alignSelf: "flex-start",
          backgroundColor: colors.surface,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: 16,
          borderBottomLeftRadius: 4,
          maxWidth: "80%",
          borderWidth: 1,
          borderColor: colors.border,
        },
        msgTextPassenger: {
          ...typography.body,
          color: colors.textOnPrimary,
        },
        msgTextRider: {
          ...typography.body,
          color: colors.text,
        },
        timeText: {
          ...typography.caption,
          color: colors.textMuted,
          marginTop: 2,
          alignSelf: "flex-end",
        },
        presetContainer: {
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
        },
        chip: {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 16,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          marginRight: spacing.xs,
        },
        chipText: {
          ...typography.caption,
          color: colors.text,
        },
        inputRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          padding: spacing.md,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.background,
        },
        input: {
          flex: 1,
          backgroundColor: colors.surface,
          borderRadius: 20,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          ...typography.body,
          color: colors.text,
          borderWidth: 1,
          borderColor: colors.border,
        },
        sendButton: {
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
        },
      }),
    [colors, typography]
  );

  const flatListRef = React.useRef<FlatList>(null);

  useEffect(() => {
    if (!visible || !tripId) return;

    // Join WebSocket trip room
    passengerWs.send("trip:join-room", { tripId });

    const handleIncomingMessage = (data: unknown) => {
      const msg = data as ChatMessage;
      if (msg && msg.tripId === tripId) {
        setMessages((prev) => {
          const exists = prev.some(
            (m) => m.text === msg.text && m.senderRole === msg.senderRole
          );
          if (exists && msg.senderRole === "passenger") return prev;
          return [...prev, msg];
        });
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    };

    passengerWs.on("trip:chat-message", handleIncomingMessage);

    return () => {
      passengerWs.off("trip:chat-message", handleIncomingMessage);
    };
  }, [visible, tripId]);

  function sendMessage(text: string) {
    if (!text.trim() || !tripId) return;

    const formattedTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const payload: ChatMessage = {
      tripId,
      text: text.trim(),
      senderRole: "passenger",
      timestamp: formattedTime,
    };

    passengerWs.send("trip:join-room", { tripId });
    passengerWs.send("trip:chat-message", payload);

    setMessages((prev) => [...prev, payload]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputText("");
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.container}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.header}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                <MessageSquare size={20} color={colors.primary} />
                <Text style={styles.headerTitle}>Trip Chat</Text>
              </View>
              <Pressable style={styles.closeButton} onPress={onClose} hitSlop={8} accessibilityLabel="Close chat" accessibilityRole="button">
                <X size={24} color={colors.text} />
              </Pressable>
            </View>

            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(_, index) => index.toString()}
              contentContainerStyle={styles.messageList}
              renderItem={({ item }) => {
                const isPassenger = item.senderRole === "passenger";
                return (
                  <View style={isPassenger ? styles.bubblePassenger : styles.bubbleRider}>
                    <Text style={isPassenger ? styles.msgTextPassenger : styles.msgTextRider}>
                      {item.text}
                    </Text>
                    <Text style={styles.timeText}>{item.timestamp}</Text>
                  </View>
                );
              }}
            />

            <View style={styles.presetContainer}>
              <FlatList
                horizontal
                data={PRESET_CHIPS}
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <Pressable style={styles.chip} onPress={() => sendMessage(item)} accessibilityRole="button" accessibilityLabel={`Send: ${item}`}>
                    <Text style={styles.chipText}>{item}</Text>
                  </Pressable>
                )}
              />
            </View>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Type a message..."
                placeholderTextColor={colors.textMuted}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={() => sendMessage(inputText)}
              />
              <Pressable style={styles.sendButton} onPress={() => sendMessage(inputText)} accessibilityLabel="Send message" accessibilityRole="button">
                <Send size={18} color={colors.textOnPrimary} />
              </Pressable>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
