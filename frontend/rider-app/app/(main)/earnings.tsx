import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "@/components/ui/Card";
import { useApp } from "@/context/AppContext";
import { compactDate, money } from "@/lib/api";
import { colors, spacing, typography } from "@/theme/tokens";

export default function EarningsScreen() {
  const { rides, deliveries, wallets } = useApp();
  const currency = wallets[0]?.currency ?? "GHS";

  const completedRides = rides.filter((r) => (r.status ?? "").toLowerCase() === "completed");
  const completedDeliveries = deliveries.filter((d) => (d.status ?? "").toLowerCase() === "delivered");

  const total =
    completedRides.reduce((s, r) => s + Number(r.riderEarnings ?? r.finalFare ?? 0), 0) +
    completedDeliveries.reduce((s, d) => s + Number(d.riderEarnings ?? d.finalFee ?? 0), 0);

  const trips = [
    ...completedRides.map((r) => ({ id: r.id, label: r.destinationAddress, amount: r.riderEarnings ?? r.finalFare, date: r.createdAt })),
    ...completedDeliveries.map((d) => ({ id: d.id, label: d.dropoffAddress, amount: d.riderEarnings ?? d.finalFee, date: d.createdAt })),
  ].sort((a, b) => Date.parse(b.date ?? "0") - Date.parse(a.date ?? "0"));

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>Earnings</Text>

      <Card elevated style={styles.hero}>
        <Text style={styles.heroLabel}>Total earned</Text>
        <Text style={styles.heroAmount}>{money(total, currency)}</Text>
        <Text style={styles.heroSub}>{completedRides.length + completedDeliveries.length} completed trips</Text>
      </Card>

      <Text style={styles.section}>Recent</Text>
      {trips.slice(0, 15).map((t) => (
        <View key={t.id} style={styles.row}>
          <View style={styles.rowBody}>
            <Text style={styles.rowTitle} numberOfLines={1}>{t.label}</Text>
            <Text style={styles.rowDate}>{compactDate(t.date)}</Text>
          </View>
          <Text style={styles.rowAmount}>{money(t.amount, currency)}</Text>
        </View>
      ))}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: spacing.xl },
  title: { ...typography.h1, marginBottom: spacing.xl },
  hero: { backgroundColor: colors.primary, borderColor: colors.primary, marginBottom: spacing.xxl },
  heroLabel: { ...typography.caption, color: "rgba(0,0,0,0.65)" },
  heroAmount: { ...typography.hero, color: colors.textOnPrimary, marginTop: spacing.sm },
  heroSub: { ...typography.caption, color: "rgba(0,0,0,0.65)", marginTop: spacing.sm },
  section: { ...typography.h3, marginBottom: spacing.lg },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowBody: { flex: 1, marginRight: spacing.lg },
  rowTitle: { ...typography.bodyMedium },
  rowDate: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  rowAmount: { ...typography.bodySemibold, color: colors.primary },
});
