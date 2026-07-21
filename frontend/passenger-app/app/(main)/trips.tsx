import { router } from "expo-router";
import { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CalendarClock, ChevronRight, MapPin, Package } from "lucide-react-native";
import { Badge, statusTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { compactDate, money } from "@/lib/api";
import { radius, spacing } from "@/theme/tokens";

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
          gap: spacing.md,
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.border,
        },
        typeIcon: {
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
        },
        rideIcon: { backgroundColor: colors.primaryLight },
        deliveryIcon: { backgroundColor: colors.infoLight },
        rowBody: { flex: 1, gap: 4 },
        rowTitle: { ...typography.bodySemibold, color: colors.text },
        rowSub: { ...typography.caption, color: colors.textSecondary },
        meta: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.sm },
        date: { ...typography.caption, color: colors.textMuted },
        right: { alignItems: "flex-end", gap: spacing.sm },
        fare: { ...typography.bodySemibold, color: colors.text },
        sectionHeading: { ...typography.bodySemibold, color: colors.textSecondary, marginBottom: spacing.sm },
        upcomingSection: { gap: spacing.md, marginBottom: spacing.xl },
        upcomingWhen: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.sm },
        upcomingWhenText: { ...typography.caption, color: colors.primary },
      }),
    [colors, typography],
  );

  const upcoming = rides
    .filter((r) => r.status.toLowerCase() === "scheduled")
    .map((r) => ({ kind: "ride" as const, id: r.id, title: r.destinationAddress, subtitle: r.pickupAddress, status: r.status, amount: r.finalFare ?? r.estimatedFare, currency: r.currency, date: r.createdAt, scheduledFor: r.scheduledFor }))
    .sort((a, b) => Date.parse(a.scheduledFor ?? "0") - Date.parse(b.scheduledFor ?? "0"));

  const items = [
    ...rides.filter((r) => r.status.toLowerCase() !== "scheduled").map((r) => ({ kind: "ride" as const, id: r.id, title: r.destinationAddress, subtitle: r.pickupAddress, status: r.status, amount: r.finalFare ?? r.estimatedFare, currency: r.currency, date: r.createdAt })),
    ...deliveries.map((d) => ({ kind: "delivery" as const, id: d.id, title: d.dropoffAddress, subtitle: d.pickupAddress, status: d.status, amount: d.finalFee ?? d.estimatedFee, currency: d.currency, date: d.createdAt })),
  ].sort((a, b) => Date.parse(b.date ?? "0") - Date.parse(a.date ?? "0"));

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>Your trips</Text>
      {loading && items.length === 0 && upcoming.length === 0 ? (
        <SkeletonList count={4} />
      ) : items.length === 0 && upcoming.length === 0 ? (
        <EmptyState title="No trips yet" message="Book a ride or order food to see your history here." />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => `${item.kind}-${item.id}`}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            upcoming.length > 0 ? (
              <View style={styles.upcomingSection}>
                <Text style={styles.sectionHeading}>Upcoming</Text>
                {upcoming.map((item) => (
                  <Pressable
                    key={`upcoming-${item.id}`}
                    style={styles.row}
                    onPress={() => router.push({ pathname: "/ride/track/[id]", params: { id: item.id, kind: item.kind } })}
                  >
                    <View style={[styles.typeIcon, styles.rideIcon]}>
                      <CalendarClock size={16} color={colors.primary} />
                    </View>
                    <View style={styles.rowBody}>
                      <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.rowSub} numberOfLines={1}>{item.subtitle}</Text>
                      {item.scheduledFor ? (
                        <View style={styles.upcomingWhen}>
                          <CalendarClock size={12} color={colors.primary} />
                          <Text style={styles.upcomingWhenText}>{compactDate(item.scheduledFor)}</Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.right}>
                      <Text style={styles.fare}>{money(item.amount, item.currency ?? "GHS")}</Text>
                      <ChevronRight size={18} color={colors.textMuted} />
                    </View>
                  </Pressable>
                ))}
                {items.length > 0 ? <Text style={styles.sectionHeading}>History</Text> : null}
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => router.push({ pathname: "/ride/track/[id]", params: { id: item.id, kind: item.kind } })}
            >
              <View style={[styles.typeIcon, item.kind === "ride" ? styles.rideIcon : styles.deliveryIcon]}>
                {item.kind === "ride"
                  ? <MapPin size={16} color={colors.primary} />
                  : <Package size={16} color={colors.info} />
                }
              </View>

              <View style={styles.rowBody}>
                <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.rowSub} numberOfLines={1}>{item.subtitle}</Text>
                <View style={styles.meta}>
                  <Badge label={item.status.replace(/_/g, " ")} tone={statusTone(item.status)} />
                  <Text style={styles.date}>{compactDate(item.date)}</Text>
                </View>
              </View>
              <View style={styles.right}>
                <Text style={styles.fare}>{money(item.amount, item.currency ?? "GHS")}</Text>
                <ChevronRight size={18} color={colors.textMuted} />
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
