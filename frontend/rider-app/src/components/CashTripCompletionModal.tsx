import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Platform
} from "react-native";
import { CheckCircle2, Banknote, AlertTriangle, ShieldCheck, X } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { brand } from "@/theme/design-system";

export interface CashTripCompletionModalProps {
  visible: boolean;
  fareAmount: number;
  currency?: string;
  commissionPercent?: number;
  currentOutstandingCommission?: number;
  loading?: boolean;
  onConfirm: (data: { cashCollectedAmount: number; notes?: string }) => void;
  onCancel: () => void;
}

export function CashTripCompletionModal({
  visible,
  fareAmount,
  currency = "GH₵",
  commissionPercent = 15,
  currentOutstandingCommission = 0,
  loading = false,
  onConfirm,
  onCancel
}: CashTripCompletionModalProps) {
  const { colors, isDark } = useTheme();

  const commissionAmount = Math.round((fareAmount * (commissionPercent / 100) + Number.EPSILON) * 100) / 100;
  const riderEarnings = Math.max(0, Math.round((fareAmount - commissionAmount + Number.EPSILON) * 100) / 100);
  const newOutstandingCommission = Math.round((currentOutstandingCommission + commissionAmount + Number.EPSILON) * 100) / 100;

  const [confirmedCheckbox, setConfirmedCheckbox] = useState(true);
  const [isDifferentAmount, setIsDifferentAmount] = useState(false);
  const [customAmount, setCustomAmount] = useState(fareAmount.toFixed(2));
  const [notes, setNotes] = useState("");

  const effectiveCashAmount = isDifferentAmount ? (parseFloat(customAmount) || fareAmount) : fareAmount;

  function handleConfirm() {
    onConfirm({
      cashCollectedAmount: effectiveCashAmount,
      notes: isDifferentAmount ? `Declared different cash: ${currency} ${effectiveCashAmount}. Note: ${notes}` : undefined
    });
  }

  const s = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      justifyContent: "flex-end"
    },
    sheet: {
      backgroundColor: isDark ? "#121826" : "#FFFFFF",
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 24,
      paddingTop: 20,
      paddingBottom: Platform.OS === "ios" ? 40 : 28,
      maxHeight: "90%"
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16
    },
    badgeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: "rgba(34, 197, 94, 0.15)",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20
    },
    badgeText: {
      color: "#22C55E",
      fontWeight: "800",
      fontSize: 12,
      letterSpacing: 0.5,
      textTransform: "uppercase"
    },
    title: {
      fontSize: 22,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 4
    },
    subtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 20
    },
    card: {
      backgroundColor: isDark ? "#1E2638" : "#F8FAFC",
      borderRadius: 18,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0"
    },
    lineItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 7
    },
    lineLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: "500"
    },
    lineValue: {
      fontSize: 15,
      color: colors.text,
      fontWeight: "700"
    },
    highlightRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 10,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0",
      marginVertical: 4
    },
    earningsLabel: {
      fontSize: 15,
      fontWeight: "700",
      color: "#22C55E"
    },
    earningsValue: {
      fontSize: 20,
      fontWeight: "800",
      color: "#22C55E"
    },
    liabilityBox: {
      backgroundColor: isDark ? "rgba(234, 179, 8, 0.12)" : "rgba(234, 179, 8, 0.15)",
      borderRadius: 14,
      padding: 12,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: isDark ? "rgba(234, 179, 8, 0.3)" : "rgba(234, 179, 8, 0.4)",
      flexDirection: "row",
      alignItems: "center",
      gap: 10
    },
    liabilityText: {
      flex: 1,
      fontSize: 12,
      fontWeight: "600",
      color: isDark ? "#FDE047" : "#A16207",
      lineHeight: 18
    },
    checkboxRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 16,
      backgroundColor: isDark ? "rgba(34, 197, 94, 0.08)" : "rgba(34, 197, 94, 0.06)",
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? "rgba(34, 197, 94, 0.2)" : "rgba(34, 197, 94, 0.3)"
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 7,
      borderWidth: 2,
      borderColor: "#22C55E",
      backgroundColor: confirmedCheckbox ? "#22C55E" : "transparent",
      alignItems: "center",
      justifyContent: "center"
    },
    checkboxLabel: {
      flex: 1,
      fontSize: 14,
      fontWeight: "700",
      color: colors.text
    },
    differentToggle: {
      alignSelf: "flex-start",
      marginBottom: 16
    },
    differentToggleText: {
      fontSize: 12,
      color: colors.textSecondary,
      textDecorationLine: "underline"
    },
    input: {
      backgroundColor: isDark ? "#2A364F" : "#F1F5F9",
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 14,
      color: colors.text,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.1)" : "#CBD5E1"
    },
    confirmBtn: {
      backgroundColor: "#22C55E",
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
      shadowColor: "#22C55E",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 6
    },
    confirmBtnDisabled: {
      opacity: 0.5
    },
    confirmBtnText: {
      fontSize: 16,
      fontWeight: "800",
      color: "#FFFFFF",
      letterSpacing: 0.5
    }
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={s.headerRow}>
              <View style={s.badgeRow}>
                <Banknote size={16} color="#22C55E" />
                <Text style={s.badgeText}>Cash Payment</Text>
              </View>
              <Pressable onPress={onCancel} hitSlop={12}>
                <X size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <Text style={s.title}>TRIP COMPLETED</Text>
            <Text style={s.subtitle}>Please collect the full cash fare directly from the passenger.</Text>

            <View style={s.card}>
              <View style={s.lineItem}>
                <Text style={s.lineLabel}>Trip Fare:</Text>
                <Text style={s.lineValue}>{currency} {fareAmount.toFixed(2)}</Text>
              </View>
              <View style={s.lineItem}>
                <Text style={s.lineLabel}>Payment Method:</Text>
                <Text style={[s.lineValue, { color: "#22C55E" }]}>CASH</Text>
              </View>
              <View style={s.lineItem}>
                <Text style={s.lineLabel}>Cash to Collect:</Text>
                <Text style={[s.lineValue, { fontSize: 17, fontWeight: "800" }]}>
                  {currency} {effectiveCashAmount.toFixed(2)}
                </Text>
              </View>
              <View style={s.lineItem}>
                <Text style={s.lineLabel}>OkadaGo Commission ({commissionPercent}%):</Text>
                <Text style={[s.lineValue, { color: "#EF4444" }]}>
                  -{currency} {commissionAmount.toFixed(2)}
                </Text>
              </View>
              <View style={s.highlightRow}>
                <Text style={s.earningsLabel}>YOUR EARNINGS:</Text>
                <Text style={s.earningsValue}>{currency} {riderEarnings.toFixed(2)}</Text>
              </View>
              <View style={s.lineItem}>
                <Text style={s.lineLabel}>Outstanding Commission:</Text>
                <Text style={[s.lineValue, { color: "#CA8A04" }]}>
                  {currency} {newOutstandingCommission.toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={s.liabilityBox}>
              <AlertTriangle size={18} color={isDark ? "#FDE047" : "#A16207"} />
              <Text style={s.liabilityText}>
                You keep 100% of this cash now. OkadaGo will add {currency} {commissionAmount.toFixed(2)} to your outstanding commission balance.
              </Text>
            </View>

            {/* Confirmation Checkbox */}
            <Pressable
              style={s.checkboxRow}
              onPress={() => setConfirmedCheckbox((prev) => !prev)}
            >
              <View style={s.checkbox}>
                {confirmedCheckbox && <CheckCircle2 size={16} color="#FFFFFF" />}
              </View>
              <Text style={s.checkboxLabel}>
                Passenger paid {currency} {effectiveCashAmount.toFixed(2)} cash
              </Text>
            </Pressable>

            <Pressable
              style={s.differentToggle}
              onPress={() => setIsDifferentAmount((prev) => !prev)}
            >
              <Text style={s.differentToggleText}>
                {isDifferentAmount ? "Cancel custom amount" : "Passenger paid a different amount?"}
              </Text>
            </Pressable>

            {isDifferentAmount && (
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textSecondary, marginBottom: 4 }}>
                  Actual Cash Received ({currency}):
                </Text>
                <TextInput
                  style={s.input}
                  value={customAmount}
                  onChangeText={setCustomAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                />
                <TextInput
                  style={s.input}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Reason / notes (optional)"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            )}

            <Pressable
              style={[s.confirmBtn, (!confirmedCheckbox || loading) && s.confirmBtnDisabled]}
              disabled={!confirmedCheckbox || loading}
              onPress={handleConfirm}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <ShieldCheck size={20} color="#FFFFFF" />
                  <Text style={s.confirmBtnText}>CONFIRM CASH RECEIVED</Text>
                </>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
