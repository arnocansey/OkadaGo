import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react-native";
import { Badge } from "@/components/ui/Badge";
import { BalanceHero } from "@/components/ui/BalanceHero";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { PaystackCheckout } from "@/components/PaystackCheckout";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";
import { api, compactDate, money } from "@/lib/api";
import { spacing } from "@/theme/tokens";
import type { WalletTransaction } from "@/types";

function txStatusBadge(tx: WalletTransaction) {
  const status = (tx.status ?? "").toUpperCase();
  if (status === "PENDING") return <Badge label="Pending" tone="warning" />;
  if (status === "FAILED") return <Badge label="Failed" tone="danger" />;
  if (status === "POSTED") return <Badge label="Completed" tone="success" />;
  return null;
}

export default function WalletScreen() {
  const { session, wallets, transactions, loading, refresh } = useApp();
  const { colors, typography } = useTheme();
  const { showToast } = useToast();
  const wallet = wallets[0];
  const [topUpAmount, setTopUpAmount] = useState("20");
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxxl },
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
        txPending: { backgroundColor: colors.warningLight },
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
        txDate: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
        txAmount: { ...typography.bodySemibold, color: colors.primary },
        debit: { color: colors.danger },
        badgeWrap: { marginTop: spacing.sm },
        retryHint: { ...typography.caption, color: colors.primary, marginTop: spacing.xs },
      }),
    [colors, typography],
  );

  async function initiateTopUp(amount: number) {
    if (!session?.token || !wallet) return;
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

  async function topUp() {
    const amount = Number(topUpAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert("Invalid amount", "Enter a valid top-up amount.");
      return;
    }
    await initiateTopUp(amount);
  }

  function retryPendingTx(tx: WalletTransaction) {
    const amount = Number(tx.amount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    Alert.alert(
      "Retry payment",
      `Re-initiate a top-up of ${money(amount, tx.currency)}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Continue", onPress: () => initiateTopUp(amount) },
      ],
    );
  }

  async function handleCheckoutSuccess(reference: string) {
    setCheckoutUrl(null);
    showToast(`Payment received (${reference}). Balance updated!`, "success");
    await refresh();
  }

  function handleCheckoutCancel() {
    setCheckoutUrl(null);
  }

  const isPending = (tx: WalletTransaction) => (tx.status ?? "").toUpperCase() === "PENDING";

  return (
    <SafeAreaView style={styles.screen}>
      <PaystackCheckout
        authorizationUrl={checkoutUrl ?? ""}
        visible={!!checkoutUrl}
        onSuccess={handleCheckoutSuccess}
        onCancel={handleCheckoutCancel}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        <ScreenHeader title="Wallet" />

        <BalanceHero
          label="Available balance"
          amount={money(wallet?.availableBalance, wallet?.currency ?? "GHS")}
          hint={wallet?.lockedBalance ? `Locked: ${money(wallet.lockedBalance, wallet.currency)}` : undefined}
        />

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
            {transactions.slice(0, 20).map((tx, i) => {
              const pending = isPending(tx);
              const content = (
                <View
                  key={tx.id}
                  style={[
                    styles.tx,
                    pending && styles.txPending,
                    i < Math.min(transactions.length, 20) - 1 && styles.txBorder,
                  ]}
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
                    <View style={styles.badgeWrap}>{txStatusBadge(tx)}</View>
                    {pending && tx.direction === "credit" ? (
                      <Text style={styles.retryHint}>Tap to complete payment</Text>
                    ) : null}
                  </View>
                  <Text style={[styles.txAmount, tx.direction === "debit" && styles.debit]}>
                    {tx.direction === "debit" ? "-" : "+"}{money(tx.amount, tx.currency)}
                  </Text>
                </View>
              );

              if (pending && tx.direction === "credit") {
                return (
                  <Pressable key={tx.id} onPress={() => retryPendingTx(tx)}>
                    {content}
                  </Pressable>
                );
              }
              return content;
            })}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
