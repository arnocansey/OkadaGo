import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Gift,
  Smartphone,
  Plus,
  Wallet,
} from "lucide-react-native";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SkeletonList } from "@/components/ui/Skeleton";
import { PaystackCheckout } from "@/components/PaystackCheckout";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";
import { api, compactDate, money } from "@/lib/api";
import type { WalletTransaction } from "@/types";

function txStatusBadge(tx: WalletTransaction) {
  const status = (tx.status ?? "").toUpperCase();
  if (status === "PENDING") return <Badge label="Pending" tone="warning" />;
  if (status === "FAILED") return <Badge label="Failed" tone="danger" />;
  if (status === "POSTED") return <Badge label="Done" tone="success" />;
  return null;
}

function txIconBg(tx: WalletTransaction, colors: any) {
  const desc = (tx.description ?? tx.type ?? "").toLowerCase();
  if (desc.includes("promo") || desc.includes("bonus") || desc.includes("credit"))
    return { bg: colors.primaryLight, icon: <Gift size={16} color={colors.primary} /> };
  if (desc.includes("momo") || desc.includes("mobile"))
    return { bg: "#E0F2FE", icon: <Smartphone size={16} color="#0284C7" /> };
  return tx.direction === "debit"
    ? { bg: colors.dangerLight, icon: <ArrowUpRight size={16} color={colors.danger} /> }
    : { bg: colors.primaryLight, icon: <ArrowDownLeft size={16} color={colors.primary} /> };
}

export default function WalletScreen() {
  const { session, wallets, transactions, loading, refresh } = useApp();
  const { colors, typography, isDark } = useTheme();
  const { showToast } = useToast();
  const wallet = wallets[0];
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  async function initiateTopUp(amount: number) {
    if (!session?.token || !wallet) return;
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
      Alert.alert("Top-up failed", e instanceof Error ? e.message : "Could not start checkout.");
    }
  }

  async function handleCheckoutSuccess(reference: string) {
    setCheckoutUrl(null);
    showToast(`Payment received (${reference}). Balance updated!`, "success");
    await refresh();
  }

  const s = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        scroll: { flex: 1 },
        content: { paddingBottom: 40 },

        /* ─── Balance Hero ──────────────────────────────── */
        balanceCard: {
          marginHorizontal: 20,
          marginTop: 4,
          marginBottom: 20,
          backgroundColor: isDark ? colors.surface : "#FFFFFF",
          borderRadius: 20,
          padding: 24,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.3 : 0.06,
          shadowRadius: 12,
          elevation: 4,
        },
        balanceLabel: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
        balanceAmount: {
          fontSize: 36,
          fontWeight: "800",
          color: colors.text,
          marginTop: 4,
        },
        balanceHint: {
          fontSize: 13,
          color: colors.textSecondary,
          marginTop: 4,
        },

        /* ─── Quick Actions ─────────────────────────────── */
        actionsRow: {
          flexDirection: "row",
          paddingHorizontal: 20,
          gap: 10,
          marginBottom: 24,
        },
        actionBtn: {
          flex: 1,
          backgroundColor: isDark ? colors.surface : "#FFFFFF",
          borderRadius: 14,
          padding: 14,
          alignItems: "center",
          gap: 8,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
        },
        actionIcon: {
          width: 40,
          height: 40,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
        },
        actionLabel: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.text,
          textAlign: "center",
        },

        /* ─── Section ───────────────────────────────────── */
        sectionHeader: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 20,
          marginBottom: 10,
        },
        sectionTitle: {
          fontSize: 15,
          fontWeight: "700",
          color: colors.text,
        },
        sectionLink: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.primary,
        },

        /* ─── Transaction Row ───────────────────────────── */
        txCard: {
          marginHorizontal: 20,
          backgroundColor: isDark ? colors.surface : "#FFFFFF",
          borderRadius: 14,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          overflow: "hidden",
        },
        txRow: {
          flexDirection: "row",
          alignItems: "center",
          padding: 14,
          gap: 12,
        },
        txBorder: {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
        },
        txIconWrap: {
          width: 36,
          height: 36,
          borderRadius: 10,
          alignItems: "center",
          justifyContent: "center",
        },
        txContent: {
          flex: 1,
        },
        txDesc: {
          fontSize: 14,
          fontWeight: "500",
          color: colors.text,
        },
        txDate: {
          fontSize: 12,
          color: colors.textMuted,
          marginTop: 2,
        },
        txRight: {
          alignItems: "flex-end",
          gap: 4,
        },
        txAmount: {
          fontSize: 15,
          fontWeight: "700",
          color: colors.text,
        },
        txDebit: {
          color: colors.danger,
        },
      }),
    [colors, isDark],
  );

  const recentTx = transactions.slice(0, 15);

  return (
    <SafeAreaView style={s.screen}>
      <PaystackCheckout
        authorizationUrl={checkoutUrl ?? ""}
        visible={!!checkoutUrl}
        onSuccess={handleCheckoutSuccess}
        onCancel={() => setCheckoutUrl(null)}
      />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <ScreenHeader title="Wallet" onBack={() => router.replace("/(main)")} />

        {/* ─── Balance Card ──────────────────────────────── */}
        <View style={s.balanceCard}>
          <Text style={s.balanceLabel}>Available balance</Text>
          <Text style={s.balanceAmount}>
            {money(wallet?.availableBalance, wallet?.currency ?? "GHS")}
          </Text>
          {wallet?.lockedBalance ? (
            <Text style={s.balanceHint}>
              Locked: {money(wallet.lockedBalance, wallet.currency)}
            </Text>
          ) : null}
        </View>

        {/* ─── Quick Actions ─────────────────────────────── */}
        <View style={s.actionsRow}>
          <Pressable style={s.actionBtn} onPress={() => initiateTopUp(20)} accessibilityRole="button" accessibilityLabel="Add money to wallet">
            <View style={[s.actionIcon, { backgroundColor: colors.primaryLight }]}>
              <Plus size={20} color={colors.primary} />
            </View>
            <Text style={s.actionLabel}>Add Money</Text>
          </Pressable>
          <Pressable
            style={s.actionBtn}
            onPress={() => router.push("/ride/book")}
            accessibilityRole="button"
            accessibilityLabel="Pay for ride"
          >
            <View style={[s.actionIcon, { backgroundColor: colors.infoLight }]}>
              <Wallet size={20} color={colors.info} />
            </View>
            <Text style={s.actionLabel}>Pay for Ride</Text>
          </Pressable>
          <Pressable style={s.actionBtn} onPress={() => initiateTopUp(0)} accessibilityRole="button" accessibilityLabel="Top up wallet">
            <View style={[s.actionIcon, { backgroundColor: colors.warningLight }]}>
              <CreditCard size={20} color={colors.warning} />
            </View>
            <Text style={s.actionLabel}>Top Up</Text>
          </Pressable>
        </View>

        {/* ─── Transactions ──────────────────────────────── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Transactions</Text>
          {transactions.length > 15 ? (
            <Text style={s.sectionLink}>View all</Text>
          ) : null}
        </View>

        {loading && recentTx.length === 0 ? (
          <SkeletonList count={3} />
        ) : recentTx.length === 0 ? (
          <EmptyState
            title="No transactions"
            message="Your wallet activity will appear here."
          />
        ) : (
          <View style={s.txCard}>
            {recentTx.map((tx, i) => {
              const { bg, icon } = txIconBg(tx, colors);
              return (
                <View
                  key={tx.id}
                  style={[s.txRow, i > 0 && s.txBorder]}
                >
                  <View style={[s.txIconWrap, { backgroundColor: bg }]}>{icon}</View>
                  <View style={s.txContent}>
                    <Text style={s.txDesc} numberOfLines={1}>
                      {tx.description ?? tx.type}
                    </Text>
                    <Text style={s.txDate}>{compactDate(tx.createdAt)}</Text>
                  </View>
                  <View style={s.txRight}>
                    <Text
                      style={[s.txAmount, tx.direction === "debit" && s.txDebit]}
                    >
                      {tx.direction === "debit" ? "-" : "+"}
                      {money(tx.amount, tx.currency)}
                    </Text>
                    {txStatusBadge(tx)}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
