import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, compactDate, money } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { PaystackCheckout } from "@/components/PaystackCheckout";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { SkeletonList } from "@/components/ui/Skeleton";
import { spacing } from "@/theme/tokens";

const RIDER_DEFICIT_WARNING_THRESHOLD = 100;
const RIDER_DEFICIT_OFFLINE_THRESHOLD = 200;
const RIDER_MIN_ONLINE_BALANCE = 30;

export default function WalletScreen() {
  const { session, wallets, transactions, payouts, loading, refresh, setMessage } = useApp();
  const { colors, typography } = useTheme();
  const [topUpAmount, setTopUpAmount] = useState(String(RIDER_MIN_ONLINE_BALANCE));
  const [payoutAmount, setPayoutAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const wallet =
    wallets.find((w) => (w.type ?? "").toLowerCase() === "rider_settlement") ?? wallets[0];
  const availableBalance = Number(wallet?.availableBalance ?? 0);
  const deficit = availableBalance < 0 ? Math.abs(availableBalance) : 0;
  const needsFloat = availableBalance < RIDER_MIN_ONLINE_BALANCE;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
        title: { ...typography.h1, marginBottom: spacing.xl, color: colors.text },
        hero: { backgroundColor: colors.accentLight, borderColor: colors.accent, marginBottom: spacing.lg },
        heroLabel: { ...typography.captionMedium, color: colors.textSecondary },
        heroAmount: { ...typography.hero, color: colors.text, marginTop: spacing.sm },
        heroHint: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },
        deficitBanner: {
          backgroundColor: colors.danger,
          borderColor: colors.danger,
          marginBottom: spacing.lg,
        },
        floatBanner: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
          marginBottom: spacing.lg,
        },
        bannerTitle: { ...typography.bodySemibold, color: colors.textOnPrimary },
        bannerBody: { ...typography.caption, color: colors.textOnPrimary, marginTop: spacing.xs, opacity: 0.9 },
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

  async function topUp() {
    const amount = Number(topUpAmount);
    if (!session?.token || !wallet) return;
    if (!Number.isFinite(amount) || amount < RIDER_MIN_ONLINE_BALANCE) {
      Alert.alert(
        "Invalid amount",
        `Enter at least GH₵ ${RIDER_MIN_ONLINE_BALANCE} to meet the online float requirement.`,
      );
      return;
    }

    setTopUpLoading(true);
    try {
      const result = await api<{ authorizationUrl: string }>("/wallets/top-up/paystack/initialize", {
        method: "POST",
        token: session.token,
        body: {
          amount,
          currency: wallet.currency ?? session.user.preferredCurrency ?? "GHS",
          walletType: "rider_settlement",
          description: "OkadaGo rider wallet top-up",
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
    Alert.alert("Payment received", `Reference: ${reference}. Updating your balance…`);
    await refresh();
  }

  function handleCheckoutCancel() {
    setCheckoutUrl(null);
  }

  async function requestPayout() {
    setPayoutLoading(true);
    try {
      await api("/wallets/rider/payout-requests", {
        method: "POST",
        token: session!.token,
        body: { amount: Number(payoutAmount), method: "mobile_money", destinationLabel: destination },
      });
      setPayoutAmount("");
      setDestination("");
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Payout request failed.");
    } finally {
      setPayoutLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
    >
      <SafeAreaView style={styles.screen}>
        <PaystackCheckout
          authorizationUrl={checkoutUrl ?? ""}
          visible={!!checkoutUrl}
          onSuccess={(reference) => void handleCheckoutSuccess(reference)}
          onCancel={handleCheckoutCancel}
        />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Wallet</Text>

          {deficit >= RIDER_DEFICIT_WARNING_THRESHOLD ? (
            <Card elevated style={styles.deficitBanner}>
              <Text style={styles.bannerTitle}>You owe {money(deficit, wallet?.currency ?? "GHS")}</Text>
              <Text style={styles.bannerBody}>
                {deficit >= RIDER_DEFICIT_OFFLINE_THRESHOLD
                  ? `You've been taken offline until this is cleared below ${money(RIDER_DEFICIT_OFFLINE_THRESHOLD, wallet?.currency ?? "GHS")}.`
                  : `Clear your balance before it reaches ${money(RIDER_DEFICIT_OFFLINE_THRESHOLD, wallet?.currency ?? "GHS")} to keep earning online.`}
              </Text>
            </Card>
          ) : null}

          {needsFloat && deficit === 0 ? (
            <Card elevated style={styles.floatBanner}>
              <Text style={styles.bannerTitle}>Top up to go online</Text>
              <Text style={styles.bannerBody}>
                Keep at least GH₵ {RIDER_MIN_ONLINE_BALANCE} in your wallet to receive jobs.
              </Text>
            </Card>
          ) : null}

          <Card elevated style={styles.hero}>
            <Text style={styles.heroLabel}>Available balance</Text>
            <Text style={styles.heroAmount}>{money(wallet?.availableBalance, wallet?.currency ?? "GHS")}</Text>
            <Text style={styles.heroHint}>
              Online float requirement: GH₵ {RIDER_MIN_ONLINE_BALANCE}
            </Text>
          </Card>

          <Card style={styles.form}>
            <Text style={styles.section}>Top up via MoMo</Text>
            <Input
              label="Amount (GHS)"
              value={topUpAmount}
              onChangeText={setTopUpAmount}
              keyboardType="decimal-pad"
              placeholder={String(RIDER_MIN_ONLINE_BALANCE)}
            />
            <Button
              label="Top Up Now"
              loading={topUpLoading}
              onPress={() => void topUp()}
              fullWidth
            />
          </Card>

          <Card style={styles.form}>
            <Text style={styles.section}>Request payout</Text>
            <Input
              label="Amount (GHS)"
              value={payoutAmount}
              onChangeText={setPayoutAmount}
              keyboardType="decimal-pad"
            />
            <Input
              label="Mobile money number"
              value={destination}
              onChangeText={setDestination}
              keyboardType="phone-pad"
            />
            <Button
              label="Request payout"
              variant="accent"
              loading={payoutLoading}
              onPress={() => void requestPayout()}
              fullWidth
            />
          </Card>

          <Text style={styles.section}>Transactions</Text>
          {loading && transactions.length === 0 ? (
            <SkeletonList count={3} />
          ) : transactions.length === 0 ? (
            <EmptyState title="No transactions" message="Earnings, top-ups and payouts will show here." />
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
                    <Text style={styles.txSub}>
                      {p.status} · {compactDate(p.requestedAt)}
                    </Text>
                  </View>
                  <Text style={styles.txAmount}>{money(p.amount, p.currency)}</Text>
                </View>
              ))}
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
