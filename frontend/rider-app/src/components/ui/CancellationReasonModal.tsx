import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { radius, shadows, spacing } from "@/theme/tokens";
import { Button } from "./Button";
import { AlertTriangle, Check, X } from "lucide-react-native";

export const RIDER_CANCELLATION_REASONS = [
  { id: "passenger_no_show", icon: "👤", label: "Passenger didn't show up / not responding" },
  { id: "pickup_too_far", icon: "📍", label: "Pickup location is unreachable or too far" },
  { id: "safety_concern", icon: "🛡️", label: "Safety or security concern" },
  { id: "passenger_asked_cancel", icon: "💬", label: "Passenger requested cancellation" },
  { id: "heavy_traffic", icon: "🚦", label: "Severe traffic congestion" },
  { id: "vehicle_issue", icon: "🔧", label: "Vehicle trouble / flat tire" },
  { id: "other", icon: "✏️", label: "Other reason" },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  loading?: boolean;
  tripType?: "ride" | "delivery";
};

export function CancellationReasonModal({
  visible,
  onClose,
  onConfirm,
  loading = false,
  tripType = "ride",
}: Props) {
  const { colors, typography } = useTheme();
  const [selectedReasonId, setSelectedReasonId] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState("");

  const selectedReasonObj = RIDER_CANCELLATION_REASONS.find((r) => r.id === selectedReasonId);
  const finalReasonText =
    selectedReasonId === "other"
      ? customReason.trim() || "Other reason"
      : selectedReasonObj?.label ?? "";

  const handleConfirm = async () => {
    if (!finalReasonText || loading) return;
    await onConfirm(finalReasonText);
    setSelectedReasonId(null);
    setCustomReason("");
  };

  const handleClose = () => {
    if (loading) return;
    setSelectedReasonId(null);
    setCustomReason("");
    onClose();
  };

  const styles = StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "flex-end",
    },
    container: {
      backgroundColor: colors.background,
      borderTopLeftRadius: radius.xxl,
      borderTopRightRadius: radius.xxl,
      maxHeight: "85%",
      paddingTop: spacing.lg,
      paddingBottom: spacing.xxxl,
      paddingHorizontal: spacing.xl,
      ...shadows.sheet,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    title: {
      ...typography.h3,
      color: colors.text,
    },
    subtitle: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: spacing.xs,
      marginBottom: spacing.md,
    },
    closeBtn: {
      padding: spacing.xs,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
    },
    optionsList: {
      marginVertical: spacing.sm,
      maxHeight: 320,
    },
    optionCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: spacing.lg,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      marginBottom: spacing.sm,
      gap: spacing.md,
    },
    optionCardSelected: {
      borderColor: colors.danger,
      backgroundColor: colors.dangerLight ?? "rgba(239, 68, 68, 0.08)",
    },
    optionIcon: {
      fontSize: 20,
    },
    optionText: {
      flex: 1,
      ...typography.bodyMedium,
      color: colors.text,
    },
    optionTextSelected: {
      ...typography.bodySemibold,
      color: colors.danger,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: colors.borderStrong,
      alignItems: "center",
      justifyContent: "center",
    },
    checkboxSelected: {
      borderColor: colors.danger,
      backgroundColor: colors.danger,
    },
    customInput: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      borderRadius: radius.lg,
      padding: spacing.lg,
      ...typography.body,
      color: colors.text,
      marginTop: spacing.xs,
      marginBottom: spacing.md,
      minHeight: 70,
      textAlignVertical: "top",
    },
    footer: {
      gap: spacing.sm,
      marginTop: spacing.md,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <AlertTriangle size={22} color={colors.danger} />
              <Text style={styles.title}>Decline {tripType === "ride" ? "Ride" : "Delivery"}</Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={handleClose}>
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>
            Please select a reason for declining this request.
          </Text>

          <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
            {RIDER_CANCELLATION_REASONS.map((item) => {
              const isSelected = selectedReasonId === item.id;
              return (
                <Pressable
                  key={item.id}
                  style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  onPress={() => setSelectedReasonId(item.id)}
                >
                  <Text style={styles.optionIcon}>{item.icon}</Text>
                  <Text
                    style={[styles.optionText, isSelected && styles.optionTextSelected]}
                  >
                    {item.label}
                  </Text>
                  <View
                    style={[styles.checkbox, isSelected && styles.checkboxSelected]}
                  >
                    {isSelected ? <Check size={14} color="#FFF" /> : null}
                  </View>
                </Pressable>
              );
            })}

            {selectedReasonId === "other" ? (
              <TextInput
                style={styles.customInput}
                placeholder="Describe your reason..."
                placeholderTextColor={colors.textMuted}
                value={customReason}
                onChangeText={setCustomReason}
                multiline
                maxLength={250}
              />
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            <Button
              label={loading ? "Declining..." : "Confirm Decline"}
              variant="danger"
              loading={loading}
              disabled={!selectedReasonId || loading}
              fullWidth
              onPress={handleConfirm}
            />
            <Button
              label="Keep Request"
              variant="outline"
              disabled={loading}
              fullWidth
              onPress={handleClose}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
