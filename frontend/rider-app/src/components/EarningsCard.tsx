import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TrendingUp, Clock, Target, Award } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { space, radii, type, brand } from "@/theme/design-system";

type EarningsData = {
  today: number;
  thisWeek: number;
  thisMonth: number;
  totalTrips: number;
  avgRating: number;
  acceptanceRate: number;
  completionRate: number;
};

type Props = {
  data: EarningsData;
  currency?: string;
  onPress?: () => void;
};

/**
 * EarningsCard — Professional earnings summary for riders.
 *
 * Design principles:
 * - High contrast for outdoor readability
 * - Large numbers for quick glance
 * - Hexagonal stat indicators
 * - Ghana Cedis (GH₵) as default currency
 *
 * Layout:
 * ┌─────────────────────────────────┐
 * │  TODAY'S EARNINGS               │
 * │  GH₵ 142.50                     │ ← Large, bold earnings
 * │                                 │
 * │  ┌─────┐ ┌─────┐ ┌─────┐      │ ← Quick stats
 * │  │  12 │ │ 4.8 │ │ 98% │      │
 * │  │Trips│ │ ★   │ │Accept│     │
 * │  └─────┘ └─────┘ └─────┘      │
 * │                                 │
 * │  This Week: GH₵ 1,245.00       │ ← Period earnings
 * │  This Month: GH₵ 4,820.00      │
 * └─────────────────────────────────┘
 */
export function EarningsCard({ data, currency = "GHS", onPress }: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const s = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: isDark ? colors.surface : "#FFFFFF",
          borderRadius: 20,
          padding: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 12,
          elevation: 6,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        },

        /* ─── Header ──────────────────────────────────────────── */
        header: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        },
        headerLeft: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        },
        headerIcon: {
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: brand.primary,
          alignItems: "center",
          justifyContent: "center",
        },
        headerLabel: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.8,
        },

        /* ─── Earnings Display ────────────────────────────────── */
        earningsRow: {
          flexDirection: "row",
          alignItems: "baseline",
          gap: 6,
          marginBottom: 16,
        },
        currency: {
          fontSize: 20,
          fontWeight: "700",
          color: colors.textSecondary,
        },
        earningsValue: {
          fontSize: 40,
          fontWeight: "800",
          color: colors.text,
          letterSpacing: -1.5,
        },

        /* ─── Quick Stats ──────────────────────────────────────── */
        statsRow: {
          flexDirection: "row",
          gap: 10,
          marginBottom: 16,
        },
        statItem: {
          flex: 1,
          backgroundColor: colors.surfaceOverlay,
          borderRadius: 12,
          padding: 12,
          alignItems: "center",
        },
        statValue: {
          fontSize: 20,
          fontWeight: "700",
          color: colors.text,
          marginBottom: 4,
        },
        statLabel: {
          fontSize: 10,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },

        /* ─── Period Earnings ──────────────────────────────────── */
        periodSection: {
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: 12,
          gap: 8,
        },
        periodRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        periodLabel: {
          fontSize: 13,
          fontWeight: "500",
          color: colors.textSecondary,
        },
        periodValue: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.text,
        },
      }),
    [colors, isDark],
  );

  return (
    <Pressable style={s.card} onPress={onPress} accessibilityRole="button">
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.headerIcon}>
            <TrendingUp size={16} color="#000000" />
          </View>
          <Text style={s.headerLabel}>Today's Earnings</Text>
        </View>
      </View>

      {/* Earnings Display */}
      <View style={s.earningsRow}>
        <Text style={s.currency}>GH₵</Text>
        <Text style={s.earningsValue}>
          {typeof data?.today === "number" && Number.isFinite(data.today) ? data.today.toFixed(2) : "0.00"}
        </Text>
      </View>

      {/* Quick Stats */}
      <View style={s.statsRow}>
        <View style={s.statItem}>
          <Text style={s.statValue}>{data?.totalTrips ?? 0}</Text>
          <Text style={s.statLabel}>Trips</Text>
        </View>
        <View style={s.statItem}>
          <Text style={s.statValue}>
            ★ {typeof data?.avgRating === "number" && Number.isFinite(data.avgRating) ? data.avgRating.toFixed(1) : "5.0"}
          </Text>
          <Text style={s.statLabel}>Rating</Text>
        </View>
        <View style={s.statItem}>
          <Text style={s.statValue}>{data?.acceptanceRate ?? 100}%</Text>
          <Text style={s.statLabel}>Accept</Text>
        </View>
      </View>

      {/* Period Earnings */}
      <View style={s.periodSection}>
        <View style={s.periodRow}>
          <Text style={s.periodLabel}>This Week</Text>
          <Text style={s.periodValue}>
            GH₵ {typeof data?.thisWeek === "number" && Number.isFinite(data.thisWeek) ? data.thisWeek.toFixed(2) : "0.00"}
          </Text>
        </View>
        <View style={s.periodRow}>
          <Text style={s.periodLabel}>This Month</Text>
          <Text style={s.periodValue}>
            GH₵ {typeof data?.thisMonth === "number" && Number.isFinite(data.thisMonth) ? data.thisMonth.toFixed(2) : "0.00"}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Performance Card ──────────────────────────────────────────────────────

type PerformanceData = {
  rating: number;
  tripsCompleted: number;
  acceptanceRate: number;
  completionRate: number;
  onTimeRate: number;
};

type PerformanceProps = {
  data: PerformanceData;
  onPress?: () => void;
};

/**
 * PerformanceCard — Rider performance metrics.
 *
 * Unique OkadaGo signature:
 * - Hexagonal progress indicators
 * - High-contrast for outdoor readability
 * - Compact, glanceable design
 */
export function PerformanceCard({ data, onPress }: PerformanceProps) {
  const { colors, isDark } = useTheme();
  const safeRating = typeof data?.rating === "number" && Number.isFinite(data.rating) ? data.rating : 5.0;

  const s = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: isDark ? colors.surface : "#FFFFFF",
          borderRadius: 20,
          padding: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 12,
          elevation: 6,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        },
        header: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
        },
        headerIcon: {
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: brand.accent,
          alignItems: "center",
          justifyContent: "center",
        },
        headerLabel: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.8,
        },
        metricsGrid: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
        },
        metricItem: {
          width: "48%",
          backgroundColor: colors.surfaceOverlay,
          borderRadius: 14,
          padding: 14,
          borderWidth: 1,
          borderColor: colors.border,
        },
        metricValue: {
          fontSize: 24,
          fontWeight: "700",
          color: colors.text,
          marginBottom: 4,
        },
        metricLabel: {
          fontSize: 11,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
        metricBar: {
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.border,
          marginTop: 8,
          overflow: "hidden",
        },
        metricBarFill: {
          height: "100%",
          borderRadius: 2,
          backgroundColor: brand.primary,
        },
      }),
    [colors, isDark],
  );

  return (
    <Pressable style={s.card} onPress={onPress} accessibilityRole="button">
      <View style={s.header}>
        <View style={s.headerIcon}>
          <Award size={16} color="#000000" />
        </View>
        <Text style={s.headerLabel}>Performance</Text>
      </View>

      <View style={s.metricsGrid}>
        <View style={s.metricItem}>
          <Text style={s.metricValue}>★ {safeRating.toFixed(1)}</Text>
          <Text style={s.metricLabel}>Rating</Text>
          <View style={s.metricBar}>
            <View style={[s.metricBarFill, { width: `${(safeRating / 5) * 100}%` }]} />
          </View>
        </View>

        <View style={s.metricItem}>
          <Text style={s.metricValue}>{data.tripsCompleted}</Text>
          <Text style={s.metricLabel}>Trips</Text>
        </View>

        <View style={s.metricItem}>
          <Text style={s.metricValue}>{data.acceptanceRate}%</Text>
          <Text style={s.metricLabel}>Acceptance</Text>
          <View style={s.metricBar}>
            <View style={[s.metricBarFill, { width: `${data.acceptanceRate}%` }]} />
          </View>
        </View>

        <View style={s.metricItem}>
          <Text style={s.metricValue}>{data.completionRate}%</Text>
          <Text style={s.metricLabel}>Completion</Text>
          <View style={s.metricBar}>
            <View style={[s.metricBarFill, { width: `${data.completionRate}%` }]} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}
