import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BalanceHero } from "@/components/ui/BalanceHero";
import { EmptyState } from "@/components/ui/EmptyState";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { api, compactDate, money } from "@/lib/api";
import { spacing } from "@/theme/tokens";

export default function EarningsScreen() {
  const { session, rides, deliveries, wallets, loading } = useApp();
  const { colors, typography } = useTheme();
  const currency = wallets[0]?.currency ?? "GHS";
  const [commissionPercent, setCommissionPercent] = useState<number | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    if (!session?.token) {
      setSettingsLoaded(true);
      return;
    }
    api<{ commissionPercent?: number }>("/auth/rider/settings", { token: session.token })
      .then((data) => setCommissionPercent(typeof data.commissionPercent === "number" ? data.commissionPercent : null))
      .catch(() => undefined)
      .finally(() => setSettingsLoaded(true));
  }, [session?.token]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background, padding: spacing.xl },
        section: { ...typography.h3, marginBottom: spacing.lg, color: colors.text },
        row: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingVertical: spacing.lg,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        rowBody: { flex: 1, marginRight: spacing.lg },
        rowTitle: { ...typography.bodyMedium, color: colors.text },
        rowDate: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
        rowAmount: { ...typography.bodySemibold, color: colors.primary },
      }),
    [colors, typography],
  );

  const completedRides = rides.filter((r) => (r.status ?? "").toLowerCase() === "completed");
  const completedDeliveries = deliveries.filter((d) => (d.status ?? "").toLowerCase() === "delivered");

  const total =
    completedRides.reduce((s, r) => s + Number(r.riderEarnings ?? r.finalFare ?? 0), 0) +
    completedDeliveries.reduce((s, d) => s + Number(d.riderEarnings ?? d.finalFee ?? 0), 0);

  const trips = [
    ...completedRides.map((r) => ({ id: r.id, label: r.destinationAddress, amount: r.riderEarnings ?? r.finalFare, date: r.createdAt })),
    ...completedDeliveries.map((d) => ({ id: d.id, label: d.dropoffAddress, amount: d.riderEarnings ?? d.finalFee, date: d.createdAt })),
  ].sort((a, b) => Date.parse(b.date ?? "0") - Date.parse(a.date ?? "0"));

  const showSkeleton = (loading || !settingsLoaded) && trips.length === 0;

  return (
    <SafeAreaView style={styles.screen}>
      <ScreenHeader title="Earnings" />

      <BalanceHero
        label="Total earned"
        amount={money(total, currency)}
        sub={`${completedRides.length + completedDeliveries.length} completed trips${
          commissionPercent != null ? ` · ${commissionPercent}% platform commission` : ""
        }`}
      />

      <Text style={styles.section}>Recent</Text>
      {showSkeleton ? (
        <SkeletonList count={4} />
      ) : trips.length === 0 ? (
        <EmptyState title="No earnings yet" message="Complete trips to see your earnings here." />
      ) : (
        trips.slice(0, 15).map((t) => (
          <View key={t.id} style={styles.row}>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle} numberOfLines={1}>{t.label}</Text>
              <Text style={styles.rowDate}>{compactDate(t.date)}</Text>
            </View>
            <Text style={styles.rowAmount}>{money(t.amount, currency)}</Text>
          </View>
        ))
      )}
    </SafeAreaView>
  );
}
