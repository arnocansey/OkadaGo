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
  ArrowRight,
  ChevronRight,
  Clock,
  Flame,
  MapPin,
  Navigation,
  TrendingUp,
  Zap,
} from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { openGoogleMapsNavigation, openWazeNavigation } from "@/lib/navigation";
import { brand, layers } from "@/theme/design-system";

type DemandZone = {
  id: string;
  name: string;
  requests: number;
  avgWait: number;
  trend: "up" | "down" | "stable";
  latitude: number;
  longitude: number;
};

type Props = {
  zones?: DemandZone[];
  onSelectZone?: (zone: DemandZone) => void;
  onNavigate?: (zone: DemandZone) => void;
  loading?: boolean;
};

/**
 * DemandHeatMap — Rider demand heat map overlay.
 *
 * Subtle heat zones showing high-demand areas.
 * Contextual info cards with request counts and navigation.
 *
 * Layout:
 * ┌─────────────────────────────────┐
 * │  🔥 High Demand Areas           │
 * │  ─────────────────────────────  │
 * │  ┌─────────────────────────────┐│
 * │  │  📍 Osu                     ││
 * │  │  8 requests · ~3 min wait   ││
 * │  │  ▲ Trending up              ││
 * │  │  ┌─────────────────────┐    ││
 * │  │  │ Navigate →          │    ││
 * │  │  └─────────────────────┘    ││
 * │  └─────────────────────────────┘│
 * │  ┌─────────────────────────────┐│
 * │  │  📍 Accra Mall              ││
 * │  │  6 requests · ~5 min wait   ││
 * │  │  ● Stable                   ││
 * │  │  ┌─────────────────────┐    ││
 * │  │  │ Navigate →          │    ││
 * │  │  └─────────────────────┘    ││
 * │  └─────────────────────────────┘│
 * │  ┌─────────────────────────────┐│
 * │  │  📍 Legon                   ││
 * │  │  5 requests · ~4 min wait   ││
 * │  │  ▲ Trending up              ││
 * │  │  ┌─────────────────────┐    ││
 * │  │  │ Navigate →          │    ││
 * │  │  └─────────────────────┘    ││
 * │  └─────────────────────────────┘│
 * └─────────────────────────────────┘
 */
export function DemandHeatMap({
  zones,
  onSelectZone,
  onNavigate,
  loading = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [selectedZone, setSelectedZone] = useState<DemandZone | null>(null);

  // Use real data from API — no mock fallback
  const demandZones = zones ?? [];

  // Sort by requests (highest first)
  const sortedZones = useMemo(
    () => [...demandZones].sort((a, b) => b.requests - a.requests),
    [demandZones],
  );

  // Get intensity level for visual styling
  function getIntensity(requests: number): "high" | "medium" | "low" {
    if (requests >= 8) return "high";
    if (requests >= 5) return "medium";
    return "low";
  }

  function getTrendIcon(trend: "up" | "down" | "stable") {
    switch (trend) {
      case "up":
        return <TrendingUp size={12} color="#22C55E" />;
      case "down":
        return <TrendingUp size={12} color="#EF4444" style={{ transform: [{ rotate: "180deg" }] }} />;
      default:
        return <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.textMuted }} />;
    }
  }

  function getTrendText(trend: "up" | "down" | "stable") {
    switch (trend) {
      case "up":
        return "Trending up";
      case "down":
        return "Trending down";
      default:
        return "Stable";
    }
  }

  function handleNavigate(zone: DemandZone) {
    onNavigate?.(zone);
    openGoogleMapsNavigation(zone.latitude, zone.longitude, zone.name);
  }

  const s = useMemo(
    () =>
      StyleSheet.create({
        container: {
          gap: 12,
        },

        /* ─── Header ─────────────────────────────────────────── */
        header: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginBottom: 4,
        },
        headerIcon: {
          width: 28,
          height: 28,
          borderRadius: 8,
          backgroundColor: "#FF6B0020",
          alignItems: "center",
          justifyContent: "center",
        },
        headerTitle: {
          fontSize: 15,
          fontWeight: "700",
          color: colors.text,
        },
        headerSubtitle: {
          fontSize: 12,
          fontWeight: "500",
          color: colors.textMuted,
          marginBottom: 12,
        },

        /* ─── Zone Card ──────────────────────────────────────── */
        zoneCard: {
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
          borderRadius: 16,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          padding: 16,
          overflow: "hidden",
        },
        zoneCardHigh: {
          borderColor: "#FF6B0030",
        },
        zoneCardMedium: {
          borderColor: "#F59E0B20",
        },
        zoneHeader: {
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 12,
        },
        zoneNameRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        },
        zoneIcon: {
          width: 32,
          height: 32,
          borderRadius: 10,
          alignItems: "center",
          justifyContent: "center",
        },
        zoneIconHigh: {
          backgroundColor: "#FF6B0020",
        },
        zoneIconMedium: {
          backgroundColor: "#F59E0B15",
        },
        zoneIconLow: {
          backgroundColor: colors.surfaceOverlay,
        },
        zoneName: {
          fontSize: 16,
          fontWeight: "600",
          color: colors.text,
        },
        zoneRequests: {
          fontSize: 24,
          fontWeight: "700",
          color: colors.text,
        },
        zoneRequestsLabel: {
          fontSize: 11,
          fontWeight: "500",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },

        /* ─── Stats Row ──────────────────────────────────────── */
        statsRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 16,
          marginBottom: 12,
        },
        statItem: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        },
        statIcon: {
          width: 20,
          height: 20,
          borderRadius: 6,
          backgroundColor: colors.surfaceOverlay,
          alignItems: "center",
          justifyContent: "center",
        },
        statText: {
          fontSize: 13,
          fontWeight: "500",
          color: colors.textSecondary,
        },
        trendRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        },
        trendText: {
          fontSize: 12,
          fontWeight: "600",
        },
        trendUp: {
          color: "#22C55E",
        },
        trendDown: {
          color: "#EF4444",
        },
        trendStable: {
          color: colors.textMuted,
        },

        /* ─── Context Card ────────────────────────────────────── */
        contextCard: {
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
          borderRadius: 10,
          padding: 10,
          marginBottom: 12,
        },
        contextText: {
          fontSize: 12,
          fontWeight: "500",
          color: colors.textSecondary,
          lineHeight: 17,
        },
        contextHighlight: {
          fontWeight: "700",
          color: colors.text,
        },

        /* ─── Heat Indicator ──────────────────────────────────── */
        heatBar: {
          flexDirection: "row",
          gap: 2,
          marginBottom: 12,
        },
        heatDot: {
          width: 8,
          height: 8,
          borderRadius: 4,
        },
        heatDotActive: {
          backgroundColor: "#FF6B00",
        },
        heatDotInactive: {
          backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        },

        /* ─── Navigate Button ─────────────────────────────────── */
        navigateBtn: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          height: 40,
          borderRadius: 10,
          backgroundColor: brand.primary,
        },
        navigateBtnText: {
          fontSize: 13,
          fontWeight: "700",
          color: "#000000",
        },
        navigateBtnSecondary: {
          backgroundColor: colors.surfaceOverlay,
        },
        navigateBtnSecondaryText: {
          color: colors.textSecondary,
        },

        /* ─── Loading ─────────────────────────────────────────── */
        loadingContainer: {
          padding: 40,
          alignItems: "center",
          gap: 12,
        },
        loadingText: {
          fontSize: 14,
          fontWeight: "500",
          color: colors.textMuted,
        },
      }),
    [colors, isDark],
  );

  if (loading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={brand.primary} />
        <Text style={s.loadingText}>Loading demand data...</Text>
      </View>
    );
  }

  if (sortedZones.length === 0) {
    return (
      <View style={{ alignItems: "center", paddingVertical: 48, paddingHorizontal: 32 }}>
        <Flame size={48} color={colors.textMuted} />
        <Text style={{ fontSize: 18, fontWeight: "600", color: colors.text, marginTop: 16, textAlign: "center" }}>
          No demand data available
        </Text>
        <Text style={{ fontSize: 14, fontWeight: "400", color: colors.textSecondary, marginTop: 8, textAlign: "center" }}>
          Demand zones will appear when passengers are requesting rides
        </Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* ─── Header ─────────────────────────────────────────── */}
      <View style={s.header}>
        <View style={s.headerIcon}>
          <Flame size={14} color="#FF6B00" />
        </View>
        <Text style={s.headerTitle}>High Demand Areas</Text>
      </View>
      <Text style={s.headerSubtitle}>
        Areas with high passenger demand right now
      </Text>

      {/* ─── Zone Cards ─────────────────────────────────────── */}
      {sortedZones.map((zone) => {
        const intensity = getIntensity(zone.requests);
        const isSelected = selectedZone?.id === zone.id;

        return (
          <View
            key={zone.id}
            style={[
              s.zoneCard,
              intensity === "high" && s.zoneCardHigh,
              intensity === "medium" && s.zoneCardMedium,
            ]}
          >
            {/* Zone Header */}
            <View style={s.zoneHeader}>
              <View style={s.zoneNameRow}>
                <View
                  style={[
                    s.zoneIcon,
                    intensity === "high" && s.zoneIconHigh,
                    intensity === "medium" && s.zoneIconMedium,
                    intensity === "low" && s.zoneIconLow,
                  ]}
                >
                  <MapPin
                    size={16}
                    color={
                      intensity === "high"
                        ? "#FF6B00"
                        : intensity === "medium"
                          ? "#F59E0B"
                          : colors.textMuted
                    }
                  />
                </View>
                <Text style={s.zoneName}>{zone.name}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={s.zoneRequests}>{zone.requests}</Text>
                <Text style={s.zoneRequestsLabel}>requests</Text>
              </View>
            </View>

            {/* Heat Indicator */}
            <View style={s.heatBar}>
              {[1, 2, 3, 4, 5].map((level) => (
                <View
                  key={level}
                  style={[
                    s.heatDot,
                    level <= (intensity === "high" ? 5 : intensity === "medium" ? 3 : 1)
                      ? s.heatDotActive
                      : s.heatDotInactive,
                  ]}
                />
              ))}
            </View>

            {/* Stats Row */}
            <View style={s.statsRow}>
              <View style={s.statItem}>
                <View style={s.statIcon}>
                  <Clock size={10} color={colors.textSecondary} />
                </View>
                <Text style={s.statText}>~{zone.avgWait} min wait</Text>
              </View>
              <View style={s.trendRow}>
                {getTrendIcon(zone.trend)}
                <Text
                  style={[
                    s.trendText,
                    zone.trend === "up" && s.trendUp,
                    zone.trend === "down" && s.trendDown,
                    zone.trend === "stable" && s.trendStable,
                  ]}
                >
                  {getTrendText(zone.trend)}
                </Text>
              </View>
            </View>

            {/* Context Card */}
            <View style={s.contextCard}>
              <Text style={s.contextText}>
                <Text style={s.contextHighlight}>High demand near {zone.name}</Text>
                {" — "}
                estimated {zone.requests} requests in the last 15 minutes
                {zone.trend === "up" ? " and rising" : ""}
              </Text>
            </View>

            {/* Navigate Button */}
            <Pressable
              style={s.navigateBtn}
              onPress={() => handleNavigate(zone)}
              accessibilityRole="button"
              accessibilityLabel={`Navigate to ${zone.name}`}
            >
              <Navigation size={14} color="#000000" />
              <Text style={s.navigateBtnText}>Navigate to {zone.name}</Text>
              <ArrowRight size={14} color="#000000" />
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
