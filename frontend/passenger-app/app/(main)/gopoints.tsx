import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Gift,
  MapPin,
  Medal,
  Star,
  Users,
  Zap,
} from "lucide-react-native";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";

type GoPointsData = {
  points: number;
  level: string;
  nextLevel: string;
  pointsToNext: number;
  totalEarned: number;
  recentActivity: Array<{
    id: string;
    description: string;
    points: number;
    date: string;
  }>;
};

const LEVELS = [
  { name: "Bronze", min: 0, color: "#CD7F32" },
  { name: "Silver", min: 500, color: "#C0C0C0" },
  { name: "Gold", min: 2000, color: "#FFD700" },
  { name: "Platinum", min: 5000, color: "#E5E4E2" },
];

const EARN_WAYS = [
  {
    icon: MapPin,
    title: "Ride with OkadaGo",
    desc: "Earn 5 points per ride",
    color: "#3B82F6",
    bg: "#EFF6FF",
  },
  {
    icon: Users,
    title: "Refer a friend",
    desc: "Earn 100 points per referral",
    color: "#22C55E",
    bg: "#F0FDF4",
  },
  {
    icon: Gift,
    title: "Promotions",
    desc: "Bonus points during events",
    color: "#A855F7",
    bg: "#FAF5FF",
  },
  {
    icon: Zap,
    title: "Streak bonus",
    desc: "3+ rides/week = 2x points",
    color: "#F59E0B",
    bg: "#FFFBEB",
  },
];

/**
 * GoPoints — Loyalty & rewards screen
 */
export default function GoPointsScreen() {
  const { session } = useApp();
  const { colors, isDark } = useTheme();
  const [data, setData] = useState<GoPointsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!session?.token) return;
    try {
      const result = await api<GoPointsData>("/loyalty/points", { token: session.token });
      setData(result);
    } catch {
      // Show empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [session?.token]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const currentLevelIndex = useMemo(() => {
    if (!data) return 0;
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (data.points >= LEVELS[i].min) return i;
    }
    return 0;
  }, [data]);

  const nextLevel = LEVELS[currentLevelIndex + 1] ?? null;
  const progress = useMemo(() => {
    if (!data || !nextLevel) return 1;
    const current = LEVELS[currentLevelIndex].min;
    const needed = nextLevel.min - current;
    const earned = data.points - current;
    return Math.min(1, earned / needed);
  }, [data, currentLevelIndex, nextLevel]);

  const s = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        scroll: { flex: 1 },
        content: { paddingBottom: 40 },

        /* ─── Points Hero ──────────────────────────────── */
        heroCard: {
          marginHorizontal: 20,
          marginTop: 4,
          marginBottom: 20,
          backgroundColor: isDark ? colors.surface : "#FFFFFF",
          borderRadius: 20,
          padding: 24,
          alignItems: "center",
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.3 : 0.06,
          shadowRadius: 12,
          elevation: 4,
        },
        pointsLabel: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
        pointsValue: {
          fontSize: 44,
          fontWeight: "800",
          color: colors.primary,
          marginTop: 4,
        },
        pointsUnit: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.textSecondary,
        },
        levelBadge: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          marginTop: 10,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 20,
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
        },
        levelText: {
          fontSize: 13,
          fontWeight: "700",
          color: LEVELS[currentLevelIndex].color,
        },

        /* ─── Progress ──────────────────────────────────── */
        progressSection: {
          marginHorizontal: 20,
          marginBottom: 24,
        },
        progressHeader: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        },
        progressLabel: {
          fontSize: 13,
          color: colors.textSecondary,
        },
        progressValue: {
          fontSize: 13,
          fontWeight: "700",
          color: colors.primary,
        },
        progressTrack: {
          height: 8,
          borderRadius: 4,
          backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
          overflow: "hidden",
        },
        progressFill: {
          height: "100%",
          borderRadius: 4,
          backgroundColor: colors.primary,
        },
        progressEnd: {
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 6,
        },
        progressEndText: {
          fontSize: 11,
          color: colors.textMuted,
        },

        /* ─── Section ───────────────────────────────────── */
        sectionTitle: {
          fontSize: 15,
          fontWeight: "700",
          color: colors.text,
          paddingHorizontal: 20,
          marginBottom: 12,
        },

        /* ─── Earn Ways ─────────────────────────────────── */
        earnGrid: {
          paddingHorizontal: 20,
          gap: 10,
          marginBottom: 24,
        },
        earnCard: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: isDark ? colors.surface : "#FFFFFF",
          borderRadius: 14,
          padding: 14,
          gap: 12,
          borderWidth: 1,
          borderColor: colors.border,
        },
        earnIconWrap: {
          width: 40,
          height: 40,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
        },
        earnInfo: {
          flex: 1,
        },
        earnTitle: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.text,
        },
        earnDesc: {
          fontSize: 12,
          color: colors.textSecondary,
          marginTop: 1,
        },

        /* ─── Activity ──────────────────────────────────── */
        activityCard: {
          marginHorizontal: 20,
          backgroundColor: isDark ? colors.surface : "#FFFFFF",
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: "hidden",
        },
        activityRow: {
          flexDirection: "row",
          alignItems: "center",
          padding: 14,
          gap: 12,
        },
        activityBorder: {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
        },
        activityContent: {
          flex: 1,
        },
        activityDesc: {
          fontSize: 14,
          fontWeight: "500",
          color: colors.text,
        },
        activityDate: {
          fontSize: 12,
          color: colors.textMuted,
          marginTop: 2,
        },
        activityPoints: {
          fontSize: 15,
          fontWeight: "700",
          color: colors.primary,
        },
      }),
    [colors, isDark, currentLevelIndex],
  );

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <ScreenHeader title="GoPoints" onBack={() => router.replace("/(main)")} />

        {/* ─── Points Hero ──────────────────────────────── */}
        <View style={s.heroCard}>
          <Text style={s.pointsLabel}>Your points</Text>
          <Text style={s.pointsValue}>{data?.points ?? 0}</Text>
          <View style={s.levelBadge}>
            <Medal size={14} color={LEVELS[currentLevelIndex].color} />
            <Text style={s.levelText}>{LEVELS[currentLevelIndex].name}</Text>
          </View>
        </View>

        {/* ─── Progress to Next Level ──────────────────── */}
        {nextLevel ? (
          <View style={s.progressSection}>
            <View style={s.progressHeader}>
              <Text style={s.progressLabel}>
                {LEVELS[currentLevelIndex].name} → {nextLevel.name}
              </Text>
              <Text style={s.progressValue}>
                {Math.max(0, nextLevel.min - (data?.points ?? 0))} pts to go
              </Text>
            </View>
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <View style={s.progressEnd}>
              <Text style={s.progressEndText}>{LEVELS[currentLevelIndex].min}</Text>
              <Text style={s.progressEndText}>{nextLevel.min}</Text>
            </View>
          </View>
        ) : null}

        {/* ─── Ways to Earn ────────────────────────────── */}
        <Text style={s.sectionTitle}>Ways to earn</Text>
        <View style={s.earnGrid}>
          {EARN_WAYS.map(({ icon: Icon, title, desc, color, bg }) => (
            <View key={title} style={s.earnCard}>
              <View style={[s.earnIconWrap, { backgroundColor: bg }]}>
                <Icon size={18} color={color} />
              </View>
              <View style={s.earnInfo}>
                <Text style={s.earnTitle}>{title}</Text>
                <Text style={s.earnDesc}>{desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ─── Recent Activity ──────────────────────────── */}
        <Text style={s.sectionTitle}>Recent activity</Text>
        {loading ? (
          <SkeletonList count={3} />
        ) : data?.recentActivity && data.recentActivity.length > 0 ? (
          <View style={s.activityCard}>
            {data.recentActivity.slice(0, 10).map((item, i) => (
              <View
                key={item.id}
                style={[s.activityRow, i > 0 && s.activityBorder]}
              >
                <View style={s.activityContent}>
                  <Text style={s.activityDesc}>{item.description}</Text>
                  <Text style={s.activityDate}>{item.date}</Text>
                </View>
                <Text style={s.activityPoints}>+{item.points}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={s.activityCard}>
            <View style={s.activityRow}>
              <View style={s.activityContent}>
                <Text style={s.activityDesc}>No activity yet</Text>
                <Text style={s.activityDate}>
                  Start earning by taking rides or referring friends.
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
