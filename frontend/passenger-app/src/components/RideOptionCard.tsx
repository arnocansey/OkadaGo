import type { ReactNode } from "react";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { Clock, Users, Star } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { radius, spacing } from "@/theme/tokens";

type Props = {
  label: string;
  subtitle: string;
  fare?: string;
  eta?: string;
  capacity?: string;
  rating?: string;
  benefits?: string[];
  selected?: boolean;
  onPress?: () => void;
  vehicle: ReactNode;
  style?: ViewStyle;
};

export function RideOptionCard({
  label,
  subtitle,
  fare,
  eta,
  capacity = "1 passenger",
  rating = "4.8",
  benefits = [],
  selected,
  onPress,
  vehicle,
  style,
}: Props) {
  const { colors, typography } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius: radius.xl,
          borderWidth: 2,
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.primaryLight : colors.surface,
          overflow: "hidden",
        },
        vehicleWrap: {
          alignItems: "center",
          justifyContent: "center",
          paddingTop: spacing.xl,
          paddingBottom: spacing.md,
          backgroundColor: selected
            ? "rgba(250, 204, 21, 0.06)"
            : "rgba(255,255,255,0.03)",
        },
        info: {
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.xl,
          gap: spacing.md,
        },
        header: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        },
        nameGroup: { flex: 1, gap: 2 },
        name: {
          ...typography.h2,
          color: selected ? colors.primary : colors.text,
        },
        subtitle: {
          ...typography.caption,
          color: colors.textMuted,
        },
        fareWrap: {
          alignItems: "flex-end",
        },
        fare: {
          ...typography.h2,
          color: selected ? colors.primary : colors.text,
        },
        fareLabel: {
          ...typography.tiny,
          color: colors.textMuted,
        },
        statsRow: {
          flexDirection: "row",
          gap: spacing.lg,
        },
        stat: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.xs,
        },
        statText: {
          ...typography.captionMedium,
          color: colors.textSecondary,
        },
        benefitsRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: spacing.xs,
        },
        benefitBadge: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingHorizontal: spacing.sm,
          paddingVertical: 4,
          borderRadius: radius.full,
          backgroundColor: selected
            ? "rgba(250, 204, 21, 0.12)"
            : colors.surfaceElevated,
        },
        benefitText: {
          ...typography.tiny,
          color: selected ? colors.primary : colors.textMuted,
        },
        selectedIndicator: {
          position: "absolute",
          top: spacing.md,
          right: spacing.md,
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
        },
        checkMark: {
          ...typography.label,
          color: colors.textOnPrimary,
        },
      }),
    [colors, typography, selected],
  );

  return (
    <Pressable
      style={[styles.card, style]}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${label} - ${subtitle}`}
    >
      {selected ? (
        <View style={styles.selectedIndicator}>
          <Text style={styles.checkMark}>✓</Text>
        </View>
      ) : null}

      <View style={styles.vehicleWrap}>{vehicle}</View>

      <View style={styles.info}>
        <View style={styles.header}>
          <View style={styles.nameGroup}>
            <Text style={styles.name}>{label}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          {fare ? (
            <View style={styles.fareWrap}>
              <Text style={styles.fare}>{fare}</Text>
              <Text style={styles.fareLabel}>estimated fare</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.statsRow}>
          {eta ? (
            <View style={styles.stat}>
              <Clock size={14} color={colors.textMuted} />
              <Text style={styles.statText}>{eta}</Text>
            </View>
          ) : null}
          <View style={styles.stat}>
            <Users size={14} color={colors.textMuted} />
            <Text style={styles.statText}>{capacity}</Text>
          </View>
          <View style={styles.stat}>
            <Star size={14} color="#FFD700" fill="#FFD700" />
            <Text style={styles.statText}>{rating}</Text>
          </View>
        </View>

        {benefits.length > 0 ? (
          <View style={styles.benefitsRow}>
            {benefits.map((benefit) => (
              <View key={benefit} style={styles.benefitBadge}>
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
