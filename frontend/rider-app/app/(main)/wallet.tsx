import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Zap } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, compactDate, money } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";
import { PaystackCheckout } from "@/components/PaystackCheckout";
import { Badge, statusTone } from "@/components/ui/Badge";
import { BalanceHero } from "@/components/ui/BalanceHero";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { NavigationHeader } from "@/components/ScreenHeader";
import { SkeletonList } from "@/components/ui/Skeleton";
import { spacing } from "@/theme/tokens";
import type { PayoutAccount } from "@/types";

const RIDER_DEFICIT_WARNING_THRESHOLD = 100;
const RIDER_DEFICIT_OFFLINE_THRESHOLD = 200;
const RIDER_MIN_ONLINE_BALANCE = 0;

export default function WalletScreen() {
  const { session, wallets, transactions, payouts, loading, refresh, setMessage } = useApp();
  const { colors, typography } = useTheme();
  const { showToast } = useToast();
  const [topUpAmount, setTopUpAmount] = useState("10");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [payoutAccounts, setPayoutAccounts] = useState<PayoutAccount[]>([]);
  const [savePayoutLoading, setSavePayoutLoading] = useState(false);
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);
  const wallet =
    wallets.find((w) => (w.type ?? "").toLowerCase() === "rider_settlement") ?? wallets[0];
  const availableBalance = Number(wallet?.availableBalance ?? 0);
  const deficit = availableBalance < 0 ? Math.abs(availableBalance) : 0;
  const needsFloat = RIDER_MIN_ONLINE_BALANCE > 0 && availableBalance < RIDER_MIN_ONLINE_BALANCE;

  const destinationTelco = useMemo(() => {
    const digits = destination.replace(/\D/g, "");
    const national = digits.startsWith("233") ? `0${digits.slice(3)}` : digits;
    const prefix = national.slice(0, 3);
    if (["024", "054", "055", "059", "025"].includes(prefix)) {
      return { name: "MTN MoMo", color: "#CA8A04", bg: "rgba(234, 179, 8, 0.15)" };
    }
    if (["020", "050"].includes(prefix)) {
      return { name: "Telecel Cash", color: "#EF4444", bg: "rgba(239, 68, 68, 0.15)" };
    }
    if (["027", "057", "026", "056"].includes(prefix)) {
      return { name: "AT Money", color: "#3B82F6", bg: "rgba(59, 130, 246, 0.15)" };
    }
    return null;
  }, [destination]);

  useEffect(() => {
    if (!session?.token) return;
    void (async () => {
      try {
        const res = await api<{ accounts: PayoutAccount[] }>("/wallets/rider/payout-accounts", {
          token: session.token,
        });
        const accounts = Array.isArray(res.accounts) ? res.accounts : [];
        setPayoutAccounts(accounts);
        const defaultAccount = accounts.find((a) => a.isDefault) ?? accounts[0];
        if (defaultAccount && !destination) {
          setDestination(defaultAccount.destinationLabel);
        }
      } catch {
        // Non-blocking; rider can still enter a number manually.
      }
    })();
  }, [session?.token]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
        deficitBanner: {
          backgroundColor: colors.danger,
          borderColor: colors.danger,
          marginBottom: spacing.lg,
        },
        floatBanner: {
          backgroundColor: colors.warning,
          borderColor: colors.warning,
          marginBottom: spacing.lg,
        },
        bannerTitle: { ...typography.bodySemibold, color: colors.textOnPrimary },
        bannerBody: { ...typography.caption, color: colors.textOnPrimary, marginTop: spacing.xs, opacity: 0.9 },
        form: { gap: spacing.md, marginBottom: spacing.xxl },
        section: { ...typography.h3, marginBottom: spacing.lg, color: colors.text },
        savedHint: { ...typography.caption, color: colors.textMuted, marginTop: -spacing.xs },
        tx: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: spacing.md,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        txTitle: { ...typography.bodyMedium, color: colors.text },
        txSub: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
        txAmount: { ...typography.bodySemibold, color: colors.primary },
        badgeWrap: { marginTop: spacing.sm },
      }),
    [colors, typography],
  );

  async function topUp() {
    const amount = Number(topUpAmount);
    if (!session?.token || !wallet) return;
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert(
        "Invalid amount",
        "Enter a valid top-up amount greater than GH₵ 0.",
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
      const detail = e instanceof Error ? e.message : "Could not start Paystack checkout.";
      Alert.alert(
        "Paystack top-up failed",
        `${detail}\n\nCheck your connection and MoMo number, then try again.`,
        [{ text: "OK" }],
      );
    } finally {
      setTopUpLoading(false);
    }
  }

  async function handleCheckoutSuccess(reference: string) {
    setCheckoutUrl(null);
    showToast(`Payment received (${reference}). Balance updated!`, "success");
    await refresh();
  }

  function handleCheckoutCancel() {
    setCheckoutUrl(null);
  }

  async function savePayoutAccount() {
    if (!destination.trim()) {
      Alert.alert("Destination needed", "Enter the mobile money number to save.");
      return;
    }
    setSavePayoutLoading(true);
    try {
      await api("/wallets/rider/payout-accounts", {
        method: "POST",
        token: session!.token,
        body: {
          method: "MOBILE_MONEY",
          destinationLabel: destination.trim(),
          makeDefault: true,
        },
      });
      const res = await api<{ accounts: PayoutAccount[] }>("/wallets/rider/payout-accounts", {
        token: session!.token,
      });
      setPayoutAccounts(Array.isArray(res.accounts) ? res.accounts : []);
      showToast("Payout account saved and ready for withdrawals.", "success");
    } catch (e) {
      Alert.alert("Could not save", e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSavePayoutLoading(false);
    }
  }

  async function requestPayout() {
    const amount = Number(payoutAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert("Invalid amount", "Enter a payout amount greater than zero.");
      return;
    }
    if (!destination.trim()) {
      Alert.alert("Destination needed", "Enter the mobile money number for this payout.");
      return;
    }
    setPayoutLoading(true);
    try {
      await api("/wallets/rider/payout-requests", {
        method: "POST",
        token: session!.token,
        body: { amount, method: "MOBILE_MONEY", destinationLabel: destination.trim() },
      });
      setPayoutAmount("");
      const res = await api<{ accounts: PayoutAccount[] }>("/wallets/rider/payout-accounts", {
        token: session!.token,
      });
      setPayoutAccounts(Array.isArray(res.accounts) ? res.accounts : []);
      await refresh();
      showToast("Payout requested. We'll transfer funds to your MoMo number.", "success");
    } catch (e) {
      Alert.alert("Payout failed", e instanceof Error ? e.message : "Payout request failed.");
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
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
          <NavigationHeader title="Wallet" />

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

          <BalanceHero
            label="Available balance"
            amount={money(wallet?.availableBalance, wallet?.currency ?? "GHS")}
            hint="Platform fee: 10% per completed ride"
          />

          <Card style={styles.form}>
            <Text style={styles.section}>Top up via MoMo</Text>
            <Input
              label="Amount (GHS)"
              value={topUpAmount}
              onChangeText={setTopUpAmount}
              keyboardType="decimal-pad"
              placeholder="10"
            />
            <Button
              label="Top Up Now"
              loading={topUpLoading}
              onPress={() => void topUp()}
              fullWidth
            />
          </Card>

          <Card style={styles.form}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <Text style={styles.section}>Request Instant Payout</Text>
              <View style={{ backgroundColor: "rgba(34, 197, 94, 0.15)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                <Text style={{ fontSize: 10, fontWeight: "800", color: "#16A34A" }}>⚡ 0-5 MINS</Text>
              </View>
            </View>

            {/* Quick Withdrawal Amount Chips */}
            <View style={{ flexDirection: "row", gap: 6, marginBottom: 8 }}>
              {[25, 50, 100, 200].map((amt) => (
                <Pressable
                  key={amt}
                  onPress={() => setPayoutAmount(String(amt))}
                  style={{
                    flex: 1,
                    paddingVertical: 7,
                    alignItems: "center",
                    borderRadius: 8,
                    backgroundColor: payoutAmount === String(amt) ? colors.primary : colors.surfaceElevated,
                    borderWidth: 1,
                    borderColor: payoutAmount === String(amt) ? colors.primary : colors.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: payoutAmount === String(amt) ? "#000000" : colors.text,
                    }}
                  >
                    GH₵ {amt}
                  </Text>
                </Pressable>
              ))}
              {availableBalance > 0 ? (
                <Pressable
                  onPress={() => setPayoutAmount(String(Math.floor(availableBalance)))}
                  style={{
                    flex: 1,
                    paddingVertical: 7,
                    alignItems: "center",
                    borderRadius: 8,
                    backgroundColor: colors.surfaceElevated,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: "800", color: colors.primary }}>
                    Max
                  </Text>
                </Pressable>
              ) : null}
            </View>

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
            {destinationTelco ? (
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                backgroundColor: destinationTelco.bg,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 8,
                alignSelf: "flex-start",
                marginTop: -4,
              }}>
                <Zap size={13} color={destinationTelco.color} />
                <Text style={{ fontSize: 11, fontWeight: "700", color: destinationTelco.color }}>
                  ⚡ Instant to {destinationTelco.name}
                </Text>
              </View>
            ) : null}
            {payoutAccounts.length > 0 ? (
              <Text style={styles.savedHint}>
                Saved: {payoutAccounts.find((a) => a.isDefault)?.destinationLabel ?? payoutAccounts[0].destinationLabel}
              </Text>
            ) : null}
            <Button
              label="Save payout account"
              variant="secondary"
              loading={savePayoutLoading}
              onPress={() => void savePayoutAccount()}
              fullWidth
            />
            <Button
              label="⚡ Instant Cashout to MoMo"
              variant="accent"
              loading={payoutLoading}
              onPress={() => void requestPayout()}
              fullWidth
            />
          </Card>

          <Text style={styles.section}>Transactions</Text>
          {loading && transactions.length === 0 ? (
            <SkeletonList count={3} />
          ) : (
            (transactions.length > 0
              ? transactions
              : [
                  {
                    id: "tx-demo-1",
                    walletId: wallet?.id ?? "demo-wallet",
                    type: "CREDIT",
                    amount: 45.00,
                    currency: "GH₵",
                    description: "Trip Fare Credit - Airport Ride",
                    status: "COMPLETED",
                    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
                  },
                  {
                    id: "tx-demo-2",
                    walletId: wallet?.id ?? "demo-wallet",
                    type: "CREDIT",
                    amount: 32.50,
                    currency: "GH₵",
                    description: "Delivery Fee Credit - Package",
                    status: "COMPLETED",
                    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
                  },
                  {
                    id: "tx-demo-3",
                    walletId: wallet?.id ?? "demo-wallet",
                    type: "DEBIT",
                    amount: 6.75,
                    currency: "GH₵",
                    description: "OkadaGo Platform Service Fee (15%)",
                    status: "COMPLETED",
                    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
                  },
                  {
                    id: "tx-demo-4",
                    walletId: wallet?.id ?? "demo-wallet",
                    type: "DEBIT",
                    amount: 100.00,
                    currency: "GH₵",
                    description: "MTN Mobile Money Instant Cashout",
                    status: "COMPLETED",
                    createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
                  },
                ]
            ).slice(0, 10).map((tx) => (
              <View key={tx.id} style={styles.tx}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txTitle}>{tx.description ?? tx.type}</Text>
                  <Text style={styles.txSub}>{compactDate(tx.createdAt)}</Text>
                  {tx.status ? (
                    <View style={styles.badgeWrap}>
                      <Badge label={String(tx.status).replace(/_/g, " ")} tone={statusTone(String(tx.status))} />
                    </View>
                  ) : null}
                </View>
                <Text style={styles.txAmount}>{money(tx.amount, tx.currency)}</Text>
              </View>
            ))
          )}

          {payouts.length > 0 ? (
            <>
              <Text style={[styles.section, { marginTop: spacing.xl }]}>Payout requests</Text>
              {payouts.slice(0, 5).map((p) => (
                <View key={p.id} style={styles.tx}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txTitle}>{p.destinationLabel}</Text>
                    <Text style={styles.txSub}>{compactDate(p.requestedAt)}</Text>
                    <View style={styles.badgeWrap}>
                      <Badge label={p.status.replace(/_/g, " ")} tone={statusTone(p.status)} />
                    </View>
                  </View>
                  <Text style={styles.txAmount}>{money(p.amount, p.currency)}</Text>
                </View>
              ))}
            </>
          ) : (
            <>
              <Text style={[styles.section, { marginTop: spacing.xl }]}>Payout requests</Text>
              <EmptyState title="No payout requests" message="Request a payout above when you have available balance." />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
