import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NavigationHeader } from "@/components/ScreenHeader";
import { EarningsDashboard } from "@/components/EarningsDashboard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorCard } from "@/components/ui/ErrorCard";
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEarnings() {
      if (!session?.token) return;
      setLoading(true);
      setError(null);

      try {
        const data = await api<EarningsData>("/rider/earnings", {
          token: session.token,
        });
        setEarnings(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load earnings.");
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
        {error ? (
          <ErrorCard
            message={error}
            onRetry={() => {
              setLoading(true);
              setError(null);
            }}
            onDismiss={() => setError(null)}
          />
        ) : (
          <EarningsDashboard
            data={earnings ?? undefined}
            loading={loading}
            currency="GH₵"
          />
        )}
      </ScrollView>
    </>
  );
}
