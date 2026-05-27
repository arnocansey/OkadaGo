import { Linking, Pressable, Text, View } from "react-native";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { api, compactDate, money } from "../api";
import { Card, EmptyState, Field, ListRow, Pill, PrimaryButton, SectionTitle, StatCard, styles } from "../components/ui";
import type { Ride, Session, Wallet, WalletTransaction } from "../types";

export function EarningsScreen({ session, wallets, rides, transactions, onRefresh }: { session: Session; wallets: Wallet[]; rides: Ride[]; transactions: WalletTransaction[]; onRefresh: () => void }) {
  const settlementWallet = wallets.find((wallet) => wallet.type === "RIDER_SETTLEMENT") ?? wallets[0];
  const balance = Number(settlementWallet?.availableBalance ?? 0);
  const deficit = balance < 0 ? Math.abs(balance) : 0;
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");
  const [periodOffset, setPeriodOffset] = useState(0);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const now = new Date();
  const selectedDate = new Date(now);
  if (period === "day") selectedDate.setDate(now.getDate() + periodOffset);
  if (period === "week") selectedDate.setDate(now.getDate() + periodOffset * 7);
  if (period === "month") selectedDate.setMonth(now.getMonth() + periodOffset);

  const periodStart = new Date(selectedDate);
  const periodEnd = new Date(selectedDate);
  if (period === "day") {
    periodStart.setHours(0, 0, 0, 0);
    periodEnd.setHours(23, 59, 59, 999);
  } else if (period === "week") {
    const day = periodStart.getDay();
    const diff = periodStart.getDate() - day + (day === 0 ? -6 : 1);
    periodStart.setDate(diff);
    periodStart.setHours(0, 0, 0, 0);
    periodEnd.setTime(periodStart.getTime());
    periodEnd.setDate(periodStart.getDate() + 6);
    periodEnd.setHours(23, 59, 59, 999);
  } else {
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);
    periodEnd.setMonth(periodStart.getMonth() + 1, 0);
    periodEnd.setHours(23, 59, 59, 999);
  }

  const completed = rides.filter((ride) => {
    const completedStatus = (ride.status ?? "").toLowerCase() === "completed";
    const createdAt = ride.createdAt ? new Date(ride.createdAt) : null;
    return completedStatus && createdAt && createdAt >= periodStart && createdAt <= periodEnd;
  });
  const totalEarnings = completed.reduce((sum, ride) => sum + Number(ride.riderEarnings ?? 0), 0);
  const dateLabel =
    period === "day"
      ? selectedDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
      : period === "week"
        ? `${periodStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${periodEnd.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
        : selectedDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  async function topUp() {
    setBusy(true);
    setError("");
    try {
      const result = await api<{ authorizationUrl: string }>("/wallets/top-up/paystack/initialize", { method: "POST", token: session.token, body: { amount: Number(amount), currency: session.user.preferredCurrency, walletType: "rider_settlement", description: "Rider settlement top-up" } });
      await Linking.openURL(result.authorizationUrl);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Top-up failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Text style={styles.pageTitle}>Earnings</Text>
      <View style={styles.earningsTabs}>
        {(["day", "week", "month"] as const).map((tab) => (
          <Pressable
            key={tab}
            style={[styles.earningsTab, period === tab && styles.earningsTabActive]}
            onPress={() => {
              setPeriod(tab);
              setPeriodOffset(0);
            }}
          >
            <Text style={[styles.earningsTabText, period === tab && styles.earningsTabTextActive]}>{tab}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.earningsDateRow}>
        <Pressable style={styles.circleButton} onPress={() => setPeriodOffset((value) => value - 1)}><ChevronLeft size={20} color="#FFFFFF" /></Pressable>
        <Text style={styles.earningsDateText}>{dateLabel}</Text>
        <Pressable style={styles.circleButton} onPress={() => setPeriodOffset((value) => value + 1)}><ChevronRight size={20} color="#FFFFFF" /></Pressable>
      </View>

      <Card style={styles.earningsHero}>
        <Text style={styles.earningsHeroLabel}>Total Earnings</Text>
        <Text style={styles.earningsHeroAmount}>{money(totalEarnings, settlementWallet?.currency ?? session.user.preferredCurrency)}</Text>
        <View style={styles.earningsRideCount}><Text style={styles.earningsRideCountText}>{completed.length} Rides</Text></View>
      </Card>

      <Pill label={deficit >= 200 ? "Offline lock" : deficit > 0 ? "Deficit warning" : "Healthy"} tone={deficit >= 200 ? "danger" : deficit > 0 ? "warning" : "success"} />
      <View style={styles.grid}>
        <StatCard label="Earned" value={money(totalEarnings, settlementWallet?.currency ?? session.user.preferredCurrency)} />
        <StatCard label="Completed" value={`${completed.length}`} />
      </View>
      <Card style={deficit >= 200 ? styles.lockedCard : undefined}>
        <SectionTitle kicker="Deficit policy" title={deficit >= 200 ? "Offline lock active" : "Settlement health"} />
        <Text style={styles.muted}>Warn at GHS 100 deficit and force offline at GHS 200 until topped up.</Text>
        <Text style={styles.emptyTitle}>Current deficit: {money(deficit, settlementWallet?.currency ?? session.user.preferredCurrency)}</Text>
      </Card>
      <Card>
        <SectionTitle kicker="Pay deficit" title="Top up settlement wallet" />
        <Field label="Amount" value={amount} onChangeText={setAmount} placeholder="200" keyboardType="numeric" />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <PrimaryButton label={busy ? "Opening Paystack..." : "Pay deficit"} onPress={topUp} disabled={busy || !Number(amount)} />
      </Card>
      <Card>
        <SectionTitle kicker="Activity" title="Earnings history" />
        <View style={styles.performanceBars}>
          {[20, 40, 30, 70, 50, 100, 80].map((height, index) => (
            <View key={index} style={styles.performanceBarTrack}>
              <View style={[styles.performanceBar, { height: `${height}%` }, index === 6 && styles.performanceBarActive]} />
            </View>
          ))}
        </View>
        {transactions.length ? transactions.slice(0, 8).map((tx) => (
          <ListRow
            key={tx.id}
            title={tx.description ?? tx.type}
            body={tx.status}
            meta={compactDate(tx.createdAt)}
            amount={`${tx.direction === "debit" ? "-" : "+"}${money(tx.amount, tx.currency)}`}
          />
        )) : <EmptyState title="No settlement activity." body="Ride earnings and top-ups will appear here." />}
      </Card>
    </>
  );
}
