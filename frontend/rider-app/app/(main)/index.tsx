import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Bell,
  ChevronRight,
  CreditCard,
  Home,
  List,
  ShieldAlert,
  User,
  Wallet,
  BarChart3,
  Award,
  Flame,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { AppMap } from "@/components/AppMap";
import { OnlineStatusControl } from "@/components/OnlineStatusControl";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { useUserLocation } from "@/hooks/useUserLocation";
import { ApiError, api } from "@/lib/api";
import { MAP_SHEET_CENTER_INSET } from "@/components/ui/MapBottomSheet";
import {
  space,
  radii,
  type,
  brand,
  layers,
} from "@/theme/design-system";

const RIDER_MIN_ONLINE_BALANCE = 0;

/**
 * OkadaGo Rider Home Screen
 *
 * Layout (390×844):
 * ┌─────────────────────────────────┐
 * │ [Earnings Chip]    [🔔] [👤]   │ ← Top bar (floating on map)
 * │                                 │
 * │                                 │
 * │       FULL-SCREEN MAP (65-70%)  │ ← Map dominates
 * │                                 │
 * │                                 │
 * │  ┌───────────────────────────┐  │
 * │  │ ⚡ GO ONLINE / ONLINE     │  │ ← Large pill control
 * │  │    2h 15m • GH₵ 45/hr    │  │    Duration + earnings/hr
 * │  └───────────────────────────┘  │
 * │                                 │
 * │  ┌─────────────────────────┐    │
 * │  │ 🏠  💰  📋  👤         │    │ ← Floating nav dock
 * │  └─────────────────────────┘    │
 * └─────────────────────────────────┘
 */
export default function RiderHome() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const {
    session,
    online,
    toggleOnline,
    wallets = [],
    rides = [],
    deliveries = [],
    activeRide,
    activeDelivery,
    incomingRide,
    incomingDelivery,
    refresh,
  } = useApp();
  const { colors, isDark } = useTheme();
  const { latitude, longitude, hasFix, isMocked } = useUserLocation();
  const [sosLoading, setSosLoading] = useState(false);
  const [onlineSince, setOnlineSince] = useState<Date | null>(null);

  const locationPing = hasFix ? { latitude, longitude, isMocked } : undefined;

  const riderMarkers = useMemo(() => {
    if (!latitude || !longitude) return [];
    return [
      {
        id: "rider-current-location",
        latitude,
        longitude,
        title: "Your Location",
        pinColor: brand.primary,
      },
    ];
  }, [latitude, longitude]);

  useEffect(() => {
    const interval = setInterval(() => refresh(), 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  // Track online since time
  useEffect(() => {
    if (online && !onlineSince) {
      setOnlineSince(new Date());
    } else if (!online) {
      setOnlineSince(null);
    }
  }, [online]);

  const handledRequestRef = useRef<string | null>(null);

  useEffect(() => {
    if (incomingRide && online) {
      if (handledRequestRef.current !== incomingRide.id) {
        handledRequestRef.current = incomingRide.id;
        router.push({
          pathname: "/request/[id]",
          params: { id: incomingRide.id, kind: "ride" },
        });
      }
    } else if (incomingDelivery && online) {
      if (handledRequestRef.current !== incomingDelivery.id) {
        handledRequestRef.current = incomingDelivery.id;
        router.push({
          pathname: "/request/[id]",
          params: { id: incomingDelivery.id, kind: "delivery" },
        });
      }
    } else if (!incomingRide && !incomingDelivery) {
      handledRequestRef.current = null;
    }
  }, [incomingRide?.id, incomingDelivery?.id, online]);

  async function handleToggleOnline() {
    if (online) {
      Alert.alert(
        "Go Offline",
        "You won't receive new ride requests while offline.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Go Offline",
            style: "destructive",
            onPress: async () => {
              try {
                await toggleOnline(locationPing);
              } catch (error) {
                // Error handled in toggleOnline
              }
            },
          },
        ],
      );
      return;
    }

    const approval = (session?.user.riderApprovalStatus ?? "").toUpperCase();
    if (approval && approval !== "APPROVED") {
      Alert.alert(
        "Verification required",
        "Upload your documents and wait for approval before going online.",
        [
          { text: t("common.cancel"), style: "cancel" },
          { text: "Upload documents", onPress: () => router.push("/documents") },
        ],
      );
      return;
    }

    const settlementWallet =
      wallets.find((w) => (w.type ?? "").toLowerCase() === "rider_settlement") ?? wallets[0];
    const balance = Number(settlementWallet?.availableBalance ?? 0);
    if (RIDER_MIN_ONLINE_BALANCE > 0 && balance < RIDER_MIN_ONLINE_BALANCE) {
      Alert.alert(
        "Insufficient Balance",
        `Keep at least GH₵ ${RIDER_MIN_ONLINE_BALANCE} in your wallet, then top up via MoMo/Paystack to go online.`,
        [
          { text: t("common.cancel"), style: "cancel" },
          { text: "Top Up Now", onPress: () => router.push("/(main)/wallet") },
        ],
      );
      return;
    }

    try {
      await toggleOnline(locationPing);
    } catch (error) {
      if (error instanceof ApiError && error.code === "RIDER_NOT_APPROVED") {
        Alert.alert(
          "Verification required",
          error.message || "Your rider account is not approved yet.",
          [
            { text: t("common.cancel"), style: "cancel" },
            { text: "Upload documents", onPress: () => router.push("/documents") },
          ],
        );
        return;
      }
      if (error instanceof ApiError && error.code === "RIDER_INSUFFICIENT_BALANCE") {
        Alert.alert(
          "Insufficient Balance",
          error.message || `Please top up at least GH₵ ${RIDER_MIN_ONLINE_BALANCE} via MoMo to ride.`,
          [
            { text: t("common.cancel"), style: "cancel" },
            { text: "Top Up Now", onPress: () => router.push("/(main)/wallet") },
          ],
        );
        return;
      }
      if (error instanceof ApiError) {
        Alert.alert("Could not go online", error.message);
      }
    }
  }

  async function sendSos() {
    if (!session) return;
    Alert.alert(t("drive.sosConfirmTitle"), t("drive.sosConfirmBody"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("drive.sendSos"),
        style: "destructive",
        onPress: async () => {
          setSosLoading(true);
          try {
            await api("/safety/incidents", {
              method: "POST",
              token: session.token,
              body: {
                severity: "CRITICAL",
                category: "SOS",
                description: "Rider SOS triggered from dashboard (no active trip)",
              },
            });
            Alert.alert(t("drive.sosSent"), t("drive.sosSentBody"));
          } catch (e) {
            Alert.alert(t("drive.sosFailed"), e instanceof Error ? e.message : t("drive.sosFailed"));
          } finally {
            setSosLoading(false);
          }
        },
      },
    ]);
  }

  const todayEarnings = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const safeRides = Array.isArray(rides) ? rides : [];
    const safeDeliveries = Array.isArray(deliveries) ? deliveries : [];

    const completedRideEarnings = safeRides
      .filter((r) => {
        if ((r.status ?? "").toLowerCase() !== "completed") return false;
        const dateStr = String(r.completedAt ?? r.updatedAt ?? r.createdAt ?? "").slice(0, 10);
        return dateStr === todayStr;
      })
      .reduce((sum, r) => sum + Number(r.riderEarnings ?? r.finalFare ?? 0), 0);

    const completedDeliveryEarnings = safeDeliveries
      .filter((d) => {
        if ((d.status ?? "").toLowerCase() !== "delivered") return false;
        const dateStr = String(d.deliveredAt ?? d.updatedAt ?? d.createdAt ?? "").slice(0, 10);
        return dateStr === todayStr;
      })
      .reduce((sum, d) => sum + Number(d.riderEarnings ?? d.finalFee ?? 0), 0);

    return completedRideEarnings + completedDeliveryEarnings;
  }, [rides, deliveries]);

  const todayTrips = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const safeRides = Array.isArray(rides) ? rides : [];
    const safeDeliveries = Array.isArray(deliveries) ? deliveries : [];

    const completedRides = safeRides.filter((r) => {
      if ((r.status ?? "").toLowerCase() !== "completed") return false;
      const dateStr = String(r.completedAt ?? r.updatedAt ?? r.createdAt ?? "").slice(0, 10);
      return dateStr === todayStr;
    }).length;

    const completedDeliveries = safeDeliveries.filter((d) => {
      if ((d.status ?? "").toLowerCase() !== "delivered") return false;
      const dateStr = String(d.deliveredAt ?? d.updatedAt ?? d.createdAt ?? "").slice(0, 10);
      return dateStr === todayStr;
    }).length;

    return completedRides + completedDeliveries;
  }, [rides, deliveries]);

  const s = useMemo(
    () =>
      StyleSheet.create({
        screen: {
          flex: 1,
          backgroundColor: colors.bg,
        },

        /* ─── Full-Screen Map ──────────────────────────────────── */
        mapArea: {
          ...StyleSheet.absoluteFillObject,
        },

        /* ─── Top Bar (Floating on Map) ────────────────────────── */
        topBar: {
          position: "absolute",
          top: insets.top + 8,
          left: 16,
          right: 16,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: layers.header,
        },
        earningsChip: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          backgroundColor: isDark ? "rgba(17, 24, 39, 0.92)" : "rgba(255, 255, 255, 0.92)",
          borderRadius: 16,
          paddingHorizontal: 14,
          paddingVertical: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.4 : 0.15,
          shadowRadius: 12,
          elevation: 6,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        },
        earningsIcon: {
          width: 28,
          height: 28,
          borderRadius: 8,
          backgroundColor: brand.primary,
          alignItems: "center",
          justifyContent: "center",
        },
        earningsInfo: {
          gap: 1,
        },
        earningsLabel: {
          fontSize: 9,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
        earningsValue: {
          fontSize: 16,
          fontWeight: "700",
          color: colors.text,
        },
        earningsTrips: {
          fontSize: 10,
          fontWeight: "500",
          color: colors.textMuted,
        },
        topRight: {
          flexDirection: "row",
          gap: 8,
        },
        iconBtn: {
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: isDark ? "rgba(17, 24, 39, 0.92)" : "rgba(255, 255, 255, 0.92)",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.4 : 0.15,
          shadowRadius: 12,
          elevation: 6,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        },
        notificationDot: {
          position: "absolute",
          top: 8,
          right: 8,
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: brand.danger,
        },

        /* ─── Online Status Control (Pill) ──────────────────────── */
        statusControlWrap: {
          position: "absolute",
          bottom: 140,
          left: 16,
          right: 16,
          zIndex: layers.floatingAction,
        },

        /* ─── Active Trip Banner ────────────────────────────────── */
        activeTripWrap: {
          position: "absolute",
          bottom: 240,
          left: 16,
          right: 16,
          zIndex: layers.floatingAction,
        },
        activeTripCard: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          backgroundColor: brand.primary,
          borderRadius: 16,
          padding: 16,
          shadowColor: brand.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 8,
        },
        activeTripDot: {
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: "#000000",
        },
        activeTripInfo: {
          flex: 1,
        },
        activeTripLabel: {
          fontSize: 10,
          fontWeight: "600",
          color: "rgba(0,0,0,0.5)",
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
        activeTripAddress: {
          fontSize: 14,
          fontWeight: "600",
          color: "#000000",
          marginTop: 2,
        },
        activeTripArrow: {
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: "rgba(0,0,0,0.1)",
          alignItems: "center",
          justifyContent: "center",
        },

        /* ─── SOS Button ─────────────────────────────────────────── */
        sosWrap: {
          position: "absolute",
          top: insets.top + 68,
          right: 16,
          zIndex: layers.floatingAction,
        },
        sosBtn: {
          minWidth: 52,
          height: 52,
          borderRadius: 26,
          paddingHorizontal: 14,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 6,
          backgroundColor: brand.danger,
          shadowColor: brand.danger,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
          elevation: 8,
        },
        sosLabel: {
          fontSize: 13,
          fontWeight: "700",
          color: "#FFFFFF",
        },

        /* ─── Floating Nav Dock ──────────────────────────────────── */
        navDock: {
          position: "absolute",
          bottom: insets.bottom + 16,
          left: 16,
          right: 16,
          zIndex: layers.floatingAction,
        },
        navDockInner: {
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "center",
          backgroundColor: isDark ? "rgba(17, 24, 39, 0.95)" : "rgba(255, 255, 255, 0.95)",
          borderRadius: 24,
          paddingVertical: 12,
          paddingHorizontal: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.5 : 0.18,
          shadowRadius: 16,
          elevation: 10,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        },
        navItem: {
          alignItems: "center",
          justifyContent: "center",
          width: 56,
          height: 48,
          borderRadius: 14,
        },
        navItemActive: {
          backgroundColor: isDark ? "rgba(250, 204, 21, 0.15)" : "rgba(250, 204, 21, 0.1)",
        },
        navLabel: {
          fontSize: 10,
          fontWeight: "600",
          color: colors.textMuted,
          marginTop: 4,
        },
        navLabelActive: {
          color: brand.primary,
        },
      }),
    [colors, isDark, insets, online],
  );

  return (
    <View style={s.screen}>
      {/* ─── Full-Screen Map ────────────────────────────────────── */}
      <View style={s.mapArea}>
        <AppMap
          region={{
            latitude,
            longitude,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
          }}
          markers={riderMarkers}
          autoCenterOnLocation={hasFix}
          showCenterButton
          centerButtonInset={{ bottom: 160, right: 16 }}
        />
      </View>

      {/* ─── Top Bar: Earnings Chip + Actions ───────────────────── */}
      <View style={s.topBar} pointerEvents="box-none">
        <Pressable
          style={s.earningsChip}
          onPress={() => router.push("/(main)/earnings")}
          accessibilityRole="button"
          accessibilityLabel="View earnings"
        >
          <View style={s.earningsIcon}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#000000" }}>GH₵</Text>
          </View>
          <View style={s.earningsInfo}>
            <Text style={s.earningsLabel}>Today</Text>
            <Text style={s.earningsValue}>{todayEarnings.toFixed(0)}</Text>
            <Text style={s.earningsTrips}>{todayTrips} trips</Text>
          </View>
        </Pressable>

        <View style={s.topRight}>
          <Pressable
            style={s.iconBtn}
            onPress={() => router.push("/notifications")}
            accessibilityLabel="Notifications"
          >
            <Bell size={20} color={colors.text} />
            <View style={s.notificationDot} />
          </Pressable>
          <Pressable
            style={s.iconBtn}
            onPress={() => router.push("/(main)/profile")}
            accessibilityLabel="Profile"
          >
            <User size={20} color={colors.text} />
          </Pressable>
        </View>
      </View>

      {/* ─── SOS Button ─────────────────────────────────────────── */}
      {online && (
        <View style={s.sosWrap}>
          <Pressable
            style={s.sosBtn}
            disabled={sosLoading}
            onPress={() => void sendSos()}
            accessibilityLabel={t("drive.sendSos")}
            accessibilityRole="button"
          >
            {sosLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <ShieldAlert size={16} color="#FFFFFF" />
                <Text style={s.sosLabel}>SOS</Text>
              </>
            )}
          </Pressable>
        </View>
      )}

      {/* ─── Active Trip Banner ──────────────────────────────────── */}
      {(activeRide || activeDelivery) && (
        <View style={s.activeTripWrap}>
          <Pressable
            style={s.activeTripCard}
            onPress={() =>
              router.push({
                pathname: "/trip/[id]",
                params: {
                  id: (activeRide ?? activeDelivery)!.id,
                  kind: activeRide ? "ride" : "delivery",
                },
              })
            }
          >
            <View style={s.activeTripDot} />
            <View style={s.activeTripInfo}>
              <Text style={s.activeTripLabel}>Active Trip</Text>
              <Text style={s.activeTripAddress} numberOfLines={1}>
                {activeRide?.destinationAddress ?? activeDelivery?.dropoffAddress}
              </Text>
            </View>
            <View style={s.activeTripArrow}>
              <ChevronRight size={14} color="#000000" />
            </View>
          </Pressable>
        </View>
      )}

      {/* ─── Online Status Control (Pill) ───────────────────────── */}
      <View style={s.statusControlWrap}>
        <OnlineStatusControl
          online={online}
          todayEarnings={todayEarnings}
          onlineSince={onlineSince}
          onToggle={handleToggleOnline}
        />
      </View>

      {/* ─── Floating Navigation Dock ────────────────────────────── */}
      <View style={s.navDock}>
        <View style={s.navDockInner}>
          <Pressable style={[s.navItem, s.navItemActive]} accessibilityLabel="Home">
            <Home size={20} color={brand.primary} />
            <Text style={[s.navLabel, s.navLabelActive]}>Home</Text>
          </Pressable>
          <Pressable
            style={s.navItem}
            onPress={() => router.push("/(main)/earnings")}
            accessibilityLabel="Earnings"
          >
            <CreditCard size={20} color={colors.textMuted} />
            <Text style={s.navLabel}>Earn</Text>
          </Pressable>
          <Pressable
            style={s.navItem}
            onPress={() => router.push("/(main)/trips")}
            accessibilityLabel="Trips"
          >
            <List size={20} color={colors.textMuted} />
            <Text style={s.navLabel}>Trips</Text>
          </Pressable>
          <Pressable
            style={s.navItem}
            onPress={() => router.push("/(main)/wallet")}
            accessibilityLabel="Wallet"
          >
            <Wallet size={20} color={colors.textMuted} />
            <Text style={s.navLabel}>Wallet</Text>
          </Pressable>
          <Pressable
            style={s.navItem}
            onPress={() => router.push("/(main)/profile")}
            accessibilityLabel="Profile"
          >
            <User size={20} color={colors.textMuted} />
            <Text style={s.navLabel}>Profile</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
