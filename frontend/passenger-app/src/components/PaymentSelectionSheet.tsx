import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Check, CreditCard, Banknote, Smartphone, Wallet } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import type { PaymentMethod } from "@/types";

type Props = {
  fare: string;
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
  onConfirm: () => void;
  loading?: boolean;
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
    subtitle: "MTN, Vodafone, AirtelTigo",
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

/**
 * PaymentSelectionSheet — Payment method picker
 *
 * ┌──────────────────────────────────────┐
 * │  ─── handle ───                      │
 * │                                      │
 * │  Total fare                          │
 * │  ┌──────────────────────────────┐   │
 * │  │       GHS 24.50              │   │  ← Prominent fare
 * │  └──────────────────────────────┘   │
 * │                                      │
 * │  Payment method                      │
 * │  ┌──────────────────────────────┐   │
 * │  │ 📱 Mobile Money  ✓          │   │  ← Selected row
 * │  │ 💵 Cash                     │   │
 * │  │ 💳 Card                     │   │
 * │  │ 👛 OkadaGo Wallet           │   │
 * │  └──────────────────────────────┘   │
 * │                                      │
 * │  ┌──────────────────────────────┐   │
 * │  │      Confirm Ride  →         │   │  ← Fixed CTA
 * │  └──────────────────────────────┘   │
 * └──────────────────────────────────────┘
 */
export function PaymentSelectionSheet({
  fare,
  selected,
  onSelect,
  onConfirm,
  loading,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const s = useMemo(
    () =>
      StyleSheet.create({
        sheet: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: "55%",
          backgroundColor: isDark ? colors.surface : "#FFFFFF",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: isDark ? 0.5 : 0.12,
          shadowRadius: 20,
          elevation: 12,
          paddingBottom: insets.bottom || 16,
        },
        handle: {
          alignSelf: "center",
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: isDark ? colors.borderStrong : "#D1D5DB",
          marginTop: 12,
          marginBottom: 16,
        },
        inner: {
          paddingHorizontal: 20,
        },

        /* ─── Fare Display ──────────────────────────────── */
        fareSection: {
          alignItems: "center",
          marginBottom: 24,
        },
        fareLabel: {
          fontSize: 13,
          fontWeight: "500",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 6,
        },
        fareCard: {
          backgroundColor: isDark ? "rgba(250,204,21,0.08)" : "rgba(250,204,21,0.06)",
          borderRadius: 16,
          borderWidth: 1,
          borderColor: isDark ? "rgba(250,204,21,0.15)" : "rgba(250,204,21,0.12)",
          paddingHorizontal: 32,
          paddingVertical: 16,
        },
        fareAmount: {
          fontSize: 32,
          fontWeight: "700",
          color: colors.primary,
          textAlign: "center",
        },

        /* ─── Section Label ─────────────────────────────── */
        sectionLabel: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 10,
        },

        /* ─── Payment Rows ──────────────────────────────── */
        methodRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          paddingVertical: 14,
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
          width: 40,
          height: 40,
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
          fontSize: 15,
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
          width: 24,
          height: 24,
          borderRadius: 12,
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
          paddingTop: 12,
          paddingBottom: insets.bottom ? 0 : 12,
        },
        ctaBtn: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          height: 56,
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
    [colors, isDark, insets.bottom],
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
          <Text style={s.fareLabel}>Total fare</Text>
          <View style={s.fareCard}>
            <Text style={s.fareAmount}>{fare}</Text>
          </View>
        </View>

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
                <Icon size={20} color={isActive ? colors.primary : colors.textSecondary} />
              </View>
              <View style={s.methodBody}>
                <Text style={[s.methodLabel, isActive && s.methodLabelActive]}>
                  {method.label}
                </Text>
                <Text style={s.methodSubtitle}>{method.subtitle}</Text>
              </View>
              <View style={[s.checkCircle, isActive && s.checkCircleActive]}>
                {isActive && <Check size={14} color="#000000" strokeWidth={3} />}
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
            {loading ? "Confirming..." : "Confirm Ride"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
