import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Animated,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Award,
  Star,
  TrendingUp,
  Shield,
  Clock,
  MapPin,
  Users,
  Zap,
  Target,
  Trophy,
  Medal,
  Flame,
  CheckCircle2,
} from "lucide-react-native";
import { NavigationHeader } from "@/components/ScreenHeader";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";
import { brand } from "@/theme/design-system";

type Achievement = {
  id: string;
  title: string;
  description: string;
  requirement: string;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: string;
  category: "trips" | "safety" | "earnings" | "community";
  rarity: "common" | "rare" | "epic" | "legendary";
};

const categories = [
  { id: "all", label: "All" },
  { id: "trips", label: "Trips" },
  { id: "safety", label: "Safety" },
  { id: "earnings", label: "Earnings" },
  { id: "community", label: "Community" },
];

const rarityColors = {
  common: { bg: "#64748B20", text: "#64748B" },
  rare: { bg: "#3B82F620", text: "#3B82F6" },
  epic: { bg: "#A855F720", text: "#A855F7" },
  legendary: { bg: "#F59E0B20", text: "#F59E0B" },
};

function getAchievementIcon(category: string, rarity: string) {
  const color = rarityColors[rarity as keyof typeof rarityColors]?.text ?? "#64748B";
  switch (category) {
    case "trips":
      return <Zap size={24} color={color} />;
    case "safety":
      return <Shield size={24} color={color} />;
    case "earnings":
      return <TrendingUp size={24} color={color} />;
    case "community":
      return <Users size={24} color={color} />;
    default:
      return <Award size={24} color={color} />;
  }
}

/**
 * RiderAchievements — Achievement badges fetched from API.
 */
export default function RiderAchievementsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { session } = useApp();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    async function fetchAchievements() {
      if (!session?.token) return;
      try {
        const data = await api<Achievement[]>("/rider/achievements", {
          token: session.token,
        });
        setAchievements(data);
      } catch {
        // API endpoint not available — leave achievements as empty
        setAchievements([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAchievements();
  }, [session?.token]);

  const filteredAchievements = useMemo(
    () =>
      selectedCategory === "all"
        ? achievements
        : achievements.filter((a) => a.category === selectedCategory),
    [selectedCategory, achievements],
  );

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;

  const s = useMemo(
    () =>
      StyleSheet.create({
        screen: {
          flex: 1,
          backgroundColor: colors.background,
        },
        content: {
          flex: 1,
          paddingHorizontal: 20,
        },

        /* ─── Stats Card ──────────────────────────────────────── */
        statsCard: {
          flexDirection: "row",
          backgroundColor: colors.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 16,
          marginBottom: 16,
        },
        statItem: {
          flex: 1,
          alignItems: "center",
        },
        statValue: {
          fontSize: 24,
          fontWeight: "700",
          color: colors.text,
        },
        statLabel: {
          fontSize: 12,
          fontWeight: "500",
          color: colors.textSecondary,
          marginTop: 2,
        },
        statDivider: {
          width: 1,
          backgroundColor: colors.border,
          marginVertical: 4,
        },

        /* ─── Filter Tabs ─────────────────────────────────────── */
        filterRow: {
          flexDirection: "row",
          gap: 8,
          marginBottom: 16,
        },
        filterTab: {
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 20,
          backgroundColor: colors.surfaceOverlay,
        },
        filterTabActive: {
          backgroundColor: brand.primary,
        },
        filterText: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.textSecondary,
        },
        filterTextActive: {
          color: "#000000",
        },

        /* ─── Achievement Card ────────────────────────────────── */
        achievementCard: {
          backgroundColor: colors.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 16,
          marginBottom: 12,
        },
        achievementCardUnlocked: {
          borderColor: brand.primary + "40",
        },
        achievementHeader: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          marginBottom: 8,
        },
        achievementIcon: {
          width: 48,
          height: 48,
          borderRadius: 14,
          backgroundColor: brand.primary + "20",
          alignItems: "center",
          justifyContent: "center",
        },
        achievementInfo: {
          flex: 1,
        },
        achievementTitle: {
          fontSize: 16,
          fontWeight: "600",
          color: colors.text,
        },
        achievementRarity: {
          fontSize: 11,
          fontWeight: "600",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginTop: 2,
        },
        achievementStatus: {
          width: 28,
          height: 28,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
        },
        achievementDesc: {
          fontSize: 14,
          fontWeight: "400",
          color: colors.textSecondary,
          marginBottom: 8,
        },
        achievementProgress: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        },
        progressBar: {
          flex: 1,
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.surfaceOverlay,
          overflow: "hidden",
        },
        progressFill: {
          height: "100%",
          borderRadius: 3,
          backgroundColor: brand.primary,
        },
        progressText: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.textSecondary,
        },
        achievementDate: {
          fontSize: 12,
          fontWeight: "500",
          color: colors.textMuted,
          marginTop: 8,
        },

        /* ─── Empty State ─────────────────────────────────────── */
        emptyState: {
          alignItems: "center",
          paddingVertical: 48,
        },
        emptyIcon: {
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: colors.surfaceOverlay,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        },
        emptyTitle: {
          fontSize: 18,
          fontWeight: "600",
          color: colors.text,
          marginBottom: 4,
        },
        emptyText: {
          fontSize: 14,
          fontWeight: "400",
          color: colors.textSecondary,
          textAlign: "center",
        },
        loadingContainer: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        },
      }),
    [colors, isDark],
  );

  if (loading) {
    return (
      <SafeAreaView style={s.screen}>
        <NavigationHeader title="Achievements" />
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={brand.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.screen}>
      <NavigationHeader title="Achievements" />

      <ScrollView
        style={s.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Stats Card */}
        <Animated.View style={[s.statsCard, { opacity: fadeAnim }]}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{totalCount}</Text>
            <Text style={s.statLabel}>Total</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: brand.primary }]}>
              {unlockedCount}
            </Text>
            <Text style={s.statLabel}>Unlocked</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statValue}>{totalCount - unlockedCount}</Text>
            <Text style={s.statLabel}>Locked</Text>
          </View>
        </Animated.View>

        {/* Filter Tabs */}
        <View style={s.filterRow}>
          {categories.map((cat) => (
            <Pressable
              key={cat.id}
              style={[
                s.filterTab,
                selectedCategory === cat.id && s.filterTabActive,
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text
                style={[
                  s.filterText,
                  selectedCategory === cat.id && s.filterTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Achievements List */}
        {filteredAchievements.length === 0 ? (
          <View style={s.emptyState}>
            <View style={s.emptyIcon}>
              <Award size={28} color={colors.textMuted} />
            </View>
            <Text style={s.emptyTitle}>No achievements yet</Text>
            <Text style={s.emptyText}>
              Complete trips and reach milestones to unlock badges
            </Text>
          </View>
        ) : (
          filteredAchievements.map((achievement, index) => (
            <Animated.View
              key={achievement.id}
              style={[
                s.achievementCard,
                achievement.unlocked && s.achievementCardUnlocked,
                { opacity: fadeAnim },
              ]}
            >
              <View style={s.achievementHeader}>
                <View
                  style={[
                    s.achievementIcon,
                    {
                      backgroundColor: achievement.unlocked
                        ? rarityColors[achievement.rarity].bg
                        : colors.surfaceOverlay,
                    },
                  ]}
                >
                  {getAchievementIcon(achievement.category, achievement.rarity)}
                </View>
                <View style={s.achievementInfo}>
                  <Text style={s.achievementTitle}>{achievement.title}</Text>
                  <Text
                    style={[
                      s.achievementRarity,
                      { color: rarityColors[achievement.rarity].text },
                    ]}
                  >
                    {achievement.rarity}
                  </Text>
                </View>
                <View
                  style={[
                    s.achievementStatus,
                    {
                      backgroundColor: achievement.unlocked
                        ? "#22C55E"
                        : colors.surfaceOverlay,
                    },
                  ]}
                >
                  {achievement.unlocked ? (
                    <CheckCircle2 size={16} color="#FFFFFF" />
                  ) : (
                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>🔒</Text>
                  )}
                </View>
              </View>

              <Text style={s.achievementDesc}>{achievement.description}</Text>

              {achievement.unlocked ? (
                <Text style={s.achievementDate}>
                  Unlocked {achievement.unlockedAt}
                </Text>
              ) : (
                <View style={s.achievementProgress}>
                  <View style={s.progressBar}>
                    <View
                      style={[
                        s.progressFill,
                        {
                          width: `${(achievement.progress / achievement.maxProgress) * 100}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={s.progressText}>
                    {achievement.progress}/{achievement.maxProgress}
                  </Text>
                </View>
              )}
            </Animated.View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
