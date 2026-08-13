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
import { riderWs } from "@/lib/websocket";

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
  "I'm outside now",
  "Arriving in 2 minutes",
  "Please look out for my motorcycle",
  "Traffic is heavy, hold on",
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
        bubbleRider: {
          alignSelf: "flex-end",
          backgroundColor: colors.primary,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: 16,
          borderBottomRightRadius: 4,
          maxWidth: "80%",
        },
        bubblePassenger: {
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
        msgTextRider: {
          ...typography.body,
          color: colors.textOnPrimary,
        },
        msgTextPassenger: {
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

  useEffect(() => {
    if (!visible || !tripId) return;

    // Join WebSocket trip room
    riderWs.send("trip:join-room", { tripId });

    const handleIncomingMessage = (data: unknown) => {
      const msg = data as ChatMessage;
      if (msg && msg.tripId === tripId) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    riderWs.on("trip:chat-message", handleIncomingMessage);

    return () => {
      riderWs.off("trip:chat-message", handleIncomingMessage);
    };
  }, [visible, tripId]);

  function sendMessage(text: string) {
    if (!text.trim() || !tripId) return;

    const payload: ChatMessage = {
      tripId,
      text: text.trim(),
      senderRole: "rider",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    riderWs.send("trip:chat-message", payload);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputText("");
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
                <Text style={styles.headerTitle}>Passenger Chat</Text>
              </View>
              <Pressable style={styles.closeButton} onPress={onClose} hitSlop={8} accessibilityLabel="Close chat" accessibilityRole="button">
                <X size={24} color={colors.text} />
              </Pressable>
            </View>

            <FlatList
              data={messages}
              keyExtractor={(_, index) => index.toString()}
              contentContainerStyle={styles.messageList}
              renderItem={({ item }) => {
                const isRider = item.senderRole === "rider";
                return (
                  <View style={isRider ? styles.bubbleRider : styles.bubblePassenger}>
                    <Text style={isRider ? styles.msgTextRider : styles.msgTextPassenger}>
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
                placeholder="Type a message to passenger..."
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
