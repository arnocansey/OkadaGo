import { Linking, Text, View } from "react-native";
import { useState } from "react";
import { api, compactDate, money } from "../api";
import { Card, EmptyState, Field, ListRow, Pill, PrimaryButton, SectionTitle, StatCard, styles } from "../components/ui";
import type { Session, Wallet, WalletTransaction } from "../types";

export function WalletScreen({ session, wallets, transactions, onRefresh }: { session: Session; wallets: Wallet[]; transactions: WalletTransaction[]; onRefresh: () => void }) {
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function topUp() {
    setBusy(true);
    setError("");
    try {
      const result = await api<{ authorizationUrl: string }>("/wallets/top-up/paystack/initialize", {
        method: "POST",
        token: session.token,
        body: { amount: Number(amount), currency: session.user.preferredCurrency, walletType: "passenger_cashless", description: "Passenger mobile wallet top-up" },
      });
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
      <SectionTitle kicker="Wallet" title="Balance and activity" />
      <Pill label="Paystack enabled" tone="success" />
      <View style={styles.grid}>
        {wallets.length ? wallets.map((wallet) => <StatCard key={wallet.id} label={wallet.type.replaceAll("_", " ")} value={money(wallet.availableBalance, wallet.currency)} />) : <StatCard label="Wallet" value={money(0, session.user.preferredCurrency)} />}
      </View>
      <Card>
        <SectionTitle kicker="Top up" title="Add money with Paystack" />
        <Field label="Amount" value={amount} onChangeText={setAmount} placeholder="50" keyboardType="numeric" />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <PrimaryButton label={busy ? "Opening Paystack..." : "Top up wallet"} onPress={topUp} disabled={busy || !Number(amount)} />
      </Card>
      <Card>
        <SectionTitle kicker="Activity" title="Wallet transactions" />
        {transactions.length ? (
          transactions.map((tx) => (
            <ListRow
              key={tx.id}
              title={tx.description ?? tx.type}
              body={tx.status}
              meta={compactDate(tx.createdAt)}
              amount={`${tx.direction === "debit" ? "-" : "+"}${money(tx.amount, tx.currency)}`}
            />
          ))
        ) : (
          <EmptyState title="No wallet activity yet." body="Top-ups and ride payments will be listed here." />
        )}
      </Card>
    </>
  );
}
