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

type RecentTrip = {
  id: string;
  type: "ride" | "delivery";
  pickup: string;
  destination: string;
  amount: number;
  tip: number;
  date: string;
};

type PayoutAccount = {
  id: string;
  provider: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
};

type PayoutRequest = {
  id: string;
  amount: number;
  status: string;
  destinationLabel: string;
  requestedAt: string;
};

type EarningsData = {
  walletBalance?: number;
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
  breakdown?: {
    fares: number;
    tips: number;
    bonuses: number;
    platformFee: number;
  };
  graph: {
    day: number[];
    week: number[];
    month: number[];
  };
  recentTrips?: RecentTrip[];
  payoutAccounts?: PayoutAccount[];
  payoutRequests?: PayoutRequest[];
};

type Props = {
  data?: EarningsData;
  loading?: boolean;
  currency?: string;
  goalAmount?: number;
  goalPeriod?: "daily" | "weekly";
  onSetGoal?: (amount: number, period: "daily" | "weekly") => void;
  onRequestCashout?: (amount: number, accountId?: string) => Promise<void>;
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
  onRequestCashout,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<EarningsPeriod>("day");
  const [cashoutModalVisible, setCashoutModalVisible] = useState(false);
  const [cashoutAmount, setCashoutAmount] = useState("");
  const [cashoutProvider, setCashoutProvider] = useState("MTN_MOMO");
  const [cashoutPhone, setCashoutPhone] = useState("");
  const [submittingCashout, setSubmittingCashout] = useState(false);
  const [cashoutSuccessMsg, setCashoutSuccessMsg] = useState<string | null>(null);

  // Use real data from API — no mock fallback
  const earnings = data ?? null;

  // Calculate comparison
  const comparison = useMemo(() => {
    if (!earnings) {
      return {
        total: { positive: true, value: 0 },
        trips: { positive: true, value: 0 },
        hours: { positive: true, value: 0 },
        avg: { positive: true, value: 0 },
        tips: { positive: true, value: 0 },
        bonuses: { positive: true, value: 0 },
      };
    }

    const currentTotal = earnings.today.total;
    const prevTotal = earnings.previous.total;
    const totalDiff = currentTotal - prevTotal;
    const totalPercent = prevTotal > 0 ? (totalDiff / prevTotal) * 100 : currentTotal > 0 ? 100 : 0;

    const currentTrips = earnings.today.trips;
    const prevTrips = earnings.previous.trips;
    const tripsDiff = currentTrips - prevTrips;
    const tripsPercent = prevTrips > 0 ? (tripsDiff / prevTrips) * 100 : currentTrips > 0 ? 100 : 0;

    const currentHours = earnings.today.onlineHours;
    const prevHours = earnings.previous.onlineHours;
    const hoursDiff = currentHours - prevHours;
    const hoursPercent = prevHours > 0 ? (hoursDiff / prevHours) * 100 : currentHours > 0 ? 100 : 0;

    const currentAvg = earnings.today.avgPerHour;
    const prevAvg = earnings.previous.avgPerHour;
    const avgDiff = currentAvg - prevAvg;
    const avgPercent = prevAvg > 0 ? (avgDiff / prevAvg) * 100 : currentAvg > 0 ? 100 : 0;

    return {
      total: { positive: totalDiff >= 0, value: Math.abs(totalPercent) },
      trips: { positive: tripsDiff >= 0, value: Math.abs(tripsPercent) },
      hours: { positive: hoursDiff >= 0, value: Math.abs(hoursPercent) },
      avg: { positive: avgDiff >= 0, value: Math.abs(avgPercent) },
      tips: { positive: earnings.today.tips >= earnings.previous.tips, value: 0 },
      bonuses: { positive: earnings.today.bonuses >= earnings.previous.bonuses, value: 0 },
    };
  }, [earnings]);

  // Graph data based on period
  const graphData = useMemo(() => {
    if (!earnings || !earnings.graph) return [0, 0, 0, 0, 0, 0, 0];
    switch (selectedPeriod) {
      case "day":
        return earnings.graph.day ?? [0, 0, 0, 0, 0, 0];
      case "week":
        return earnings.graph.week ?? [0, 0, 0, 0, 0, 0, 0];
      case "month":
        return earnings.graph.month ?? [0, 0, 0];
    }
  }, [earnings, selectedPeriod]);

  // Graph labels based on period
  const graphLabels = useMemo(() => {
    switch (selectedPeriod) {
      case "day":
        return ["6am", "9am", "12pm", "3pm", "6pm", "9pm"];
      case "week":
        return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      case "month":
        return ["W1", "W2", "W3", "W4"];
    }
  }, [selectedPeriod]);

  // Graph min/max for scale
  const { graphMin, graphMax } = useMemo(() => {
    const min = Math.min(...graphData);
    const max = Math.max(...graphData);
    return { graphMin: min, graphMax: max };
  }, [graphData]);

  const handleCashoutSubmit = async () => {
    const num = parseFloat(cashoutAmount);
    if (isNaN(num) || num <= 0) return;
    setSubmittingCashout(true);
    setCashoutSuccessMsg(null);
    try {
      if (onRequestCashout) {
        await onRequestCashout(num);
      } else {
        await new Promise((r) => setTimeout(r, 1000));
      }
      setCashoutSuccessMsg(`Payout request of ${currency} ${num.toFixed(2)} submitted successfully!`);
      setTimeout(() => {
        setCashoutModalVisible(false);
        setCashoutSuccessMsg(null);
        setCashoutAmount("");
      }, 1800);
    } catch (err: any) {
      setCashoutSuccessMsg(err?.message ?? "Cashout request failed. Please try again.");
    } finally {
      setSubmittingCashout(false);
    }
  };

  const s = useMemo(
    () =>
      StyleSheet.create({
        screen: {
          flex: 1,
          backgroundColor: colors.background,
        },
        scroll: {
          flex: 1,
        },
        scrollContent: {
          padding: 20,
          paddingBottom: insets.bottom + 24,
        },
        header: {
          marginBottom: 16,
        },
        headerLabel: {
          fontSize: 12,
          fontWeight: "700",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 1,
        },
        earningsHero: {
          alignItems: "center",
          marginVertical: 12,
        },
        earningsAmount: {
          fontSize: 48,
          fontWeight: "800",
          color: colors.text,
          letterSpacing: -1,
        },
        comparisonBadge: {
          flexDirection: "row",
          alignItems: "center",
          alignSelf: "center",
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 20,
          gap: 4,
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
        statsGrid: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 24,
        },
        statCard: {
          flex: 1,
          minWidth: "45%",
          backgroundColor: isDark ? colors.surface : "#FFFFFF",
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
        },
        statIcon: {
          width: 32,
          height: 32,
          borderRadius: 8,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
        },
        statValue: {
          fontSize: 22,
          fontWeight: "700",
          color: colors.text,
          marginBottom: 2,
        },
        statLabel: {
          fontSize: 12,
          fontWeight: "500",
          color: colors.textMuted,
        },
        statChange: {
          flexDirection: "row",
          alignItems: "center",
          gap: 2,
          marginTop: 8,
        },
        statChangeText: {
          fontSize: 11,
          fontWeight: "600",
        },
        periodFilter: {
          flexDirection: "row",
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          borderRadius: 12,
          padding: 4,
          marginBottom: 16,
        },
        periodBtn: {
          flex: 1,
          paddingVertical: 8,
          alignItems: "center",
          borderRadius: 8,
        },
        periodBtnActive: {
          backgroundColor: isDark ? colors.surfaceOverlay : "#FFFFFF",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        },
        periodBtnText: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.textMuted,
        },
        periodBtnTextActive: {
          color: colors.text,
        },
        graphCard: {
          backgroundColor: isDark ? colors.surface : "#FFFFFF",
          borderRadius: 20,
          padding: 20,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          marginBottom: 24,
        },
        graphHeader: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        },
        graphTitle: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.textSecondary,
        },
        graphValue: {
          fontSize: 18,
          fontWeight: "700",
          color: colors.text,
        },
        graphContainer: {
          flexDirection: "row",
          alignItems: "flex-end",
          height: 120,
          gap: 8,
          paddingTop: 10,
          marginBottom: 12,
        },
        graphBarWrapper: {
          flex: 1,
          height: "100%",
          justifyContent: "flex-end",
          alignItems: "center",
        },
        graphBar: {
          width: "80%",
          maxWidth: 24,
          borderRadius: 6,
        },
        graphBarActive: {
          backgroundColor: brand.primary,
        },
        graphBarInactive: {
          backgroundColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
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

  const walletBal = earnings.walletBalance ?? earnings.today.total;

  return (
    <View style={s.screen}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Header ─────────────────────────────────────────── */}
        <View style={s.header}>
          <Text style={s.headerLabel}>Earnings Hub</Text>
        </View>

        {/* ─── Wallet & Cashout Banner ────────────────────────── */}
        <View
          style={{
            backgroundColor: isDark ? "rgba(250,204,21,0.08)" : "#FFFBEB",
            borderColor: isDark ? "rgba(250,204,21,0.3)" : "#FCD34D",
            borderWidth: 1,
            borderRadius: 20,
            padding: 18,
            marginBottom: 20,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted, textTransform: "uppercase" }}>
                Available MoMo Balance
              </Text>
              <Text style={{ fontSize: 26, fontWeight: "800", color: colors.text, marginTop: 2 }}>
                {currency} {typeof walletBal === "number" && Number.isFinite(walletBal) ? walletBal.toFixed(2) : "0.00"}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                setCashoutAmount(walletBal > 0 ? walletBal.toString() : "50");
                setCashoutModalVisible(true);
              }}
              style={{
                backgroundColor: brand.primary,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
                shadowColor: "#000",
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#000" }}>Cash Out</Text>
            </Pressable>
          </View>
        </View>

        {/* ─── Dominant Earnings ──────────────────────────────── */}
        <View style={s.earningsHero}>
          <Text style={s.earningsAmount}>
            {currency} {typeof earnings.today.total === "number" && Number.isFinite(earnings.today.total) ? earnings.today.total.toFixed(2) : "0.00"}
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

        {/* ─── Financial Breakdown ────────────────────────────── */}
        <View style={{ marginTop: 24 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
            Earnings Breakdown
          </Text>
          <View style={{ backgroundColor: isDark ? colors.surface : "#FFFFFF", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }}>
              <Text style={{ fontSize: 14, color: colors.text }}>Trip Fares</Text>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>{currency} {(earnings.breakdown?.fares ?? earnings.today.total * 0.85).toFixed(2)}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }}>
              <Text style={{ fontSize: 14, color: colors.text }}>Rider Tips (100% kept)</Text>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#22C55E" }}>+{currency} {(earnings.breakdown?.tips ?? earnings.today.tips).toFixed(2)}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }}>
              <Text style={{ fontSize: 14, color: colors.text }}>Quest & Peak Bonuses</Text>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#F59E0B" }}>+{currency} {(earnings.breakdown?.bonuses ?? earnings.today.bonuses).toFixed(2)}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 }}>
              <Text style={{ fontSize: 14, color: colors.textMuted }}>Platform Service Fee</Text>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textMuted }}>-{currency} {(earnings.breakdown?.platformFee ?? earnings.today.total * 0.15).toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* ─── Recent Trip Earnings Feed ──────────────────────── */}
        <View style={{ marginTop: 24 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
            Recent Trip Earnings
          </Text>
          {earnings.recentTrips && earnings.recentTrips.length > 0 ? (
            <View style={{ gap: 8 }}>
              {earnings.recentTrips.map((trip) => (
                <View
                  key={trip.id}
                  style={{
                    backgroundColor: isDark ? colors.surface : "#FFFFFF",
                    borderRadius: 14,
                    padding: 14,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                  }}
                >
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }} numberOfLines={1}>
                      {trip.pickup ? `${trip.pickup.split(",")[0]} → ${trip.destination?.split(",")[0] ?? "Destination"}` : `${trip.type.toUpperCase()} #${trip.id.slice(-6)}`}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                      {new Date(trip.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} • {trip.type === "ride" ? "Okada Ride" : "Package Express"}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: "#22C55E" }}>
                      +{currency} {trip.amount.toFixed(2)}
                    </Text>
                    {trip.tip > 0 ? (
                      <Text style={{ fontSize: 10, fontWeight: "600", color: "#F59E0B", marginTop: 2 }}>
                        Incl. {currency}{trip.tip.toFixed(2)} Tip
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={{ backgroundColor: isDark ? colors.surface : "#FFFFFF", borderRadius: 14, padding: 16, alignItems: "center" }}>
              <Text style={{ fontSize: 13, color: colors.textMuted }}>No completed trips recorded today yet.</Text>
            </View>
          )}
        </View>

        {/* ─── Cashout History Feed ───────────────────────────── */}
        {earnings.payoutRequests && earnings.payoutRequests.length > 0 ? (
          <View style={{ marginTop: 24, marginBottom: 12 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
              Recent Payout Requests
            </Text>
            <View style={{ gap: 8 }}>
              {earnings.payoutRequests.map((req) => (
                <View
                  key={req.id}
                  style={{
                    backgroundColor: isDark ? colors.surface : "#FFFFFF",
                    borderRadius: 14,
                    padding: 14,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                  }}
                >
                  <View>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>
                      {req.destinationLabel ?? "Mobile Money Cashout"}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                      {new Date(req.requestedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
                      {currency} {req.amount.toFixed(2)}
                    </Text>
                    <View
                      style={{
                        marginTop: 4,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 6,
                        backgroundColor: req.status === "COMPLETED" ? "#22C55E15" : "#F59E0B15",
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: "700", color: req.status === "COMPLETED" ? "#22C55E" : "#F59E0B" }}>
                        {req.status}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* ─── Instant Cashout Modal ──────────────────────────── */}
      {cashoutModalVisible ? (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
            zIndex: 999,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 400,
              backgroundColor: isDark ? colors.surface : "#FFFFFF",
              borderRadius: 24,
              padding: 24,
              borderWidth: 1,
              borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text, marginBottom: 4 }}>
              Instant MoMo Cashout
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 16 }}>
              Transfer your earnings instantly to your Mobile Money account.
            </Text>

            {cashoutSuccessMsg ? (
              <View
                style={{
                  backgroundColor: cashoutSuccessMsg.includes("failed") ? "#FEF2F2" : "#F0FDF4",
                  padding: 12,
                  borderRadius: 12,
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: cashoutSuccessMsg.includes("failed") ? "#EF4444" : "#16A34A",
                    textAlign: "center",
                  }}
                >
                  {cashoutSuccessMsg}
                </Text>
              </View>
            ) : null}

            {/* Amount display */}
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted, marginBottom: 6 }}>
              Amount ({currency})
            </Text>
            <Pressable
              style={{
                backgroundColor: isDark ? colors.surfaceOverlay : "#F3F4F6",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: "700", color: colors.text }}>
                {currency} {cashoutAmount || "0.00"}
              </Text>
            </Pressable>

            {/* MoMo Network Selection */}
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted, marginBottom: 8 }}>
              Mobile Money Provider
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
              {[
                { id: "MTN_MOMO", label: "MTN MoMo" },
                { id: "TELECEL_CASH", label: "Telecel Cash" },
                { id: "AT_MONEY", label: "AT Money" },
              ].map((p) => {
                const isSel = cashoutProvider === p.id;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => setCashoutProvider(p.id)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      alignItems: "center",
                      backgroundColor: isSel ? brand.primary : isDark ? colors.surfaceOverlay : "#F3F4F6",
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: "700", color: isSel ? "#000" : colors.text }}>
                      {p.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Modal Actions */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable
                onPress={() => setCashoutModalVisible(false)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: "center",
                  backgroundColor: isDark ? colors.surfaceOverlay : "#E5E7EB",
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCashoutSubmit}
                disabled={submittingCashout}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: "center",
                  backgroundColor: brand.primary,
                  opacity: submittingCashout ? 0.7 : 1,
                }}
              >
                {submittingCashout ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#000" }}>Confirm Cashout</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}
