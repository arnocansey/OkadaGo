import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { api, compactDate, money } from "../api";
import { Card, EmptyState, Field, PrimaryButton, SectionTitle, StatCard, styles } from "../components/ui";
import type { PayoutRequest, Session, Wallet, WalletTransaction } from "../types";

export function WalletScreen({ session, wallets, payouts, transactions, onRefresh }: { session: Session; wallets: Wallet[]; payouts: PayoutRequest[]; transactions: WalletTransaction[]; onRefresh: () => void }) {
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [method, setMethod] = useState<"MOBILE_MONEY" | "BANK_ACCOUNT">("MOBILE_MONEY");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function requestPayout() {
    setBusy(true);
    setError("");
    try {
      await api("/wallets/rider/payout-requests", { method: "POST", token: session.token, body: { amount: Number(amount), method, destinationLabel: destination } });
      setAmount("");
      setDestination("");
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payout request failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <SectionTitle kicker="Wallet" title="Payouts and settlement" />
      <View style={styles.grid}>
        {wallets.length ? wallets.map((wallet) => <StatCard key={wallet.id} label={wallet.type.replaceAll("_", " ")} value={money(wallet.availableBalance, wallet.currency)} />) : <StatCard label="Settlement" value={money(0, session.user.preferredCurrency)} />}
      </View>
      <Card>
        <SectionTitle kicker="Payout" title="Request withdrawal" />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {(["MOBILE_MONEY", "BANK_ACCOUNT"] as const).map((item) => (
            <Pressable key={item} style={{ borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: method === item ? "#F5B800" : "#111111", borderWidth: 1, borderColor: method === item ? "#F5B800" : "#2C2C2C" }} onPress={() => setMethod(item)}>
              <Text style={{ color: method === item ? "#111111" : "#DDE0E7", fontWeight: "900", fontSize: 12 }}>{item.replace("_", " ")}</Text>
            </Pressable>
          ))}
        </View>
        <Field label="Amount" value={amount} onChangeText={setAmount} placeholder="50" keyboardType="numeric" />
        <Field label="Destination" value={destination} onChangeText={setDestination} placeholder="Wallet number or bank account label" />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <PrimaryButton label={busy ? "Submitting..." : "Request payout"} onPress={requestPayout} disabled={busy || !Number(amount) || !destination.trim()} />
      </Card>
      <Card>
        <SectionTitle kicker="Payout history" title="Admin-reviewed requests" />
        {payouts.length ? payouts.map((payout) => <Text key={payout.id} style={{ color: "#FFFFFF" }}>{payout.destinationLabel} - {payout.status} - {money(payout.amount, payout.currency)}</Text>) : <EmptyState title="No payout requests yet." body="Your payout history will appear after you request a withdrawal." />}
      </Card>
      <Card>
        <SectionTitle kicker="Transactions" title="Wallet activity" />
        {transactions.length ? transactions.slice(0, 6).map((tx) => <Text key={tx.id} style={{ color: "#FFFFFF" }}>{tx.description ?? tx.type} - {compactDate(tx.createdAt)}</Text>) : <EmptyState title="No wallet activity yet." body="Settlement and payout entries will appear here." />}
      </Card>
    </>
  );
}
