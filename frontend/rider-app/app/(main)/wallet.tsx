import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { SkeletonList } from "@/components/ui/Skeleton";
import { compactDate, money } from "@/lib/api";
import { spacing } from "@/theme/tokens";

const RIDER_DEFICIT_WARNING_THRESHOLD = 100;
const RIDER_DEFICIT_OFFLINE_THRESHOLD = 200;

export default function WalletScreen() {
  const { session, wallets, transactions, payouts, loading, refresh, setMessage } = useApp();
  const { colors, typography } = useTheme();
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const wallet = wallets[0];
  const availableBalance = Number(wallet?.availableBalance ?? 0);
  const deficit = availableBalance < 0 ? Math.abs(availableBalance) : 0;
  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background, padding: spacing.xl },
        title: { ...typography.h1, marginBottom: spacing.xl, color: colors.text },
        hero: { backgroundColor: colors.accentLight, borderColor: colors.accent, marginBottom: spacing.lg },
        heroLabel: { ...typography.captionMedium, color: colors.textSecondary },
        heroAmount: { ...typography.hero, color: colors.text, marginTop: spacing.sm },
        deficitBanner: {
          backgroundColor: colors.danger,
          borderColor: colors.danger,
          marginBottom: spacing.lg,
        },
        deficitTitle: { ...typography.bodySemibold, color: colors.textOnPrimary },
        deficitBody: { ...typography.caption, color: colors.textOnPrimary, marginTop: spacing.xs, opacity: 0.9 },
        form: { gap: spacing.md, marginBottom: spacing.xxl },
        section: { ...typography.h3, marginBottom: spacing.lg, color: colors.text },
        tx: {
          flexDirection: "row",
          justifyContent: "space-between",
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        txTitle: { ...typography.bodyMedium, color: colors.text },
        txSub: { ...typography.caption, color: colors.textMuted },
        txAmount: { ...typography.bodySemibold, color: colors.primary },
      }),
    [colors, typography],
  );

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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
    >
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>Wallet</Text>

      {deficit >= RIDER_DEFICIT_WARNING_THRESHOLD ? (
        <Card elevated style={styles.deficitBanner}>
          <Text style={styles.deficitTitle}>
            You owe {money(deficit, wallet?.currency ?? "GHS")}
          </Text>
          <Text style={styles.deficitBody}>
            {deficit >= RIDER_DEFICIT_OFFLINE_THRESHOLD
              ? `You've been taken offline until this is cleared below ${money(RIDER_DEFICIT_OFFLINE_THRESHOLD, wallet?.currency ?? "GHS")}.`
              : `Clear your balance before it reaches ${money(RIDER_DEFICIT_OFFLINE_THRESHOLD, wallet?.currency ?? "GHS")} to keep earning online.`}
          </Text>
        </Card>
      ) : null}

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
    </KeyboardAvoidingView>
  );
}
