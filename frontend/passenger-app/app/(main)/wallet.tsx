import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react-native";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useApp } from "@/context/AppContext";
import { compactDate, money } from "@/lib/api";
import { colors, radius, spacing, typography } from "@/theme/tokens";

export default function WalletScreen() {
  const { wallets, transactions, loading } = useApp();
  const wallet = wallets[0];

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Wallet</Text>

        {/* Hero card — full green */}
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Available balance</Text>
          <Text style={styles.heroAmount}>{money(wallet?.availableBalance, wallet?.currency ?? "GHS")}</Text>
          {wallet?.lockedBalance ? (
            <Text style={styles.locked}>Locked: {money(wallet.lockedBalance, wallet.currency)}</Text>
          ) : null}
        </View>

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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxxl },
  title: { ...typography.h1 },

  // Full-color hero
  hero: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    gap: spacing.xs,
  },
  heroLabel: { ...typography.captionMedium, color: "rgba(0,0,0,0.65)" },
  heroAmount: { ...typography.hero, color: colors.textOnPrimary },
  locked: { ...typography.caption, color: "rgba(0,0,0,0.55)", marginTop: spacing.xs },

  section: { ...typography.h3 },

  // Transaction rows inside Card
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
});
