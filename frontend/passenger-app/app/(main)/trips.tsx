import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CalendarClock,
  ChevronRight,
  MapPin,
  Navigation,
  Package,
  Repeat,
} from "lucide-react-native";
import { RideStatusBadge } from "@/components/ui/RideStatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { compactDate, money } from "@/lib/api";

const PAGE_SIZE = 20;
type Tab = "rides" | "deliveries";

export default function TripsScreen() {
  const { rides, deliveries, loading, refresh } = useApp();
  const { colors, typography, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<Tab>("rides");
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const rideItems = useMemo(
    () =>
      rides
        .filter((r) => r.status.toLowerCase() !== "scheduled")
        .sort((a, b) => Date.parse(b.createdAt ?? "0") - Date.parse(a.createdAt ?? "0")),
    [rides],
  );

  const deliveryItems = useMemo(
    () =>
      deliveries.sort(
        (a, b) => Date.parse(b.createdAt ?? "0") - Date.parse(a.createdAt ?? "0"),
      ),
    [deliveries],
  );

  const activeItems = tab === "rides" ? rideItems : deliveryItems;

  const upcoming = useMemo(
    () =>
      rides
        .filter((r) => r.status.toLowerCase() === "scheduled")
        .sort((a, b) => Date.parse(a.scheduledFor ?? "0") - Date.parse(b.scheduledFor ?? "0")),
    [rides],
  );

  const s = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        tabs: {
          flexDirection: "row",
          marginHorizontal: 20,
          marginTop: 4,
          marginBottom: 12,
          backgroundColor: isDark ? colors.surfaceOverlay : "#F3F4F6",
          borderRadius: 12,
          padding: 3,
        },
        tab: {
          flex: 1,
          paddingVertical: 10,
          borderRadius: 10,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
          gap: 6,
        },
        tabActive: {
          backgroundColor: isDark ? colors.surface : "#FFFFFF",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0.3 : 0.08,
          shadowRadius: 4,
          elevation: 2,
        },
        tabText: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.textMuted,
        },
        tabTextActive: {
          color: colors.text,
        },
        tabCount: {
          fontSize: 11,
          fontWeight: "700",
          color: colors.textMuted,
          backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 8,
          overflow: "hidden",
        },
        tabCountActive: {
          color: colors.primary,
          backgroundColor: colors.primaryLight,
        },
        list: { paddingHorizontal: 20, paddingBottom: 40 },
        sectionLabel: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 8,
          marginTop: 4,
        },

        /* ─── Trip Card ──────────────────────────────── */
        card: {
          backgroundColor: isDark ? colors.surface : "#FFFFFF",
          borderRadius: 16,
          padding: 16,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
        },
        cardTop: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        },
        cardDate: {
          fontSize: 12,
          color: colors.textMuted,
        },
        cardFare: {
          fontSize: 17,
          fontWeight: "700",
          color: colors.primary,
        },
        routeRow: {
          flexDirection: "row",
          gap: 10,
          marginBottom: 12,
        },
        routeDots: {
          alignItems: "center",
          paddingTop: 5,
          width: 12,
        },
        dot: {
          width: 8,
          height: 8,
          borderRadius: 4,
        },
        dashCol: {
          flex: 1,
          alignItems: "center",
          paddingVertical: 3,
        },
        dash: {
          width: 1.5,
          height: 6,
          borderRadius: 1,
          backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
          marginBottom: 2,
        },
        routeAddresses: {
          flex: 1,
          gap: 12,
        },
        addressText: {
          fontSize: 13,
          color: colors.text,
          fontWeight: "500",
          lineHeight: 18,
        },
        addressLabel: {
          fontSize: 10,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 2,
        },
        cardBottom: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        serviceTag: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 6,
          backgroundColor: colors.primaryLight,
        },
        serviceTagText: {
          fontSize: 11,
          fontWeight: "600",
          color: colors.primary,
        },
        repeatBtn: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: colors.border,
        },
        repeatText: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.text,
        },

        /* ─── Upcoming Card ──────────────────────────── */
        upcomingCard: {
          backgroundColor: isDark ? "rgba(250,204,21,0.06)" : "rgba(250,204,21,0.04)",
          borderRadius: 16,
          padding: 16,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: isDark ? "rgba(250,204,21,0.12)" : "rgba(250,204,21,0.15)",
        },
        upcomingLabel: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          marginBottom: 8,
        },
        upcomingLabelText: {
          fontSize: 11,
          fontWeight: "700",
          color: colors.primary,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
      }),
    [colors, isDark],
  );

  const renderTripCard = ({ item }: { item: (typeof rideItems)[0] | (typeof deliveryItems)[0] }) => {
    const isRide = "destinationAddress" in item;
    const status = (item.status ?? "").toLowerCase();
    const isCompleted = status === "completed" || status === "delivered";

    return (
      <Pressable
        style={s.card}
        onPress={() =>
          router.push({
            pathname: "/ride/track/[id]",
            params: { id: item.id, kind: isRide ? "ride" : "delivery" },
          })
        }
      >
        <View style={s.cardTop}>
          <Text style={s.cardDate}>{compactDate(item.createdAt)}</Text>
          <Text style={s.cardFare}>
            {money(
              isRide
                ? (item as (typeof rideItems)[0]).finalFare ??
                  (item as (typeof rideItems)[0]).estimatedFare
                : (item as (typeof deliveryItems)[0]).finalFee ??
                  (item as (typeof deliveryItems)[0]).estimatedFee,
              item.currency ?? "GHS",
            )}
          </Text>
        </View>

        <View style={s.routeRow}>
          <View style={s.routeDots}>
            <View style={[s.dot, { backgroundColor: colors.primary }]} />
            <View style={s.dashCol}>
              {Array.from({ length: 3 }).map((_, i) => (
                <View key={i} style={s.dash} />
              ))}
            </View>
            <View style={[s.dot, { backgroundColor: colors.danger }]} />
          </View>
          <View style={s.routeAddresses}>
            <View>
              <Text style={s.addressLabel}>From</Text>
              <Text style={s.addressText} numberOfLines={1}>
                {item.pickupAddress}
              </Text>
            </View>
            <View>
              <Text style={s.addressLabel}>To</Text>
              <Text style={s.addressText} numberOfLines={1}>
                {isRide
                  ? (item as (typeof rideItems)[0]).destinationAddress
                  : (item as (typeof deliveryItems)[0]).dropoffAddress}
              </Text>
            </View>
          </View>
        </View>

        <View style={s.cardBottom}>
          <View style={s.serviceTag}>
            {isRide ? (
              <MapPin size={12} color={colors.primary} />
            ) : (
              <Package size={12} color={colors.primary} />
            )}
            <Text style={s.serviceTagText}>{isRide ? "Ride" : "Delivery"}</Text>
            <RideStatusBadge status={item.status} />
          </View>
          {isCompleted ? (
            <Pressable
              style={s.repeatBtn}
              onPress={() =>
                router.push({
                  pathname: "/ride/book",
                  params: {
                    destination: isRide
                      ? (item as (typeof rideItems)[0]).destinationAddress
                      : (item as (typeof deliveryItems)[0]).dropoffAddress,
                    destLat: String(
                      isRide
                        ? (item as (typeof rideItems)[0]).destinationLatitude ?? ""
                        : (item as (typeof deliveryItems)[0]).dropoffLatitude ?? "",
                    ),
                    destLng: String(
                      isRide
                        ? (item as (typeof rideItems)[0]).destinationLongitude ?? ""
                        : (item as (typeof deliveryItems)[0]).dropoffLongitude ?? "",
                    ),
                  },
                })
              }
            >
              <Repeat size={12} color={colors.text} />
              <Text style={s.repeatText}>Repeat</Text>
            </Pressable>
          ) : null}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={s.screen}>
      <ScreenHeader title="My Trips" onBack={() => router.replace("/(main)")} />

      {/* ─── Tabs ──────────────────────────────────────── */}
      <View style={s.tabs}>
        <Pressable
          style={[s.tab, tab === "rides" && s.tabActive]}
          onPress={() => setTab("rides")}
        >
          <MapPin size={14} color={tab === "rides" ? colors.primary : colors.textMuted} />
          <Text style={[s.tabText, tab === "rides" && s.tabTextActive]}>Rides</Text>
          {rideItems.length > 0 ? (
            <Text style={[s.tabCount, tab === "rides" && s.tabCountActive]}>
              {rideItems.length}
            </Text>
          ) : null}
        </Pressable>
        <Pressable
          style={[s.tab, tab === "deliveries" && s.tabActive]}
          onPress={() => setTab("deliveries")}
        >
          <Package size={14} color={tab === "deliveries" ? colors.primary : colors.textMuted} />
          <Text style={[s.tabText, tab === "deliveries" && s.tabTextActive]}>Deliveries</Text>
          {deliveryItems.length > 0 ? (
            <Text style={[s.tabCount, tab === "deliveries" && s.tabCountActive]}>
              {deliveryItems.length}
            </Text>
          ) : null}
        </Pressable>
      </View>

      {/* ─── Content ───────────────────────────────────── */}
      {loading && activeItems.length === 0 ? (
        <SkeletonList count={4} />
      ) : activeItems.length === 0 && upcoming.length === 0 ? (
        <EmptyState
          icon={<Navigation size={28} color={colors.primary} />}
          title={tab === "rides" ? "No rides yet" : "No deliveries yet"}
          message={
            tab === "rides"
              ? "Your ride history will appear here."
              : "Your delivery history will appear here."
          }
          action={
            <Button
              label="Book a ride"
              onPress={() => router.push("/ride/book")}
            />
          }
        />
      ) : (
        <FlatList
          data={activeItems.slice(0, displayCount)}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          onRefresh={onRefresh}
          refreshing={refreshing}
          onEndReached={() => {
            if (displayCount < activeItems.length) setDisplayCount((c) => c + PAGE_SIZE);
          }}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={
            upcoming.length > 0 && tab === "rides" ? (
              <View style={{ marginBottom: 16 }}>
                <Text style={s.sectionLabel}>Upcoming</Text>
                {upcoming.map((item) => (
                  <Pressable
                    key={`upcoming-${item.id}`}
                    style={s.upcomingCard}
                    onPress={() =>
                      router.push({
                        pathname: "/ride/track/[id]",
                        params: { id: item.id, kind: "ride" },
                      })
                    }
                  >
                    <View style={s.upcomingLabel}>
                      <CalendarClock size={12} color={colors.primary} />
                      <Text style={s.upcomingLabelText}>Scheduled</Text>
                    </View>
                    <Text style={s.addressText} numberOfLines={1}>
                      {item.destinationAddress}
                    </Text>
                    <Text style={[s.cardDate, { marginTop: 4 }]}>
                      {compactDate(item.scheduledFor ?? "")} · {item.pickupAddress}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null
          }
          renderItem={renderTripCard}
        />
      )}
    </SafeAreaView>
  );
}
