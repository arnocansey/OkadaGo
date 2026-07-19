import { useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react-native";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PaystackCheckout } from "@/components/PaystackCheckout";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { api, compactDate, money } from "@/lib/api";
import { spacing } from "@/theme/tokens";

export default function WalletScreen() {
  const { session, wallets, transactions, loading, refresh } = useApp();
  const { colors, typography } = useTheme();
  const wallet = wallets[0];
  const [topUpAmount, setTopUpAmount] = useState("20");
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxxl },
        title: { ...typography.h1, color: colors.text },
        hero: {
          backgroundColor: colors.primary,
          borderRadius: 16,
          padding: 24,
          gap: 4,
        },
        heroLabel: { ...typography.captionMedium, color: colors.textOnPrimary },
        heroAmount: { ...typography.hero, color: colors.textOnPrimary },
        locked: { ...typography.caption, color: colors.textOnPrimary, marginTop: 4, opacity: 0.7 },
        section: { ...typography.h3, color: colors.text },
        topUpRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-end" },
        topUpInput: { flex: 1 },
        tx: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
        },
        txBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
        txIcon: {
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
        },
        creditIcon: { backgroundColor: colors.primaryLight },
        debitIcon: { backgroundColor: colors.dangerLight },
        txTitle: { ...typography.bodyMedium, color: colors.text },
        txDate: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
        txAmount: { ...typography.bodySemibold, color: colors.primary },
        debit: { color: colors.danger },
      }),
    [colors, typography],
  );

  async function topUp() {
    if (!session?.token || !wallet) return;
    const amount = Number(topUpAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert("Invalid amount", "Enter a valid top-up amount.");
      return;
    }

    setTopUpLoading(true);
    try {
      const result = await api<{ authorizationUrl: string }>("/wallets/top-up/paystack/initialize", {
        method: "POST",
        token: session.token,
        body: {
          amount,
          currency: wallet.currency ?? session.user.preferredCurrency,
          walletType: "passenger_cashless",
          description: "OkadaGo wallet top-up",
        },
      });
      setCheckoutUrl(result.authorizationUrl);
    } catch (e) {
      Alert.alert("Top-up failed", e instanceof Error ? e.message : "Could not start Paystack checkout.");
    } finally {
      setTopUpLoading(false);
    }
  }

  async function handleCheckoutSuccess(reference: string) {
    setCheckoutUrl(null);
    Alert.alert("Payment received", `Reference: ${reference}. Verifying...`);
    await refresh();
  }

  function handleCheckoutCancel() {
    setCheckoutUrl(null);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <PaystackCheckout
        authorizationUrl={checkoutUrl ?? ""}
        visible={!!checkoutUrl}
        onSuccess={handleCheckoutSuccess}
        onCancel={handleCheckoutCancel}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Wallet</Text>

        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Available balance</Text>
          <Text style={styles.heroAmount}>{money(wallet?.availableBalance, wallet?.currency ?? "GHS")}</Text>
          {wallet?.lockedBalance ? (
            <Text style={styles.locked}>Locked: {money(wallet.lockedBalance, wallet.currency)}</Text>
          ) : null}
        </View>

        <Card>
          <Text style={styles.section}>Top up via Paystack</Text>
          <View style={styles.topUpRow}>
            <View style={styles.topUpInput}>
              <Input
                label="Amount"
                value={topUpAmount}
                onChangeText={setTopUpAmount}
                keyboardType="decimal-pad"
                placeholder="20"
              />
            </View>
            <Button label="Add" loading={topUpLoading} onPress={topUp} size="md" />
          </View>
        </Card>

        <Text style={styles.section}>Recent transactions</Text>
        {loading && transactions.length === 0 ? (
          <SkeletonList count={3} />
        ) : transactions.length === 0 ? (
          <EmptyState title="No transactions" message="Your wallet activity will appear here." />
        ) : (
          <Card>
            {transactions.slice(0, 20).map((tx, i) => (
              <View
                key={tx.id}
                style={[styles.tx, i < Math.min(transactions.length, 20) - 1 && styles.txBorder]}
              >
                <View style={[styles.txIcon, tx.direction === "debit" ? styles.debitIcon : styles.creditIcon]}>
                  {tx.direction === "debit"
                    ? <ArrowUpRight size={16} color={colors.danger} />
                    : <ArrowDownLeft size={16} color={colors.primary} />
                  }
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txTitle}>{tx.description ?? tx.type}</Text>
                  <Text style={styles.txDate}>{compactDate(tx.createdAt)}</Text>
                </View>
                <Text style={[styles.txAmount, tx.direction === "debit" && styles.debit]}>
                  {tx.direction === "debit" ? "-" : "+"}{money(tx.amount, tx.currency)}
                </Text>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
