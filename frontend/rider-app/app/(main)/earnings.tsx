import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NavigationHeader } from "@/components/ScreenHeader";
import { EarningsDashboard } from "@/components/EarningsDashboard";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";

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

/**
 * EarningsScreen — Full earnings dashboard for riders.
 *
 * Fetches earnings data from API and displays the
 * premium earnings dashboard with stats, graph, and comparisons.
 */
export default function EarningsScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useApp();
  const { colors } = useTheme();
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEarnings() {
      if (!session?.token) return;

      try {
        const data = await api<EarningsData>("/rider/earnings", {
          token: session.token,
        });
        setEarnings(data);
      } catch {
        // API endpoint not available — leave earnings as null
        setEarnings(null);
      } finally {
        setLoading(false);
      }
    }

    fetchEarnings();
  }, [session?.token]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <NavigationHeader title="Earnings" />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <EarningsDashboard
          data={earnings ?? undefined}
          loading={loading}
          currency="GH₵"
        />
      </ScrollView>
    </>
  );
}
