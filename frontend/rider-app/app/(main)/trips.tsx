import { router } from "expo-router";
import { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronRight } from "lucide-react-native";
import { Badge, statusTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { compactDate, money } from "@/lib/api";
import { spacing } from "@/theme/tokens";

export default function TripsScreen() {
  const { rides, deliveries, loading } = useApp();
  const { colors, typography } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background, padding: spacing.xl },
        title: { ...typography.h1, marginBottom: spacing.xl, color: colors.text },
        list: { gap: spacing.md },
        row: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.border,
        },
        rowBody: { flex: 1, gap: spacing.sm },
        rowTitle: { ...typography.bodySemibold, color: colors.text },
        right: { alignItems: "flex-end", gap: 2 },
        fare: { ...typography.captionMedium, color: colors.text },
        date: { ...typography.caption, color: colors.textMuted },
      }),
    [colors, typography],
  );

  const items = [
    ...rides.map((r) => ({ kind: "ride" as const, id: r.id, title: r.destinationAddress, status: r.status, amount: r.riderEarnings ?? r.finalFare, currency: r.currency, date: r.createdAt })),
    ...deliveries.map((d) => ({ kind: "delivery" as const, id: d.id, title: d.dropoffAddress, status: d.status, amount: d.riderEarnings ?? d.finalFee, currency: d.currency, date: d.createdAt })),
  ].sort((a, b) => Date.parse(b.date ?? "0") - Date.parse(a.date ?? "0"));

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>Trip history</Text>
      {loading && items.length === 0 ? (
        <SkeletonList count={4} />
      ) : items.length === 0 ? (
        <EmptyState title="No trips yet" message="Go online to start accepting rides and deliveries." />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => `${item.kind}-${item.id}`}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => router.push({ pathname: "/trip/[id]", params: { id: item.id, kind: item.kind } })}
            >
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
                <Badge label={item.status.replace(/_/g, " ")} tone={statusTone(item.status)} />
              </View>
              <View style={styles.right}>
                <Text style={styles.fare}>{money(item.amount, item.currency ?? "GHS")}</Text>
                <Text style={styles.date}>{compactDate(item.date)}</Text>
                <ChevronRight size={18} color={colors.textMuted} />
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
