import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Building2, CheckCircle2, ShieldCheck, Smartphone } from "lucide-react-native";
import { api, compactDate, money } from "../api";
import { Card, EmptyState, Field, ListRow, Pill, PrimaryButton, SectionTitle, StatCard, styles } from "../components/ui";
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
  const settlementWallet = wallets.find((wallet) => wallet.type === "RIDER_SETTLEMENT") ?? wallets[0];
  const availableBalance = money(settlementWallet?.availableBalance ?? 0, settlementWallet?.currency ?? session.user.preferredCurrency);

  return (
    <>
      <Text style={styles.pageTitle}>Wallet</Text>
      <Card style={styles.riderWalletHero}>
        <ShieldCheck size={88} color="rgba(17,17,17,0.12)" style={styles.riderWalletWatermark} />
        <Text style={styles.riderWalletLabel}>Available Balance</Text>
        <Text style={styles.riderWalletAmount}>{availableBalance}</Text>
        <PrimaryButton label="Request payout" onPress={requestPayout} disabled={busy || !Number(amount) || !destination.trim()} dark />
      </Card>

      <Card>
        <View style={styles.blockHeaderSplit}>
          <Text style={styles.blockTitle}>Payout Methods</Text>
          <Pressable onPress={() => setMethod(method === "MOBILE_MONEY" ? "BANK_ACCOUNT" : "MOBILE_MONEY")}>
            <Text style={styles.linkText}>+ Add New</Text>
          </Pressable>
        </View>
        <Pressable
          style={[styles.payoutMethodRow, method === "MOBILE_MONEY" && destination.includes("024") && styles.payoutMethodActive]}
          onPress={() => { setMethod("MOBILE_MONEY"); setDestination("024 123 4567"); }}
        >
          <View style={styles.payoutMethodIcon}><Smartphone size={20} color="#FACC15" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.payoutMethodTitle}>MTN Mobile Money</Text>
            <Text style={styles.payoutMethodMeta}>024 123 4567</Text>
          </View>
          {method === "MOBILE_MONEY" && destination.includes("024") ? <CheckCircle2 size={22} color="#FACC15" /> : null}
        </Pressable>
        <Pressable
          style={[styles.payoutMethodRow, method === "MOBILE_MONEY" && destination.includes("020") && styles.payoutMethodActive]}
          onPress={() => { setMethod("MOBILE_MONEY"); setDestination("020 123 4567"); }}
        >
          <View style={styles.payoutMethodIcon}><Smartphone size={20} color="#FACC15" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.payoutMethodTitle}>Vodafone Cash</Text>
            <Text style={styles.payoutMethodMeta}>020 123 4567</Text>
          </View>
          {method === "MOBILE_MONEY" && destination.includes("020") ? <CheckCircle2 size={22} color="#FACC15" /> : null}
        </Pressable>
        <Pressable
          style={[styles.payoutMethodRow, method === "BANK_ACCOUNT" && styles.payoutMethodActive]}
          onPress={() => { setMethod("BANK_ACCOUNT"); setDestination("•••• 4242"); }}
        >
          <View style={styles.payoutMethodIcon}><Building2 size={20} color="#60A5FA" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.payoutMethodTitle}>Bank Transfer</Text>
            <Text style={styles.payoutMethodMeta}>•••• 4242</Text>
          </View>
          {method === "BANK_ACCOUNT" ? <CheckCircle2 size={22} color="#FACC15" /> : null}
        </Pressable>
        <Pressable style={styles.payoutMethodDashed}>
          <Text style={styles.payoutMethodDashedText}>+ Add Payout Method</Text>
        </Pressable>
      </Card>

      <View style={styles.grid}>
        {wallets.length ? wallets.slice(0, 2).map((wallet) => <StatCard key={wallet.id} label={wallet.type.replaceAll("_", " ")} value={money(wallet.availableBalance, wallet.currency)} />) : <StatCard label="Settlement" value={money(0, session.user.preferredCurrency)} />}
      </View>

      <Card>
        <SectionTitle kicker="Payout" title="Request withdrawal" />
        <Pill label={method.replace("_", " ")} tone="warning" />
        <View style={styles.segmentedRow}>
          {(["MOBILE_MONEY", "BANK_ACCOUNT"] as const).map((item) => (
            <Pressable key={item} style={[styles.segmentedButton, method === item && styles.segmentedButtonActive]} onPress={() => setMethod(item)}>
              <Text style={[styles.segmentedText, method === item && styles.segmentedTextActive]}>{item.replace("_", " ")}</Text>
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
        {payouts.length ? payouts.map((payout) => (
          <ListRow
            key={payout.id}
            title={payout.destinationLabel}
            body={payout.status}
            meta={compactDate(payout.requestedAt)}
            amount={money(payout.amount, payout.currency)}
          />
        )) : <EmptyState title="No payout requests yet." body="Your payout history will appear after you request a withdrawal." />}
      </Card>
      <Card>
        <SectionTitle kicker="Transactions" title="Wallet activity" />
        {transactions.length ? transactions.slice(0, 6).map((tx) => (
          <ListRow
            key={tx.id}
            title={tx.description ?? tx.type}
            body={tx.status}
            meta={compactDate(tx.createdAt)}
            amount={money(tx.amount, tx.currency)}
          />
        )) : <EmptyState title="No wallet activity yet." body="Settlement and payout entries will appear here." />}
      </Card>
    </>
  );
}
