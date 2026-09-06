import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Check, CreditCard, Banknote, Smartphone, Wallet, Tag, XCircle, Sparkles } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import type { PaymentMethod } from "@/types";

type Props = {
  fare: string;
  originalFare?: string;
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
  onConfirm: () => void;
  loading?: boolean;
  promoCode?: string;
  onPromoCodeChange?: (code: string) => void;
  promoMessage?: string;
  promoDiscount?: number;
};

const METHODS: Array<{
  id: PaymentMethod;
  label: string;
  subtitle: string;
  icon: typeof Smartphone;
}> = [
  {
    id: "mobile_money",
    label: "Mobile Money",
    subtitle: "MTN, Telecel, AT Money",
    icon: Smartphone,
  },
  {
    id: "cash",
    label: "Cash",
    subtitle: "Pay your rider directly",
    icon: Banknote,
  },
  {
    id: "card",
    label: "Card",
    subtitle: "Visa or Mastercard",
    icon: CreditCard,
  },
  {
    id: "wallet",
    label: "OkadaGo Wallet",
    subtitle: "Pay from your balance",
    icon: Wallet,
  },
];

export function PaymentSelectionSheet({
  fare,
  originalFare,
  selected,
  onSelect,
  onConfirm,
  loading,
  promoCode = "",
  onPromoCodeChange,
  promoMessage,
  promoDiscount = 0,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const hasDiscount = promoDiscount > 0;

  const s = useMemo(
    () =>
      StyleSheet.create({
        sheet: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: "72%",
          backgroundColor: isDark ? colors.surface : "#FFFFFF",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: isDark ? 0.5 : 0.1,
          shadowRadius: 20,
          elevation: 12,
          paddingBottom: insets.bottom || 16,
        },
        handle: {
          alignSelf: "center",
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.borderStrong,
          marginTop: 12,
          marginBottom: 16,
        },
        inner: {
          paddingHorizontal: 20,
        },

        /* ─── Fare Display ──────────────────────────────── */
        fareSection: {
          alignItems: "center",
          marginBottom: 16,
        },
        fareLabel: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 6,
        },
        fareCard: {
          backgroundColor: isDark ? "rgba(250,204,21,0.08)" : "rgba(250,204,21,0.06)",
          borderRadius: 16,
          borderWidth: 1,
          borderColor: isDark ? "rgba(250,204,21,0.18)" : "rgba(250,204,21,0.15)",
          paddingHorizontal: 24,
          paddingVertical: 12,
          alignItems: "center",
        },
        fareRow: {
          flexDirection: "row",
          alignItems: "baseline",
          gap: 8,
        },
        originalFareText: {
          fontSize: 18,
          fontWeight: "600",
          color: colors.textMuted,
          textDecorationLine: "line-through",
        },
        fareAmount: {
          fontSize: 28,
          fontWeight: "800",
          color: colors.primary,
          textAlign: "center",
        },
        discountBadge: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          backgroundColor: isDark ? "rgba(34,197,94,0.15)" : "#DCFCE7",
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: 8,
          marginTop: 4,
        },
        discountBadgeText: {
          fontSize: 12,
          fontWeight: "700",
          color: isDark ? "#4ade80" : "#16a34a",
        },

        /* ─── Promo Section ─────────────────────────────── */
        promoSection: {
          marginBottom: 16,
        },
        promoInputWrap: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: isDark ? colors.surfaceOverlay : "#F8F9FA",
          borderRadius: 12,
          borderWidth: 1.5,
          borderColor: hasDiscount
            ? colors.success
            : isDark
              ? colors.border
              : "#E2E8F0",
          paddingHorizontal: 12,
          height: 48,
          gap: 8,
        },
        promoInput: {
          flex: 1,
          fontSize: 14,
          fontWeight: "700",
          color: colors.text,
          letterSpacing: 1,
        },
        promoClearBtn: {
          padding: 4,
        },
        promoFeedback: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          marginTop: 6,
          paddingHorizontal: 4,
        },
        promoFeedbackText: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.success,
        },

        /* ─── Section Label ─────────────────────────────── */
        sectionLabel: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 8,
        },

        /* ─── Payment Rows ──────────────────────────────── */
        methodRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: 14,
          backgroundColor: isDark ? colors.surfaceOverlay : "#F8F9FA",
          marginBottom: 8,
          borderWidth: 1.5,
          borderColor: "transparent",
        },
        methodRowActive: {
          borderColor: colors.primary,
          backgroundColor: isDark ? "rgba(250,204,21,0.06)" : "rgba(250,204,21,0.04)",
        },
        methodIcon: {
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          alignItems: "center",
          justifyContent: "center",
        },
        methodIconActive: {
          backgroundColor: colors.primaryLight,
        },
        methodBody: {
          flex: 1,
        },
        methodLabel: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.text,
        },
        methodLabelActive: {
          color: colors.primary,
        },
        methodSubtitle: {
          fontSize: 12,
          color: colors.textMuted,
          marginTop: 1,
        },
        checkCircle: {
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 2,
          borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)",
          alignItems: "center",
          justifyContent: "center",
        },
        checkCircleActive: {
          borderColor: colors.primary,
          backgroundColor: colors.primary,
        },

        /* ─── CTA ──────────────────────────────────────── */
        ctaWrap: {
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: insets.bottom ? 0 : 10,
        },
        ctaBtn: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          height: 52,
          borderRadius: 16,
          backgroundColor: colors.primary,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 8,
        },
        ctaLabel: {
          fontSize: 16,
          fontWeight: "700",
          color: "#000000",
        },
        ctaDisabled: {
          opacity: 0.5,
        },
      }),
    [colors, isDark, insets.bottom, hasDiscount],
  );

  return (
    <View style={s.sheet}>
      <View style={s.handle} />

      <ScrollView
        style={s.inner}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ─── Total Fare ────────────────────────────────── */}
        <View style={s.fareSection}>
          <Text style={s.fareLabel}>Estimated Fare</Text>
          <View style={s.fareCard}>
            <View style={s.fareRow}>
              {hasDiscount && originalFare ? (
                <Text style={s.originalFareText}>{originalFare}</Text>
              ) : null}
              <Text style={s.fareAmount}>{fare}</Text>
            </View>
            {hasDiscount ? (
              <View style={s.discountBadge}>
                <Sparkles size={11} color={isDark ? "#4ade80" : "#16a34a"} />
                <Text style={s.discountBadgeText}>Promo applied</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ─── Promo Code Input Section ──────────────────── */}
        {onPromoCodeChange ? (
          <View style={s.promoSection}>
            <Text style={s.sectionLabel}>Promo code</Text>
            <View style={s.promoInputWrap}>
              <Tag size={18} color={hasDiscount ? colors.success : colors.primary} />
              <TextInput
                style={s.promoInput}
                placeholder="Enter promo code (e.g. ACCRA10)"
                placeholderTextColor={colors.textMuted}
                value={promoCode}
                onChangeText={onPromoCodeChange}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              {promoCode ? (
                <Pressable
                  style={s.promoClearBtn}
                  onPress={() => onPromoCodeChange("")}
                  hitSlop={8}
                >
                  <XCircle size={18} color={colors.textMuted} />
                </Pressable>
              ) : null}
            </View>
            {promoMessage ? (
              <View style={s.promoFeedback}>
                <Check size={14} color={colors.success} />
                <Text style={s.promoFeedbackText}>{promoMessage}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* ─── Payment Methods ───────────────────────────── */}
        <Text style={s.sectionLabel}>Payment method</Text>
        {METHODS.map((method) => {
          const isActive = selected === method.id;
          const Icon = method.icon;
          return (
            <Pressable
              key={method.id}
              style={({ pressed }) => [
                s.methodRow,
                isActive && s.methodRowActive,
                pressed && !isActive && { opacity: 0.7 },
              ]}
              onPress={() => onSelect(method.id)}
              accessibilityRole="radio"
              accessibilityState={{ checked: isActive }}
            >
              <View style={[s.methodIcon, isActive && s.methodIconActive]}>
                <Icon size={18} color={isActive ? colors.primary : colors.textSecondary} />
              </View>
              <View style={s.methodBody}>
                <Text style={[s.methodLabel, isActive && s.methodLabelActive]}>
                  {method.label}
                </Text>
                <Text style={s.methodSubtitle}>{method.subtitle}</Text>
              </View>
              <View style={[s.checkCircle, isActive && s.checkCircleActive]}>
                {isActive && <Check size={12} color="#000000" strokeWidth={3} />}
              </View>
            </Pressable>
          );
        })}

        {/* Spacer */}
        <View style={{ height: 8 }} />
      </ScrollView>

      {/* ─── Fixed Confirm CTA ───────────────────────────── */}
      <View style={s.ctaWrap}>
        <Pressable
          style={[s.ctaBtn, loading && s.ctaDisabled]}
          onPress={onConfirm}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Confirm ride"
        >
          <Text style={s.ctaLabel}>
            {loading ? "Finding rider..." : "Confirm Ride"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
