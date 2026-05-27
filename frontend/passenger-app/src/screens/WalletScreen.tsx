import { Alert, Linking, Pressable, Text, View } from "react-native";
import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Bike, MoreHorizontal, Plus, Shield, WalletCards } from "lucide-react-native";
import { api, compactDate, money } from "../api";
import { Card, EmptyState, Field, Pill, PrimaryButton, SectionTitle, StatCard, styles } from "../components/ui";
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

  const cashlessWallet = wallets.find((wallet) => wallet.type === "PASSENGER_CASHLESS") ?? wallets[0];
  const balance = money(cashlessWallet?.availableBalance ?? 0, cashlessWallet?.currency ?? session.user.preferredCurrency);
  const unavailable = (label: string) => Alert.alert(label, "This wallet action is not connected to the backend yet.");

  return (
    <>
      <View style={styles.centerHeader}>
        <Shield size={20} color="#FF6B00" />
        <Text style={styles.centerHeaderTitle}>OkadaGo Wallet</Text>
      </View>

      <Card style={styles.walletBalanceHero}>
        <View style={styles.walletGlowTop} />
        <View style={styles.walletGlowBottom} />
        <Text style={styles.walletHeroLabel}>Available Balance</Text>
        <Text style={styles.walletHeroAmount}>{balance}</Text>
        <View style={styles.walletActionRow}>
          {[
            { label: "Top Up", icon: Plus, active: true, action: () => Alert.alert("Top Up", "Enter an amount below, then tap Top up wallet.") },
            { label: "Send", icon: ArrowUpRight, action: () => unavailable("Send money") },
            { label: "Request", icon: ArrowDownLeft, action: () => unavailable("Request money") },
            { label: "More", icon: MoreHorizontal, action: () => unavailable("More wallet actions") },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Pressable key={action.label} style={styles.walletAction} onPress={action.action}>
                <View style={[styles.walletActionIcon, action.active && styles.walletActionIconActive]}>
                  <Icon size={21} color={action.active ? "#111111" : "#FFFFFF"} />
                </View>
                <Text style={styles.walletActionLabel}>{action.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <SectionTitle kicker="Top up" title="Add money with Paystack" />
        <Pill label="Paystack enabled" tone="success" />
        <Field label="Amount" value={amount} onChangeText={setAmount} placeholder="50" keyboardType="numeric" />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <PrimaryButton label={busy ? "Opening Paystack..." : "Top up wallet"} onPress={topUp} disabled={busy || !Number(amount)} />
      </Card>

      <View style={styles.grid}>
        {wallets.length ? wallets.slice(0, 2).map((wallet) => <StatCard key={wallet.id} label={wallet.type.replaceAll("_", " ")} value={money(wallet.availableBalance, wallet.currency)} />) : <StatCard label="Wallet" value={money(0, session.user.preferredCurrency)} />}
      </View>

      <Card>
        <View style={styles.blockHeaderSplit}>
          <Text style={styles.blockTitle}>Recent Transactions</Text>
          <Text style={styles.linkText}>See All</Text>
        </View>
        {transactions.length ? (
          transactions.map((tx) => (
            <View key={tx.id} style={styles.walletTxRow}>
              <View style={styles.walletTxIcon}>
                {tx.direction === "debit" ? <Bike size={18} color="#FFFFFF" /> : <WalletCards size={18} color="#22C55E" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.walletTxTitle}>{tx.description ?? tx.type}</Text>
                <Text style={styles.walletTxDate}>{compactDate(tx.createdAt)}</Text>
              </View>
              <Text style={[styles.walletTxAmount, tx.direction !== "debit" && styles.walletTxAmountCredit]}>
                {tx.direction === "debit" ? "-" : "+"}{money(tx.amount, tx.currency)}
              </Text>
            </View>
          ))
        ) : (
          <EmptyState title="No wallet activity yet." body="Top-ups and ride payments will be listed here." />
        )}
      </Card>
    </>
  );
}
