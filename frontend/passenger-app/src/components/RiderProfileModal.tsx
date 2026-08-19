import React from "react";
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, View } from "react-native";
import { X } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { RiderTransparencyCard, type RiderProfile } from "./RiderTransparencyCard";

type Props = {
  visible: boolean;
  rider: RiderProfile | null;
  matchReason?: string;
  onCall?: () => void;
  onClose: () => void;
};

export function RiderProfileModal({ visible, rider, matchReason, onCall, onClose }: Props) {
  const { colors } = useTheme();

  if (!rider) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8} accessibilityLabel="Close rider info">
                <X size={24} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.content}>
              <RiderTransparencyCard rider={rider} matchReason={matchReason} onCall={onCall} />
            </ScrollView>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  container: {
    height: "85%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 6,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
});
