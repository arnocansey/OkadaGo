import { router, Stack } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronRight } from "lucide-react-native";
import { RideStatusBadge } from "@/components/ui/RideStatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { NavigationHeader } from "@/components/ScreenHeader";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";
import { compactDate, money } from "@/lib/api";
import { radius, spacing } from "@/theme/tokens";

const PAGE_SIZE = 20;

export default function TripsScreen() {
  const insets = useSafeAreaInsets();
  const { rides, deliveries, loading, refresh } = useApp();
  const { colors, typography } = useTheme();
  const { showToast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        list: { padding: spacing.xl, gap: spacing.md },
        row: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.border,
        },
        rowBody: { flex: 1, gap: spacing.sm },
        rowTitle: { ...typography.bodySemibold, color: colors.text },
        right: { alignItems: "flex-end", gap: spacing.xs },
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
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <NavigationHeader title="Trip History" />
      <View style={styles.screen}>
        {loading && items.length === 0 ? (
          <SkeletonList count={4} />
        ) : items.length === 0 ? (
          <EmptyState title="No trips yet" message="Go online to start accepting rides and deliveries." />
        ) : (
          <FlatList
            data={items.slice(0, displayCount)}
            keyExtractor={(item) => `${item.kind}-${item.id}`}
            contentContainerStyle={styles.list}
            onRefresh={onRefresh}
            refreshing={refreshing}
            onEndReached={() => {
              if (displayCount < items.length) setDisplayCount((c) => c + PAGE_SIZE);
            }}
            onEndReachedThreshold={0.5}
            renderItem={({ item }) => (
              <Pressable
                style={styles.row}
                onPress={() => router.push({ pathname: "/trip/[id]", params: { id: item.id, kind: item.kind } })}
              >
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
                  <RideStatusBadge status={item.status} />
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
      </View>
    </>
  );
}
