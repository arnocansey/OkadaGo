import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NavigationHeader } from "@/components/ScreenHeader";
import { PerformanceCards } from "@/components/PerformanceCards";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";

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

/**
 * PerformanceScreen — Rider performance overview.
 *
 * Fetches performance data and displays as simple cards.
 */
export default function PerformanceScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useApp();
  const { colors } = useTheme();
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPerformance() {
      if (!session?.token) return;

      try {
        const data = await api<PerformanceData>("/rider/performance", {
          token: session.token,
        });
        setPerformance(data);
      } catch {
        // API endpoint not available — leave performance as null
        setPerformance(null);
      } finally {
        setLoading(false);
      }
    }

    fetchPerformance();
  }, [session?.token]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <NavigationHeader title="Performance" />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <PerformanceCards data={performance ?? undefined} />
      </ScrollView>
    </>
  );
}
