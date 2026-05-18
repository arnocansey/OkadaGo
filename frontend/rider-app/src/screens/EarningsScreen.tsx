import { Linking, Text, View } from "react-native";
import { useState } from "react";
import { api, compactDate, money } from "../api";
import { Card, EmptyState, Field, PrimaryButton, SectionTitle, StatCard, styles } from "../components/ui";
import type { Ride, Session, Wallet, WalletTransaction } from "../types";

export function EarningsScreen({ session, wallets, rides, transactions, onRefresh }: { session: Session; wallets: Wallet[]; rides: Ride[]; transactions: WalletTransaction[]; onRefresh: () => void }) {
  const settlementWallet = wallets.find((wallet) => wallet.type === "RIDER_SETTLEMENT") ?? wallets[0];
  const balance = Number(settlementWallet?.availableBalance ?? 0);
  const deficit = balance < 0 ? Math.abs(balance) : 0;
  const completed = rides.filter((ride) => ride.status === "COMPLETED");
  const totalEarnings = completed.reduce((sum, ride) => sum + Number(ride.riderEarnings ?? 0), 0);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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
      <SectionTitle kicker="Earnings" title="Settlement overview" />
      <View style={styles.grid}>
        <StatCard label="Earned" value={money(totalEarnings, settlementWallet?.currency ?? session.user.preferredCurrency)} />
        <StatCard label="Completed" value={`${completed.length}`} />
      </View>
      <Card style={deficit >= 200 ? styles.lockedCard : undefined}>
        <SectionTitle kicker="Deficit policy" title={deficit >= 200 ? "Offline lock active" : "Settlement health"} />
        <Text style={styles.muted}>Warn at GHS 100 deficit and force offline at GHS 200 until topped up.</Text>
        <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "900" }}>Current deficit: {money(deficit, settlementWallet?.currency ?? session.user.preferredCurrency)}</Text>
      </Card>
      <Card>
        <SectionTitle kicker="Pay deficit" title="Top up settlement wallet" />
        <Field label="Amount" value={amount} onChangeText={setAmount} placeholder="200" keyboardType="numeric" />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <PrimaryButton label={busy ? "Opening Paystack..." : "Pay deficit"} onPress={topUp} disabled={busy || !Number(amount)} />
      </Card>
      <Card>
        <SectionTitle kicker="Activity" title="Settlement transactions" />
        {transactions.length ? transactions.slice(0, 8).map((tx) => <Text key={tx.id} style={{ color: "#FFFFFF" }}>{tx.description ?? tx.type} - {tx.direction === "debit" ? "-" : "+"}{money(tx.amount, tx.currency)} - {compactDate(tx.createdAt)}</Text>) : <EmptyState title="No settlement activity." body="Ride earnings and top-ups will appear here." />}
      </Card>
    </>
  );
}
