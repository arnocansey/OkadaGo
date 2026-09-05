import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator
} from "react-native";
import {
  Zap,
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Banknote,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  Wallet as WalletIcon,
  X
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, compactDate, money } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";
import { PaystackCheckout } from "@/components/PaystackCheckout";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { NavigationHeader } from "@/components/ScreenHeader";
import { spacing } from "@/theme/tokens";
import type { PayoutAccount } from "@/types";

export interface RiderFinanceMetrics {
  availableEarnings: number;
  cashCollected: number;
  digitalEarnings: number;
  commissionGenerated: number;
  commissionPaid: number;
  outstandingCommission: number;
  totalEarnings: number;
  withdrawableBalance: number;
  totalPayouts: number;
  cashTripsCount: number;
}

export interface FinanceProfileResponse {
  rider: {
    id: string;
    fullName: string;
    displayCode: string;
    isCashRestricted: boolean;
    onlineStatus: boolean;
  };
  metrics: RiderFinanceMetrics;
  thresholds: {
    warning: number;
    restriction: number;
  };
  ledgerEntries: Array<{
    id: string;
    transactionId: string;
    amount: number;
    type: string;
    direction: string;
    description: string;
    createdAt: string;
  }>;
}

export default function WalletScreen() {
  const { session, wallets, refresh } = useApp();
  const { colors, typography, isDark } = useTheme();
  const { showToast } = useToast();

  const [financeData, setFinanceData] = useState<FinanceProfileResponse | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Pay Commission State
  const [showPayCommissionModal, setShowPayCommissionModal] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [settleMethod, setSettleMethod] = useState<"MOBILE_MONEY" | "WALLET_BALANCE" | "CARD">("MOBILE_MONEY");
  const [settleLoading, setSettleLoading] = useState(false);

  // Payout State
  const [payoutAmount, setPayoutAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [payoutAccounts, setPayoutAccounts] = useState<PayoutAccount[]>([]);
  const [payoutLoading, setPayoutLoading] = useState(false);

  // Top-Up State
  const [topUpAmount, setTopUpAmount] = useState("20");
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const riderProfileId = session?.user?.riderProfileId;

  const loadFinanceProfile = useCallback(async () => {
    if (!session?.token || !riderProfileId) return;
    try {
      setDataLoading(true);
      const res = await api<FinanceProfileResponse>(`/finance/rider/${riderProfileId}/profile`, {
        token: session.token,
      });
      setFinanceData(res);
      setPayAmount(Number(res.metrics.outstandingCommission).toFixed(2));
    } catch {
      // Non-blocking fallback
    } finally {
      setDataLoading(false);
    }
  }, [session?.token, riderProfileId]);

  useEffect(() => {
    void loadFinanceProfile();
  }, [loadFinanceProfile]);

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
        // Non-blocking
      }
    })();
  }, [session?.token]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refresh(), loadFinanceProfile()]);
    setRefreshing(false);
  }, [refresh, loadFinanceProfile]);

  const m = financeData?.metrics ?? {
    availableEarnings: Number(wallets[0]?.availableBalance ?? 0),
    cashCollected: 0,
    digitalEarnings: 0,
    commissionGenerated: 0,
    commissionPaid: 0,
    outstandingCommission: 0,
    totalEarnings: 0,
    withdrawableBalance: Math.max(0, Number(wallets[0]?.availableBalance ?? 0)),
    totalPayouts: 0,
    cashTripsCount: 0,
  };

  const thresholds = financeData?.thresholds ?? { warning: 50, restriction: 150 };
  const isRestricted = financeData?.rider?.isCashRestricted || m.outstandingCommission >= thresholds.restriction;
  const isWarning = !isRestricted && m.outstandingCommission >= thresholds.warning;

  // Handle Commission Settlement
  async function handleSettleCommission() {
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount to settle.");
      return;
    }
    if (amt > m.outstandingCommission) {
      Alert.alert("Invalid Amount", `Amount exceeds your outstanding commission of GH₵ ${m.outstandingCommission.toFixed(2)}`);
      return;
    }

    setSettleLoading(true);
    try {
      await api("/finance/settle-commission", {
        method: "POST",
        token: session!.token,
        body: {
          riderProfileId,
          amount: amt,
          paymentMethod: settleMethod,
        },
      });

      setShowPayCommissionModal(false);
      showToast(`Settlement of GH₵ ${amt.toFixed(2)} processed successfully!`, "success");
      await loadFinanceProfile();
      await refresh();
    } catch (e: any) {
      Alert.alert("Settlement Failed", e.message || "Could not process commission settlement.");
    } finally {
      setSettleLoading(false);
    }
  }

  // Handle Payout Request
  async function requestPayout() {
    const amt = parseFloat(payoutAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert("Invalid Amount", "Enter a withdrawal amount greater than zero.");
      return;
    }
    if (amt > m.withdrawableBalance) {
      Alert.alert(
        "Withdrawal Restricted",
        `Requested GH₵ ${amt.toFixed(2)} exceeds your withdrawable balance of GH₵ ${m.withdrawableBalance.toFixed(2)}. ${m.outstandingCommission > 0 ? `GH₵ ${m.outstandingCommission.toFixed(2)} is reserved for outstanding commission.` : ""}`
      );
      return;
    }
    if (!destination.trim()) {
      Alert.alert("Destination Needed", "Enter the mobile money phone number for disbursement.");
      return;
    }

    setPayoutLoading(true);
    try {
      await api("/wallets/rider/payout-requests", {
        method: "POST",
        token: session!.token,
        body: { amount: amt, method: "MOBILE_MONEY", destinationLabel: destination.trim() },
      });
      setPayoutAmount("");
      showToast("Payout requested. We'll disburse to your MoMo account shortly.", "success");
      await loadFinanceProfile();
      await refresh();
    } catch (e: any) {
      Alert.alert("Payout Failed", e.message || "Payout request failed.");
    } finally {
      setPayoutLoading(false);
    }
  }

  // Handle Wallet Top-Up
  async function topUp() {
    const amt = parseFloat(topUpAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert("Invalid Amount", "Enter a valid top-up amount.");
      return;
    }

    setTopUpLoading(true);
    try {
      const result = await api<{ authorizationUrl: string }>("/wallets/top-up/paystack/initialize", {
        method: "POST",
        token: session!.token,
        body: {
          amount: amt,
          currency: "GHS",
          walletType: "rider_settlement",
          description: "OkadaGo rider wallet top-up",
        },
      });
      setCheckoutUrl(result.authorizationUrl);
    } catch (e: any) {
      Alert.alert("Top-Up Failed", e.message || "Could not initialize MoMo checkout.");
    } finally {
      setTopUpLoading(false);
    }
  }

  const s = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        content: { padding: spacing.lg, paddingBottom: spacing.xxxl },

        /* Alert Banners */
        alertBanner: {
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          borderWidth: 1,
        },
        bannerRestricted: {
          backgroundColor: "rgba(239, 68, 68, 0.12)",
          borderColor: "rgba(239, 68, 68, 0.3)",
        },
        bannerWarning: {
          backgroundColor: "rgba(234, 179, 8, 0.12)",
          borderColor: "rgba(234, 179, 8, 0.3)",
        },
        bannerTitle: { fontSize: 14, fontWeight: "800", marginBottom: 2 },
        bannerBody: { fontSize: 12, lineHeight: 17 },

        /* Hero Debt Card */
        debtHero: {
          backgroundColor: isDark ? "#1E2638" : "#FFFFFF",
          borderRadius: 22,
          padding: 20,
          marginBottom: 18,
          borderWidth: 1,
          borderColor: m.outstandingCommission > 0 ? (isRestricted ? "#EF4444" : "#CA8A04") : (isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0"),
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.4 : 0.08,
          shadowRadius: 12,
          elevation: 4,
        },
        heroLabel: {
          fontSize: 12,
          fontWeight: "700",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          marginBottom: 6,
        },
        heroAmount: {
          fontSize: 34,
          fontWeight: "900",
          color: m.outstandingCommission > 0 ? (isRestricted ? "#EF4444" : "#CA8A04") : colors.text,
          marginBottom: 12,
        },
        heroRow: {
          flexDirection: "row",
          gap: 10,
          alignItems: "center",
        },
        payBtn: {
          flex: 1,
          backgroundColor: "#22C55E",
          paddingVertical: 13,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 6,
        },
        payBtnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 },

        /* 8 Required Financial Metrics Grid */
        metricsGrid: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 20,
        },
        metricCard: {
          width: "48.5%",
          backgroundColor: isDark ? "#182030" : "#F8FAFC",
          borderRadius: 16,
          padding: 14,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "#E2E8F0",
        },
        metricLabel: {
          fontSize: 10,
          fontWeight: "700",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 6,
        },
        metricValue: {
          fontSize: 18,
          fontWeight: "800",
          color: colors.text,
        },
        metricSub: {
          fontSize: 10,
          color: colors.textSecondary,
          marginTop: 4,
        },

        /* Action Cards */
        sectionCard: {
          backgroundColor: isDark ? "#1E2638" : "#FFFFFF",
          borderRadius: 18,
          padding: 16,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0",
        },
        sectionTitle: {
          fontSize: 16,
          fontWeight: "800",
          color: colors.text,
          marginBottom: 12,
        },
        input: {
          backgroundColor: isDark ? "#2A364F" : "#F1F5F9",
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 15,
          color: colors.text,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "#CBD5E1",
        },

        /* Quick chip selector */
        chipRow: {
          flexDirection: "row",
          gap: 8,
          marginBottom: 12,
        },
        chip: {
          flex: 1,
          paddingVertical: 8,
          borderRadius: 10,
          alignItems: "center",
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9",
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "#CBD5E1",
        },
        chipSelected: {
          backgroundColor: "#22C55E",
          borderColor: "#22C55E",
        },
        chipText: {
          fontSize: 12,
          fontWeight: "700",
          color: colors.text,
        },
        chipTextSelected: {
          color: "#FFFFFF",
        },

        /* Ledger Row */
        txRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9",
        },
        txLeft: { flex: 1, marginRight: 12 },
        txDesc: { fontSize: 13, fontWeight: "600", color: colors.text },
        txDate: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
        txAmount: { fontSize: 14, fontWeight: "800" },
      }),
    [colors, isDark, m.outstandingCommission, isRestricted]
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
    >
      <SafeAreaView style={s.screen}>
        <PaystackCheckout
          authorizationUrl={checkoutUrl ?? ""}
          visible={!!checkoutUrl}
          onSuccess={() => {
            setCheckoutUrl(null);
            showToast("Wallet top-up successful!", "success");
            void loadFinanceProfile();
            void refresh();
          }}
          onCancel={() => setCheckoutUrl(null)}
        />

        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          <NavigationHeader title="Rider Financial Center" />

          {/* Restriction Banner */}
          {isRestricted ? (
            <View style={[s.alertBanner, s.bannerRestricted]}>
              <ShieldAlert size={24} color="#EF4444" />
              <View style={{ flex: 1 }}>
                <Text style={[s.bannerTitle, { color: "#EF4444" }]}>Cash Trips Restricted</Text>
                <Text style={[s.bannerBody, { color: isDark ? "#FCA5A5" : "#B91C1C" }]}>
                  Cash trips are temporarily restricted. Your outstanding commission exceeds GH₵ {thresholds.restriction.toFixed(2)}. Settle your balance to accept cash jobs.
                </Text>
              </View>
            </View>
          ) : isWarning ? (
            <View style={[s.alertBanner, s.bannerWarning]}>
              <AlertTriangle size={24} color="#CA8A04" />
              <View style={{ flex: 1 }}>
                <Text style={[s.bannerTitle, { color: "#CA8A04" }]}>Commission Payment Reminder</Text>
                <Text style={[s.bannerBody, { color: isDark ? "#FDE047" : "#854D0E" }]}>
                  Your outstanding OkadaGo commission is GH₵ {m.outstandingCommission.toFixed(2)}. Please settle your balance before it reaches GH₵ {thresholds.restriction.toFixed(2)}.
                </Text>
              </View>
            </View>
          ) : null}

          {/* Hero Debt & Settlement Card */}
          <View style={s.debtHero}>
            <Text style={s.heroLabel}>Outstanding Commission Owed</Text>
            <Text style={s.heroAmount}>GH₵ {m.outstandingCommission.toFixed(2)}</Text>
            <View style={s.heroRow}>
              {m.outstandingCommission > 0 ? (
                <Pressable
                  style={s.payBtn}
                  onPress={() => {
                    setPayAmount(m.outstandingCommission.toFixed(2));
                    setShowPayCommissionModal(true);
                  }}
                >
                  <Banknote size={18} color="#FFFFFF" />
                  <Text style={s.payBtnText}>PAY COMMISSION</Text>
                </Pressable>
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <CheckCircle2 size={18} color="#22C55E" />
                  <Text style={{ color: "#22C55E", fontWeight: "700", fontSize: 13 }}>All Commission Settled (GH₵ 0.00)</Text>
                </View>
              )}
            </View>
          </View>

          {/* The 8 Financial Metrics Required by Specifications */}
          <Text style={[typography.h3, { color: colors.text, marginBottom: 12 }]}>Wallet & Financial Overview</Text>
          <View style={s.metricsGrid}>
            <View style={s.metricCard}>
              <Text style={s.metricLabel}>Withdrawable Balance</Text>
              <Text style={[s.metricValue, { color: "#22C55E" }]}>GH₵ {m.withdrawableBalance.toFixed(2)}</Text>
              <Text style={s.metricSub}>Available - Debt</Text>
            </View>

            <View style={s.metricCard}>
              <Text style={s.metricLabel}>Available Earnings</Text>
              <Text style={s.metricValue}>GH₵ {m.availableEarnings.toFixed(2)}</Text>
              <Text style={s.metricSub}>Gross in wallet</Text>
            </View>

            <View style={s.metricCard}>
              <Text style={s.metricLabel}>Cash Collected</Text>
              <Text style={[s.metricValue, { color: "#3B82F6" }]}>GH₵ {m.cashCollected.toFixed(2)}</Text>
              <Text style={s.metricSub}>{m.cashTripsCount} cash trips</Text>
            </View>

            <View style={s.metricCard}>
              <Text style={s.metricLabel}>Digital Earnings</Text>
              <Text style={s.metricValue}>GH₵ {m.digitalEarnings.toFixed(2)}</Text>
              <Text style={s.metricSub}>MoMo & Card rides</Text>
            </View>

            <View style={s.metricCard}>
              <Text style={s.metricLabel}>OkadaGo Commission</Text>
              <Text style={[s.metricValue, { color: "#EF4444" }]}>GH₵ {m.commissionGenerated.toFixed(2)}</Text>
              <Text style={s.metricSub}>Total accrued</Text>
            </View>

            <View style={s.metricCard}>
              <Text style={s.metricLabel}>Commission Paid</Text>
              <Text style={[s.metricValue, { color: "#22C55E" }]}>GH₵ {m.commissionPaid.toFixed(2)}</Text>
              <Text style={s.metricSub}>Settled to platform</Text>
            </View>

            <View style={s.metricCard}>
              <Text style={s.metricLabel}>Total Net Earnings</Text>
              <Text style={[s.metricValue, { color: "#CA8A04" }]}>GH₵ {m.totalEarnings.toFixed(2)}</Text>
              <Text style={s.metricSub}>Cash + Digital net</Text>
            </View>

            <View style={s.metricCard}>
              <Text style={s.metricLabel}>Total Payouts</Text>
              <Text style={s.metricValue}>GH₵ {m.totalPayouts.toFixed(2)}</Text>
              <Text style={s.metricSub}>Disbursed to MoMo</Text>
            </View>
          </View>

          {/* Instant Payout Form */}
          <View style={s.sectionCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={s.sectionTitle}>Request Instant Payout</Text>
              <View style={{ backgroundColor: "rgba(34, 197, 94, 0.15)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                <Text style={{ fontSize: 10, fontWeight: "800", color: "#16A34A" }}>⚡ 0-5 MINS</Text>
              </View>
            </View>

            {/* Quick Chips */}
            <View style={s.chipRow}>
              {[25, 50, 100].map((amt) => (
                <Pressable
                  key={amt}
                  onPress={() => setPayoutAmount(String(amt))}
                  style={[s.chip, payoutAmount === String(amt) && s.chipSelected]}
                >
                  <Text style={[s.chipText, payoutAmount === String(amt) && s.chipTextSelected]}>
                    GH₵ {amt}
                  </Text>
                </Pressable>
              ))}
              {m.withdrawableBalance > 0 && (
                <Pressable
                  onPress={() => setPayoutAmount(String(Math.floor(m.withdrawableBalance)))}
                  style={[s.chip, payoutAmount === String(Math.floor(m.withdrawableBalance)) && s.chipSelected]}
                >
                  <Text style={[s.chipText, payoutAmount === String(Math.floor(m.withdrawableBalance)) && s.chipTextSelected]}>
                    Max (GH₵ {Math.floor(m.withdrawableBalance)})
                  </Text>
                </Pressable>
              )}
            </View>

            <TextInput
              style={s.input}
              placeholder="Withdrawal Amount (GH₵)"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={payoutAmount}
              onChangeText={setPayoutAmount}
            />

            <TextInput
              style={s.input}
              placeholder="MoMo Phone Number (e.g. 024XXXXXXX)"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={destination}
              onChangeText={setDestination}
            />

            <Button
              label={payoutLoading ? "Processing Payout..." : `Withdraw to MoMo`}
              loading={payoutLoading}
              disabled={payoutLoading || m.withdrawableBalance <= 0}
              onPress={() => void requestPayout()}
              fullWidth
            />
          </View>

          {/* Top-up Form */}
          <View style={s.sectionCard}>
            <Text style={s.sectionTitle}>Top Up via Mobile Money</Text>
            <TextInput
              style={s.input}
              placeholder="Top-Up Amount (GH₵)"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={topUpAmount}
              onChangeText={setTopUpAmount}
            />
            <Button
              label={topUpLoading ? "Initializing..." : "Top Up Now"}
              loading={topUpLoading}
              onPress={() => void topUp()}
              fullWidth
            />
          </View>

          {/* Financial Ledger Section */}
          <View style={s.sectionCard}>
            <Text style={s.sectionTitle}>Recent Financial Ledger</Text>
            {(financeData?.ledgerEntries?.length ?? 0) === 0 ? (
              <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: "center", paddingVertical: 16 }}>
                No recent financial ledger entries found.
              </Text>
            ) : (
              financeData!.ledgerEntries.slice(0, 15).map((entry) => {
                const isCredit = entry.direction.toLowerCase() === "credit";
                return (
                  <View key={entry.id} style={s.txRow}>
                    <View style={s.txLeft}>
                      <Text style={s.txDesc} numberOfLines={1}>{entry.description}</Text>
                      <Text style={s.txDate}>{compactDate(entry.createdAt)} • {entry.type.replace(/_/g, " ")}</Text>
                    </View>
                    <Text
                      style={[
                        s.txAmount,
                        { color: isCredit ? "#22C55E" : "#EF4444" }
                      ]}
                    >
                      {isCredit ? "+" : "-"}GH₵ {Number(entry.amount).toFixed(2)}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* PAY COMMISSION MODAL (Section 9) */}
        <Modal
          visible={showPayCommissionModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPayCommissionModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" }}>
            <View
              style={{
                backgroundColor: isDark ? "#121826" : "#FFFFFF",
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                padding: 24,
                paddingBottom: Platform.OS === "ios" ? 40 : 24,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text }}>PAY COMMISSION</Text>
                <Pressable onPress={() => setShowPayCommissionModal(false)} hitSlop={12}>
                  <X size={20} color={colors.textSecondary} />
                </Pressable>
              </View>

              <View
                style={{
                  backgroundColor: isDark ? "#1E2638" : "#F8FAFC",
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0",
                }}
              >
                <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: "600", textTransform: "uppercase" }}>
                  Outstanding Commission Owed
                </Text>
                <Text style={{ fontSize: 26, fontWeight: "900", color: "#CA8A04", marginTop: 4 }}>
                  GH₵ {m.outstandingCommission.toFixed(2)}
                </Text>
              </View>

              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text, marginBottom: 6 }}>
                Amount to Pay (GH₵)
              </Text>
              <TextInput
                style={s.input}
                value={payAmount}
                onChangeText={setPayAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text, marginBottom: 8 }}>
                Select Payment Method
              </Text>
              <View style={{ gap: 8, marginBottom: 20 }}>
                {[
                  { key: "MOBILE_MONEY", label: "Mobile Money (MTN / Telecel / AT)", icon: Banknote },
                  { key: "WALLET_BALANCE", label: `Wallet Balance (GH₵ ${m.availableEarnings.toFixed(2)} available)`, icon: WalletIcon },
                  { key: "CARD", label: "Bank Card", icon: CreditCard },
                ].map((item) => (
                  <Pressable
                    key={item.key}
                    onPress={() => setSettleMethod(item.key as any)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      padding: 14,
                      borderRadius: 12,
                      backgroundColor: settleMethod === item.key ? (isDark ? "rgba(34, 197, 94, 0.15)" : "#F0FDF4") : (isDark ? "#1E2638" : "#F8FAFC"),
                      borderWidth: 1.5,
                      borderColor: settleMethod === item.key ? "#22C55E" : (isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0"),
                    }}
                  >
                    <item.icon size={20} color={settleMethod === item.key ? "#22C55E" : colors.textSecondary} />
                    <Text style={{ fontSize: 14, fontWeight: "700", color: settleMethod === item.key ? "#22C55E" : colors.text }}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                style={[s.payBtn, settleLoading && { opacity: 0.6 }]}
                disabled={settleLoading}
                onPress={() => void handleSettleCommission()}
              >
                {settleLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <ShieldCheck size={20} color="#FFFFFF" />
                    <Text style={s.payBtnText}>PAY COMMISSION NOW</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
