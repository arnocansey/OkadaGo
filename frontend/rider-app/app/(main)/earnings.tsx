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
  const [earnings, setEarnings] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEarnings = async () => {
    if (!session?.token) return;
    setLoading(true);
    setError(null);

    try {
      const data = await api<any>("/rider/earnings", {
        token: session.token,
      });
      setEarnings(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load earnings.");
      setEarnings(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, [session?.token]);

  const handleRequestCashout = async (amount: number) => {
    if (!session?.token) return;
    await api("/wallets/rider/payout-requests", {
      method: "POST",
      token: session.token,
      body: { amount },
    });
    await fetchEarnings();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ headerShown: false }} />
      <NavigationHeader title="Earnings" />
      {error ? (
        <View style={{ padding: 20 }}>
          <ErrorCard
            message={error}
            onRetry={() => {
              void fetchEarnings();
            }}
            onDismiss={() => setError(null)}
          />
        </View>
      ) : (
        <EarningsDashboard
          data={earnings ?? undefined}
          loading={loading}
          currency="GH₵"
          onRequestCashout={handleRequestCashout}
        />
      )}
    </View>
  );
}
