import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Coins,
  TrendingUp,
  Wallet,
} from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { EarningsGoal } from "@/components/EarningsGoal";
import { brand, layers } from "@/theme/design-system";

type EarningsPeriod = "day" | "week" | "month";

type EarningsData = {
  today: {
    total: number;
    trips: number;
    onlineHours: number;
    avgPerHour: number;
    tips: number;
    bonuses: number;
  };
  previous: {
    total: number;
    trips: number;
    onlineHours: number;
    avgPerHour: number;
    tips: number;
    bonuses: number;
  };
  graph: {
    day: number[];
    week: number[];
    month: number[];
  };
};

type Props = {
  data?: EarningsData;
  loading?: boolean;
  currency?: string;
  goalAmount?: number;
  goalPeriod?: "daily" | "weekly";
  onSetGoal?: (amount: number, period: "daily" | "weekly") => void;
};

const PERIOD_LABELS: Record<EarningsPeriod, string> = {
  day: "Today",
  week: "This Week",
  month: "This Month",
};

const PREVIOUS_LABELS: Record<EarningsPeriod, string> = {
  day: "Yesterday",
  week: "Last Week",
  month: "Last Month",
};

/**
 * EarningsDashboard — Premium rider earnings overview.
 *
 * Dominant today's earnings at top, key stats below,
 * interactive graph with period filters, comparison vs previous.
 *
 * Layout:
 * ┌─────────────────────────────────┐
 * │  Earnings                       │
 * │  ─────────────────────────────  │
 * │       GH₵ 458.50                │ ← Dominant earnings
 * │  ▲ 12% vs yesterday             │ ← Comparison
 * │  ─────────────────────────────  │
 * │  ┌─────┐ ┌─────┐ ┌─────┐      │
 * │  │ 12  │ │ 6.2 │ │ GH₵│      │ ← Key stats
 * │  │trips│ │hrs  │ │74/h│      │
 * │  └─────┘ └─────┘ └─────┘      │
 * │  ┌─────┐ ┌─────┐              │
 * │  │+25  │ │+15  │              │
 * │  │tips │ │bonus│              │
 * │  └─────┘ └─────┘              │
 * │  ─────────────────────────────  │
 * │  [Day] [Week] [Month]          │ ← Period filter
 * │  ─────────────────────────────  │
 * │  ┌─────────────────────────┐    │
 * │  │  ▁ ▂ ▃ ▅ ▆ ▇ █ ▇ ▅ ▃  │    │ ← Graph
 * │  │  Mon Tue Wed Thu Fri    │    │
 * │  └─────────────────────────┘    │
 * │  ─────────────────────────────  │
 * │  vs Last Week                   │
 * │  Trips: 12 → 15 ▲25%           │ ← Comparison
 * │  Earnings: 458 → 520 ▲14%      │
 * │  Avg/hr: 74 → 82 ▲11%          │
 * └─────────────────────────────────┘
 */
export function EarningsDashboard({
  data,
  loading = false,
  currency = "GH₵",
  goalAmount = 600,
  goalPeriod = "daily",
  onSetGoal,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<EarningsPeriod>("day");

  // Use real data from API — no mock fallback
  const earnings = data ?? null;

  // Calculate comparison
  const comparison = useMemo(() => {
    if (!earnings || !earnings.today || !earnings.previous) {
      return {
        total: { value: 0, positive: true },
        trips: { value: 0, positive: true },
        hours: { value: 0, positive: true },
        avg: { value: 0, positive: true },
        tips: { value: 0, positive: true },
        bonuses: { value: 0, positive: true },
      };
    }
    const current = earnings.today;
    const prev = earnings.previous;

    const currentTotal = Number.isFinite(current.total) ? current.total : 0;
    const prevTotal = Number.isFinite(prev.total) ? prev.total : 0;
    const totalChange = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : 0;

    const currentTrips = Number.isFinite(current.trips) ? current.trips : 0;
    const prevTrips = Number.isFinite(prev.trips) ? prev.trips : 0;
    const tripsChange = currentTrips - prevTrips;

    const currentHours = Number.isFinite(current.onlineHours) ? current.onlineHours : 0;
    const prevHours = Number.isFinite(prev.onlineHours) ? prev.onlineHours : 0;
    const hoursChange = currentHours - prevHours;

    const currentAvg = Number.isFinite(current.avgPerHour) ? current.avgPerHour : 0;
    const prevAvg = Number.isFinite(prev.avgPerHour) ? prev.avgPerHour : 0;
    const avgChange = prevAvg > 0 ? ((currentAvg - prevAvg) / prevAvg) * 100 : 0;

    const currentTips = Number.isFinite(current.tips) ? current.tips : 0;
    const prevTips = Number.isFinite(prev.tips) ? prev.tips : 0;
    const tipsChange = currentTips - prevTips;

    const currentBonuses = Number.isFinite(current.bonuses) ? current.bonuses : 0;
    const prevBonuses = Number.isFinite(prev.bonuses) ? prev.bonuses : 0;
    const bonusesChange = currentBonuses - prevBonuses;

    return {
      total: { value: Number.isFinite(totalChange) ? totalChange : 0, positive: totalChange >= 0 },
      trips: { value: tripsChange, positive: tripsChange >= 0 },
      hours: { value: hoursChange, positive: hoursChange >= 0 },
      avg: { value: Number.isFinite(avgChange) ? avgChange : 0, positive: avgChange >= 0 },
      tips: { value: tipsChange, positive: tipsChange >= 0 },
      bonuses: { value: bonusesChange, positive: bonusesChange >= 0 },
    };
  }, [earnings]);

  // Graph data for selected period
  const graphData = earnings?.graph?.[selectedPeriod] ?? [];
  const graphMax = graphData.length > 0 ? Math.max(...graphData) : 0;
  const graphMin = graphData.length > 0 ? Math.min(...graphData) : 0;

  // Graph labels
  const graphLabels = useMemo(() => {
    if (selectedPeriod === "day") {
      return ["6am", "9am", "12pm", "3pm", "6pm", "9pm"];
    }
    if (selectedPeriod === "week") {
      return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    }
    return ["W1", "W2", "W3", "W4"];
  }, [selectedPeriod]);

  const s = useMemo(
    () =>
      StyleSheet.create({
        screen: {
          flex: 1,
          backgroundColor: colors.bg,
        },
        scroll: {
          flex: 1,
        },
        scrollContent: {
          paddingHorizontal: 20,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 24,
        },

        /* ─── Header ─────────────────────────────────────────── */
        header: {
          marginBottom: 24,
        },
        headerLabel: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          marginBottom: 8,
        },

        /* ─── Dominant Earnings ──────────────────────────────── */
        earningsHero: {
          alignItems: "center",
          marginBottom: 8,
        },
        earningsAmount: {
          fontSize: 56,
          fontWeight: "800",
          color: colors.text,
          letterSpacing: -2,
        },
        earningsCurrency: {
          fontSize: 28,
          fontWeight: "700",
          color: colors.textMuted,
        },

        /* ─── Comparison Badge ────────────────────────────────── */
        comparisonBadge: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          alignSelf: "center",
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 20,
          marginBottom: 24,
        },
        comparisonPositive: {
          backgroundColor: "#22C55E15",
        },
        comparisonNegative: {
          backgroundColor: "#EF444415",
        },
        comparisonText: {
          fontSize: 13,
          fontWeight: "600",
        },
        comparisonTextPositive: {
          color: "#22C55E",
        },
        comparisonTextNegative: {
          color: "#EF4444",
        },

        /* ─── Stats Grid ──────────────────────────────────────── */
        statsGrid: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 24,
        },
        statCard: {
          width: "47%",
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
          borderRadius: 16,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          padding: 16,
        },
        statIcon: {
          width: 32,
          height: 32,
          borderRadius: 10,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
        },
        statValue: {
          fontSize: 24,
          fontWeight: "700",
          color: colors.text,
          marginBottom: 4,
        },
        statLabel: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
        statChange: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          marginTop: 8,
        },
        statChangeText: {
          fontSize: 11,
          fontWeight: "600",
        },

        /* ─── Period Filter ──────────────────────────────────── */
        periodFilter: {
          flexDirection: "row",
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
          borderRadius: 12,
          padding: 4,
          marginBottom: 24,
        },
        periodBtn: {
          flex: 1,
          height: 40,
          borderRadius: 10,
          alignItems: "center",
          justifyContent: "center",
        },
        periodBtnActive: {
          backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#FFFFFF",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.08,
          shadowRadius: 4,
          elevation: 2,
        },
        periodBtnText: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.textMuted,
        },
        periodBtnTextActive: {
          color: colors.text,
        },

        /* ─── Graph Card ──────────────────────────────────────── */
        graphCard: {
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
          borderRadius: 20,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          padding: 20,
          marginBottom: 24,
        },
        graphHeader: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        },
        graphTitle: {
          fontSize: 15,
          fontWeight: "700",
          color: colors.text,
        },
        graphValue: {
          fontSize: 15,
          fontWeight: "700",
          color: brand.primary,
        },
        graphContainer: {
          height: 160,
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 8,
        },
        graphBarWrapper: {
          flex: 1,
          alignItems: "center",
          justifyContent: "flex-end",
          height: "100%",
        },
        graphBar: {
          width: 24,
          borderRadius: 6,
          backgroundColor: brand.primary,
          minHeight: 4,
        },
        graphBarActive: {
          backgroundColor: brand.primary,
        },
        graphBarInactive: {
          backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)",
        },
        graphLabels: {
          flexDirection: "row",
          justifyContent: "space-between",
        },
        graphLabel: {
          flex: 1,
          textAlign: "center",
          fontSize: 11,
          fontWeight: "500",
          color: colors.textMuted,
        },

        /* ─── Comparison Section ──────────────────────────────── */
        comparisonSection: {
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
          borderRadius: 16,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          padding: 16,
        },
        comparisonHeader: {
          fontSize: 13,
          fontWeight: "700",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 16,
        },
        comparisonRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
        },
        comparisonRowLast: {
          borderBottomWidth: 0,
        },
        comparisonLabel: {
          fontSize: 14,
          fontWeight: "500",
          color: colors.textSecondary,
        },
        comparisonValues: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        },
        comparisonOld: {
          fontSize: 14,
          fontWeight: "500",
          color: colors.textMuted,
          textDecorationLine: "line-through",
        },
        comparisonArrow: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.textMuted,
        },
        comparisonNew: {
          fontSize: 14,
          fontWeight: "700",
        },
        comparisonPercent: {
          fontSize: 12,
          fontWeight: "600",
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 4,
        },
      }),
    [colors, isDark, insets],
  );

  if (loading) {
    return (
      <View style={[s.screen, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={brand.primary} />
      </View>
    );
  }

  if (!earnings) {
    return (
      <View style={[s.screen, { alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }]}>
        <Wallet size={48} color={colors.textMuted} />
        <Text style={{ fontSize: 18, fontWeight: "600", color: colors.text, marginTop: 16, textAlign: "center" }}>
          No earnings data yet
        </Text>
        <Text style={{ fontSize: 14, fontWeight: "400", color: colors.textSecondary, marginTop: 8, textAlign: "center" }}>
          Start going online to see your earnings here
        </Text>
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Header ─────────────────────────────────────────── */}
        <View style={s.header}>
          <Text style={s.headerLabel}>Earnings</Text>
        </View>

        {/* ─── Dominant Earnings ──────────────────────────────── */}
        <View style={s.earningsHero}>
          <Text style={s.earningsAmount}>
            {currency} {earnings.today.total.toFixed(2)}
          </Text>
        </View>

        {/* ─── Comparison Badge ────────────────────────────────── */}
        <View
          style={[
            s.comparisonBadge,
            comparison.total.positive ? s.comparisonPositive : s.comparisonNegative,
          ]}
        >
          {comparison.total.positive ? (
            <ArrowUpRight size={14} color="#22C55E" />
          ) : (
            <ArrowDownRight size={14} color="#EF4444" />
          )}
          <Text
            style={[
              s.comparisonText,
              comparison.total.positive
                ? s.comparisonTextPositive
                : s.comparisonTextNegative,
            ]}
          >
            {comparison.total.positive ? "+" : ""}
            {comparison.total.value.toFixed(1)}% vs {PREVIOUS_LABELS[selectedPeriod].toLowerCase()}
          </Text>
        </View>

        {/* ─── Stats Grid ──────────────────────────────────────── */}
        <View style={s.statsGrid}>
          {/* Completed Trips */}
          <View style={s.statCard}>
            <View style={[s.statIcon, { backgroundColor: "#22C55E15" }]}>
              <Wallet size={16} color="#22C55E" />
            </View>
            <Text style={s.statValue}>{earnings.today.trips}</Text>
            <Text style={s.statLabel}>Trips</Text>
            <View style={s.statChange}>
              {comparison.trips.positive ? (
                <ArrowUpRight size={12} color="#22C55E" />
              ) : (
                <ArrowDownRight size={12} color="#EF4444" />
              )}
              <Text
                style={[
                  s.statChangeText,
                  { color: comparison.trips.positive ? "#22C55E" : "#EF4444" },
                ]}
              >
                {comparison.trips.positive ? "+" : ""}
                {comparison.trips.value}
              </Text>
            </View>
          </View>

          {/* Online Hours */}
          <View style={s.statCard}>
            <View style={[s.statIcon, { backgroundColor: "#3B82F615" }]}>
              <Clock size={16} color="#3B82F6" />
            </View>
            <Text style={s.statValue}>{earnings.today.onlineHours.toFixed(1)}</Text>
            <Text style={s.statLabel}>Online Hours</Text>
            <View style={s.statChange}>
              {comparison.hours.positive ? (
                <ArrowUpRight size={12} color="#22C55E" />
              ) : (
                <ArrowDownRight size={12} color="#EF4444" />
              )}
              <Text
                style={[
                  s.statChangeText,
                  { color: comparison.hours.positive ? "#22C55E" : "#EF4444" },
                ]}
              >
                {comparison.hours.positive ? "+" : ""}
                {comparison.hours.value.toFixed(1)}h
              </Text>
            </View>
          </View>

          {/* Avg per Hour */}
          <View style={s.statCard}>
            <View style={[s.statIcon, { backgroundColor: "#FF6B0015" }]}>
              <TrendingUp size={16} color="#FF6B00" />
            </View>
            <Text style={s.statValue}>
              {currency} {earnings.today.avgPerHour}
            </Text>
            <Text style={s.statLabel}>Avg / Hour</Text>
            <View style={s.statChange}>
              {comparison.avg.positive ? (
                <ArrowUpRight size={12} color="#22C55E" />
              ) : (
                <ArrowDownRight size={12} color="#EF4444" />
              )}
              <Text
                style={[
                  s.statChangeText,
                  { color: comparison.avg.positive ? "#22C55E" : "#EF4444" },
                ]}
              >
                {comparison.avg.positive ? "+" : ""}
                {comparison.avg.value.toFixed(1)}%
              </Text>
            </View>
          </View>

          {/* Tips & Bonuses */}
          <View style={s.statCard}>
            <View style={[s.statIcon, { backgroundColor: "#F59E0B15" }]}>
              <Coins size={16} color="#F59E0B" />
            </View>
            <Text style={s.statValue}>
              {currency} {earnings.today.tips + earnings.today.bonuses}
            </Text>
            <Text style={s.statLabel}>Tips & Bonuses</Text>
            <View style={s.statChange}>
              {comparison.tips.positive || comparison.bonuses.positive ? (
                <ArrowUpRight size={12} color="#22C55E" />
              ) : (
                <ArrowDownRight size={12} color="#EF4444" />
              )}
              <Text
                style={[
                  s.statChangeText,
                  {
                    color:
                      comparison.tips.positive || comparison.bonuses.positive
                        ? "#22C55E"
                        : "#EF4444",
                  },
                ]}
              >
                +
                {currency} {earnings.today.tips + earnings.today.bonuses}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Earnings Goal ───────────────────────────────────── */}
        <View style={{ marginBottom: 24 }}>
          <EarningsGoal
            currentEarnings={earnings.today.total}
            goalAmount={goalAmount}
            goalPeriod={goalPeriod}
            onSetGoal={onSetGoal}
            currency={currency}
          />
        </View>

        {/* ─── Period Filter ──────────────────────────────────── */}
        <View style={s.periodFilter}>
          {(["day", "week", "month"] as EarningsPeriod[]).map((period) => (
            <Pressable
              key={period}
              style={[
                s.periodBtn,
                selectedPeriod === period && s.periodBtnActive,
              ]}
              onPress={() => setSelectedPeriod(period)}
              accessibilityRole="button"
              accessibilityLabel={`Show ${PERIOD_LABELS[period]} earnings`}
            >
              <Text
                style={[
                  s.periodBtnText,
                  selectedPeriod === period && s.periodBtnTextActive,
                ]}
              >
                {PERIOD_LABELS[period]}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ─── Graph Card ──────────────────────────────────────── */}
        <View style={s.graphCard}>
          <View style={s.graphHeader}>
            <Text style={s.graphTitle}>{PERIOD_LABELS[selectedPeriod]} Earnings</Text>
            <Text style={s.graphValue}>
              {currency}{" "}
              {selectedPeriod === "day"
                ? earnings.today.total.toFixed(0)
                : selectedPeriod === "week"
                  ? earnings.graph.week.reduce((a, b) => a + b, 0).toFixed(0)
                  : earnings.graph.month.reduce((a, b) => a + b, 0).toFixed(0)}
            </Text>
          </View>

          {/* Graph Bars */}
          <View style={s.graphContainer}>
            {graphData.map((value, index) => {
              const height = graphMax > graphMin ? Math.min(Math.max(((value - graphMin) / (graphMax - graphMin)) * 80 + 20, 10), 100) : 20;
              const isHighest = value === graphMax && value > 0;
              return (
                <View key={index} style={s.graphBarWrapper}>
                  <View
                    style={[
                      s.graphBar,
                      {
                        height: `${height}%`,
                      },
                      isHighest ? s.graphBarActive : s.graphBarInactive,
                    ]}
                  />
                </View>
              );
            })}
          </View>

          {/* Graph Labels */}
          <View style={s.graphLabels}>
            {graphLabels.map((label, index) => (
              <Text key={index} style={s.graphLabel}>
                {label}
              </Text>
            ))}
          </View>
        </View>

        {/* ─── Comparison Section ──────────────────────────────── */}
        <View style={s.comparisonSection}>
          <Text style={s.comparisonHeader}>
            vs {PREVIOUS_LABELS[selectedPeriod]}
          </Text>

          {/* Trips */}
          <View style={s.comparisonRow}>
            <Text style={s.comparisonLabel}>Trips</Text>
            <View style={s.comparisonValues}>
              <Text style={s.comparisonOld}>{earnings.previous.trips}</Text>
              <Text style={s.comparisonArrow}>→</Text>
              <Text
                style={[
                  s.comparisonNew,
                  { color: comparison.trips.positive ? "#22C55E" : "#EF4444" },
                ]}
              >
                {earnings.today.trips}
              </Text>
              <View
                style={[
                  s.comparisonPercent,
                  {
                    backgroundColor: comparison.trips.positive ? "#22C55E15" : "#EF444415",
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: comparison.trips.positive ? "#22C55E" : "#EF4444",
                  }}
                >
                  {comparison.trips.positive ? "+" : ""}
                  {(earnings.previous.trips > 0 ? (comparison.trips.value / earnings.previous.trips) * 100 : 0).toFixed(0)}%
                </Text>
              </View>
            </View>
          </View>

          {/* Earnings */}
          <View style={s.comparisonRow}>
            <Text style={s.comparisonLabel}>Earnings</Text>
            <View style={s.comparisonValues}>
              <Text style={s.comparisonOld}>
                {currency} {earnings.previous.total.toFixed(0)}
              </Text>
              <Text style={s.comparisonArrow}>→</Text>
              <Text
                style={[
                  s.comparisonNew,
                  { color: comparison.total.positive ? "#22C55E" : "#EF4444" },
                ]}
              >
                {currency} {earnings.today.total.toFixed(0)}
              </Text>
              <View
                style={[
                  s.comparisonPercent,
                  {
                    backgroundColor: comparison.total.positive ? "#22C55E15" : "#EF444415",
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: comparison.total.positive ? "#22C55E" : "#EF4444",
                  }}
                >
                  {comparison.total.positive ? "+" : ""}
                  {comparison.total.value.toFixed(0)}%
                </Text>
              </View>
            </View>
          </View>

          {/* Avg per Hour */}
          <View style={[s.comparisonRow, s.comparisonRowLast]}>
            <Text style={s.comparisonLabel}>Avg / Hour</Text>
            <View style={s.comparisonValues}>
              <Text style={s.comparisonOld}>
                {currency} {earnings.previous.avgPerHour}
              </Text>
              <Text style={s.comparisonArrow}>→</Text>
              <Text
                style={[
                  s.comparisonNew,
                  { color: comparison.avg.positive ? "#22C55E" : "#EF4444" },
                ]}
              >
                {currency} {earnings.today.avgPerHour}
              </Text>
              <View
                style={[
                  s.comparisonPercent,
                  {
                    backgroundColor: comparison.avg.positive ? "#22C55E15" : "#EF444415",
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: comparison.avg.positive ? "#22C55E" : "#EF4444",
                  }}
                >
                  {comparison.avg.positive ? "+" : ""}
                  {comparison.avg.value.toFixed(0)}%
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
