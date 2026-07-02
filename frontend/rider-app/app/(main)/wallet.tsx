import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { SkeletonList } from "@/components/ui/Skeleton";
import { compactDate, money } from "@/lib/api";
import { colors, spacing, typography } from "@/theme/tokens";

export default function WalletScreen() {
  const { session, wallets, transactions, payouts, loading, refresh, setMessage } = useApp();
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const wallet = wallets[0];

  async function requestPayout() {
    setSubmitting(true);
    try {
      await api("/wallets/rider/payout-requests", {
        method: "POST",
        token: session!.token,
        body: { amount: Number(amount), method: "mobile_money", destinationLabel: destination },
      });
      setAmount("");
      setDestination("");
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Payout request failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>Wallet</Text>

      <Card elevated style={styles.hero}>
        <Text style={styles.heroLabel}>Available balance</Text>
        <Text style={styles.heroAmount}>{money(wallet?.availableBalance, wallet?.currency ?? "GHS")}</Text>
      </Card>

      <Card style={styles.form}>
        <Text style={styles.section}>Request payout</Text>
        <Input label="Amount (GHS)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
        <Input label="Mobile money number" value={destination} onChangeText={setDestination} keyboardType="phone-pad" />
        <Button label="Request payout" variant="accent" loading={submitting} onPress={requestPayout} fullWidth />
      </Card>

      <Text style={styles.section}>Transactions</Text>
      {loading && transactions.length === 0 ? (
        <SkeletonList count={3} />
      ) : transactions.length === 0 ? (
        <EmptyState title="No transactions" message="Earnings and payouts will show here." />
      ) : (
        transactions.slice(0, 10).map((tx) => (
          <View key={tx.id} style={styles.tx}>
            <Text style={styles.txTitle}>{tx.description ?? tx.type}</Text>
            <Text style={styles.txAmount}>{money(tx.amount, tx.currency)}</Text>
          </View>
        ))
      )}

      {payouts.length > 0 ? (
        <>
          <Text style={[styles.section, { marginTop: spacing.xl }]}>Payout requests</Text>
          {payouts.slice(0, 5).map((p) => (
            <View key={p.id} style={styles.tx}>
              <View>
                <Text style={styles.txTitle}>{p.destinationLabel}</Text>
                <Text style={styles.txSub}>{p.status} · {compactDate(p.requestedAt)}</Text>
              </View>
              <Text style={styles.txAmount}>{money(p.amount, p.currency)}</Text>
            </View>
          ))}
        </>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: spacing.xl },
  title: { ...typography.h1, marginBottom: spacing.xl },
  hero: { backgroundColor: colors.accentLight, borderColor: colors.accent, marginBottom: spacing.lg },
  heroLabel: { ...typography.captionMedium, color: colors.textSecondary },
  heroAmount: { ...typography.hero, color: colors.text, marginTop: spacing.sm },
  form: { gap: spacing.md, marginBottom: spacing.xxl },
  section: { ...typography.h3, marginBottom: spacing.lg },
  tx: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  txTitle: { ...typography.bodyMedium },
  txSub: { ...typography.caption, color: colors.textMuted },
  txAmount: { ...typography.bodySemibold, color: colors.primary },
});
