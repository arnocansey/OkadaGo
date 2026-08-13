import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Award,
  CheckCircle2,
  MessageCircleHeart,
  ShieldCheck,
  Star,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
  XCircle,
} from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { brand, layers } from "@/theme/design-system";

type PerformanceData = {
  rating: number;
  ratingTrend?: number;
  acceptanceRate: number;
  acceptanceTrend?: number;
  cancellationRate: number;
  cancellationTrend?: number;
  completedTrips: number;
  tripsTrend?: number;
  compliments: number;
  complimentsTrend?: number;
  safetyScore: number;
  safetyTrend?: number;
};

type Props = {
  data?: PerformanceData;
  currency?: string;
};

/**
 * PerformanceCards — Simple rider performance overview.
 *
 * Clean card-based layout showing key performance metrics.
 * No complex charts — just clear numbers with trends.
 *
 * Layout:
 * ┌─────────────────────────────────┐
 *  Performance                      
 *  ─────────────────────────────    
 *  ┌─────────────────────────────┐  
 *  │  ⭐ 4.92                    │  ← Rating card
 *  │  Rating                     │  
 *  │  ▲ +0.05 this month         │  
 *  └─────────────────────────────┘  
 *  ┌───────────┐ ┌───────────────┐  
 *  │  ✓ 94%    │ │  ✗ 2%         │  ← Acceptance + Cancellation
 *  │  Accept   │ │  Cancel       │  
 *  └───────────┘ └───────────────┘  
 *  ┌─────────────────────────────┐  
 *  │  🏍 1,247                   │  ← Completed trips
 *  │  Completed Trips            │  
 *  │  ▲ +23 this week            │  
 *  └─────────────────────────────┘  
 *  ┌─────────────────────────────┐  
 *  │  💬 89                      │  ← Compliments
 *  │  Customer Compliments       │  
 *  │  ▲ +12 this month           │  
 *  └─────────────────────────────┘  
 *  ┌─────────────────────────────┐  
 *  │  🛡 98%                     │  ← Safety score
 *  │  Safety Score               │  
 *  │  Excellent standing         │  
 *  └─────────────────────────────┘  
 * └─────────────────────────────────┘
 */
export function PerformanceCards({ data }: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  // Use real data from API — no mock fallback
  const stats = data;

  const s = useMemo(
    () =>
      StyleSheet.create({
        container: {
          gap: 12,
        },

        /* ─── Card Base ──────────────────────────────────────── */
        card: {
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
          borderRadius: 16,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          padding: 16,
        },
        cardRow: {
          flexDirection: "row",
          gap: 12,
        },
        cardHalf: {
          flex: 1,
        },

        /* ─── Icon ───────────────────────────────────────────── */
        iconContainer: {
          width: 36,
          height: 36,
          borderRadius: 10,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
        },

        /* ─── Value ──────────────────────────────────────────── */
        value: {
          fontSize: 28,
          fontWeight: "700",
          color: colors.text,
          marginBottom: 4,
        },
        valueSmall: {
          fontSize: 22,
          fontWeight: "700",
          color: colors.text,
          marginBottom: 4,
        },
        label: {
          fontSize: 13,
          fontWeight: "500",
          color: colors.textSecondary,
          marginBottom: 8,
        },

        /* ─── Trend ──────────────────────────────────────────── */
        trend: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
        },
        trendText: {
          fontSize: 12,
          fontWeight: "600",
        },
        trendPositive: {
          color: "#22C55E",
        },
        trendNegative: {
          color: "#EF4444",
        },
        trendNeutral: {
          color: colors.textMuted,
        },

        /* ─── Safety Badge ───────────────────────────────────── */
        safetyBadge: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 8,
          backgroundColor: "#22C55E15",
        },
        safetyBadgeText: {
          fontSize: 12,
          fontWeight: "600",
          color: "#22C55E",
        },
        safetyBadgeWarning: {
          backgroundColor: "#F59E0B15",
        },
        safetyBadgeWarningText: {
          color: "#F59E0B",
        },
        safetyBadgeDanger: {
          backgroundColor: "#EF444415",
        },
        safetyBadgeDangerText: {
          color: "#EF4444",
        },

        /* ─── Compliment Item ────────────────────────────────── */
        complimentRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 8,
          borderTopWidth: 1,
          borderTopColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
        },
        complimentLeft: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        },
        complimentIcon: {
          width: 28,
          height: 28,
          borderRadius: 8,
          backgroundColor: "#FF6B0015",
          alignItems: "center",
          justifyContent: "center",
        },
        complimentText: {
          fontSize: 14,
          fontWeight: "500",
          color: colors.text,
        },
        complimentCount: {
          fontSize: 14,
          fontWeight: "700",
          color: colors.text,
        },
      }),
    [colors, isDark],
  );

  if (!stats) {
    return (
      <View style={{ alignItems: "center", paddingVertical: 48, paddingHorizontal: 32 }}>
        <TrendingUp size={48} color={colors.textMuted} />
        <Text style={{ fontSize: 18, fontWeight: "600", color: colors.text, marginTop: 16, textAlign: "center" }}>
          No performance data yet
        </Text>
        <Text style={{ fontSize: 14, fontWeight: "400", color: colors.textSecondary, marginTop: 8, textAlign: "center" }}>
          Complete trips to see your performance stats
        </Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* ─── Rating Card ──────────────────────────────────────── */}
      <View style={s.card}>
        <View style={[s.iconContainer, { backgroundColor: "#F59E0B15" }]}>
          <Star size={18} color="#F59E0B" />
        </View>
        <Text style={s.value}>{typeof stats.rating === "number" && Number.isFinite(stats.rating) ? stats.rating.toFixed(2) : "0.00"}</Text>
        <Text style={s.label}>Rating</Text>
        {typeof stats.ratingTrend === "number" && Number.isFinite(stats.ratingTrend) && (
          <View style={s.trend}>
            <TrendingUp
              size={12}
              color={stats.ratingTrend >= 0 ? "#22C55E" : "#EF4444"}
            />
            <Text
              style={[
                s.trendText,
                stats.ratingTrend >= 0 ? s.trendPositive : s.trendNegative,
              ]}
            >
              {stats.ratingTrend >= 0 ? "+" : ""}
              {stats.ratingTrend.toFixed(2)} this month
            </Text>
          </View>
        )}
      </View>

      {/* ─── Acceptance + Cancellation Row ────────────────────── */}
      <View style={s.cardRow}>
        {/* Acceptance Rate */}
        <View style={[s.card, s.cardHalf]}>
          <View style={[s.iconContainer, { backgroundColor: "#22C55E15" }]}>
            <ThumbsUp size={18} color="#22C55E" />
          </View>
          <Text style={s.valueSmall}>{stats.acceptanceRate}%</Text>
          <Text style={s.label}>Acceptance</Text>
          {stats.acceptanceTrend !== undefined && (
            <View style={s.trend}>
              <TrendingUp
                size={12}
                color={stats.acceptanceTrend >= 0 ? "#22C55E" : "#EF4444"}
              />
              <Text
                style={[
                  s.trendText,
                  stats.acceptanceTrend >= 0 ? s.trendPositive : s.trendNegative,
                ]}
              >
                {stats.acceptanceTrend >= 0 ? "+" : ""}
                {stats.acceptanceTrend}%
              </Text>
            </View>
          )}
        </View>

        {/* Cancellation Rate */}
        <View style={[s.card, s.cardHalf]}>
          <View style={[s.iconContainer, { backgroundColor: "#EF444415" }]}>
            <ThumbsDown size={18} color="#EF4444" />
          </View>
          <Text style={s.valueSmall}>{stats.cancellationRate}%</Text>
          <Text style={s.label}>Cancellation</Text>
          {stats.cancellationTrend !== undefined && (
            <View style={s.trend}>
              <TrendingUp
                size={12}
                color={stats.cancellationTrend <= 0 ? "#22C55E" : "#EF4444"}
              />
              <Text
                style={[
                  s.trendText,
                  stats.cancellationTrend <= 0 ? s.trendPositive : s.trendNegative,
                ]}
              >
                {stats.cancellationTrend > 0 ? "+" : ""}
                {stats.cancellationTrend}%
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* ─── Completed Trips ──────────────────────────────────── */}
      <View style={s.card}>
        <View style={[s.iconContainer, { backgroundColor: "#3B82F615" }]}>
          <CheckCircle2 size={18} color="#3B82F6" />
        </View>
        <Text style={s.value}>{stats.completedTrips.toLocaleString()}</Text>
        <Text style={s.label}>Completed Trips</Text>
        {stats.tripsTrend !== undefined && (
          <View style={s.trend}>
            <TrendingUp
              size={12}
              color={stats.tripsTrend >= 0 ? "#22C55E" : "#EF4444"}
            />
            <Text
              style={[
                s.trendText,
                stats.tripsTrend >= 0 ? s.trendPositive : s.trendNegative,
              ]}
            >
              {stats.tripsTrend >= 0 ? "+" : ""}
              {stats.tripsTrend} this week
            </Text>
          </View>
        )}
      </View>

      {/* ─── Customer Compliments ─────────────────────────────── */}
      <View style={s.card}>
        <View style={[s.iconContainer, { backgroundColor: "#FF6B0015" }]}>
          <MessageCircleHeart size={18} color="#FF6B00" />
        </View>
        <Text style={s.value}>{stats.compliments}</Text>
        <Text style={s.label}>Customer Compliments</Text>
        {stats.complimentsTrend !== undefined && (
          <View style={s.trend}>
            <TrendingUp
              size={12}
              color={stats.complimentsTrend >= 0 ? "#22C55E" : "#EF4444"}
            />
            <Text
              style={[
                s.trendText,
                stats.complimentsTrend >= 0 ? s.trendPositive : s.trendNegative,
              ]}
            >
              {stats.complimentsTrend >= 0 ? "+" : ""}
              {stats.complimentsTrend} this month
            </Text>
          </View>
        )}

        {/* Top Compliment Types */}
        <View style={s.complimentRow}>
          <View style={s.complimentLeft}>
            <View style={s.complimentIcon}>
              <Star size={12} color="#FF6B00" />
            </View>
            <Text style={s.complimentText}>Safe riding</Text>
          </View>
          <Text style={s.complimentCount}>34</Text>
        </View>
        <View style={s.complimentRow}>
          <View style={s.complimentLeft}>
            <View style={s.complimentIcon}>
              <MessageCircleHeart size={12} color="#FF6B00" />
            </View>
            <Text style={s.complimentText}>Friendly</Text>
          </View>
          <Text style={s.complimentCount}>28</Text>
        </View>
        <View style={[s.complimentRow, { borderBottomWidth: 0 }]}>
          <View style={s.complimentLeft}>
            <View style={s.complimentIcon}>
              <CheckCircle2 size={12} color="#FF6B00" />
            </View>
            <Text style={s.complimentText}>On time</Text>
          </View>
          <Text style={s.complimentCount}>27</Text>
        </View>
      </View>

      {/* ─── Safety Score ─────────────────────────────────────── */}
      <View style={s.card}>
        <View style={[s.iconContainer, { backgroundColor: "#22C55E15" }]}>
          <ShieldCheck size={18} color="#22C55E" />
        </View>
        <Text style={s.value}>{stats.safetyScore}%</Text>
        <Text style={s.label}>Safety Score</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {stats.safetyTrend !== undefined && (
            <View style={s.trend}>
              <TrendingUp
                size={12}
                color={stats.safetyTrend >= 0 ? "#22C55E" : "#EF4444"}
              />
              <Text
                style={[
                  s.trendText,
                  stats.safetyTrend >= 0 ? s.trendPositive : s.trendNegative,
                ]}
              >
                {stats.safetyTrend >= 0 ? "+" : ""}
                {stats.safetyTrend}%
              </Text>
            </View>
          )}
          <View
            style={[
              s.safetyBadge,
              stats.safetyScore < 80 && s.safetyBadgeDanger,
              stats.safetyScore >= 80 && stats.safetyScore < 90 && s.safetyBadgeWarning,
            ]}
          >
            <ShieldCheck
              size={12}
              color={
                stats.safetyScore < 80
                  ? "#EF4444"
                  : stats.safetyScore >= 90
                    ? "#22C55E"
                    : "#F59E0B"
              }
            />
            <Text
              style={[
                s.safetyBadgeText,
                stats.safetyScore < 80 && s.safetyBadgeDangerText,
                stats.safetyScore >= 80 &&
                  stats.safetyScore < 90 &&
                  s.safetyBadgeWarningText,
              ]}
            >
              {stats.safetyScore >= 90
                ? "Excellent"
                : stats.safetyScore >= 80
                  ? "Good"
                  : "Needs improvement"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
