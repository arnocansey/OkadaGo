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
  Award,
  Bell,
  ChevronRight,
  CreditCard,
  Flame,
  Home,
  List,
  Navigation,
  Package,
  ShieldAlert,
  User,
  Wallet,
  Zap,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppMap } from "@/components/AppMap";
import { DailyGoalModal, DAILY_GOAL_STORAGE_KEY, DEFAULT_DAILY_GOAL } from "@/components/DailyGoalModal";
import { OnlineStatusControl } from "@/components/OnlineStatusControl";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { useUserLocation } from "@/hooks/useUserLocation";
import { riderWs } from "@/lib/websocket";
import { ApiError, api } from "@/lib/api";
import {
  brand,
  layers,
} from "@/theme/design-system";

const RIDER_MIN_ONLINE_BALANCE = 0;

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
  const { latitude, longitude, heading, speed, accuracy, hasFix, isMocked } = useUserLocation();
  const [sosLoading, setSosLoading] = useState(false);
  const [onlineSince, setOnlineSince] = useState<Date | null>(null);
  const [jobPreference, setJobPreference] = useState<"both" | "rides" | "deliveries">("both");
  const [dailyGoal, setDailyGoal] = useState<number>(DEFAULT_DAILY_GOAL);
  const [goalModalVisible, setGoalModalVisible] = useState<boolean>(false);

  // ─── Real-Time Continuous GPS Streaming to Backend ────────
  useEffect(() => {
    if (!online || !hasFix || !latitude || !longitude) return;

    const payload = {
      latitude,
      longitude,
      heading: heading ?? 0,
      speed: speed ?? 0,
      accuracy: accuracy ?? 10,
      status: "ONLINE" as const,
    };

    // Send update immediately on movement
    riderWs.send("rider:location:update", payload);

    // Heartbeat every 2.5s for continuous telemetry
    const timer = setInterval(() => {
      if (riderWs.isConnected()) {
        riderWs.send("rider:location:update", payload);
      }
    }, 2500);

    return () => clearInterval(timer);
  }, [online, hasFix, latitude, longitude, heading, speed, accuracy]);

  useEffect(() => {
    AsyncStorage.getItem(DAILY_GOAL_STORAGE_KEY)
      .then((val) => {
        if (val) {
          const parsed = parseFloat(val);
          if (!isNaN(parsed) && parsed > 0) setDailyGoal(parsed);
        }
      })
      .catch(() => {});
  }, []);

  const locationPing = hasFix ? { latitude, longitude, isMocked } : undefined;

  const hotspotMarkers = useMemo(() => {
    return [
      { id: "surge-mall", latitude: 5.6205, longitude: -0.1735, title: "Accra Mall 🔥 1.3x", pinColor: "#EF4444" },
      { id: "surge-circle", latitude: 5.5562, longitude: -0.2104, title: "Circle ⚡ High Demand", pinColor: brand.primary },
      { id: "surge-osu", latitude: 5.5568, longitude: -0.1824, title: "Osu Oxford St 🔥 1.2x", pinColor: "#EF4444" },
      { id: "surge-airport", latitude: 5.6052, longitude: -0.1698, title: "Airport +GH₵ 5", pinColor: brand.primary },
    ];
  }, []);

  const riderMarkers = useMemo(() => {
    const list = [...hotspotMarkers];
    if (latitude && longitude) {
      list.push({
        id: "rider-current-location",
        latitude,
        longitude,
        title: "Your Location",
        pinColor: brand.primary,
      });
    }
    return list;
  }, [latitude, longitude, hotspotMarkers]);

  useEffect(() => {
    const interval = setInterval(() => refresh(), 15000);
    return () => clearInterval(interval);
  }, [refresh]);

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
                const errMessage =
                  error instanceof Error ? error.message : "Could not update availability.";
                Alert.alert("Unable to Go Offline", errMessage);
              }
            },
          },
        ],
      );
      return;
    }

    const approval = (session?.user.riderApprovalStatus ?? "").toUpperCase();
    if (approval && approval !== "APPROVED" && !__DEV__) {
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
        `You need a minimum balance of GH₵ ${RIDER_MIN_ONLINE_BALANCE.toFixed(2)} to go online.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Top Up Wallet", onPress: () => router.push("/(main)/wallet") },
        ],
      );
      return;
    }

    try {
      await toggleOnline(locationPing);
    } catch (error) {
      const errMessage =
        error instanceof Error ? error.message : "Could not update availability. Please try again.";
      Alert.alert("Unable to Go Online", errMessage);
    }
  }

  async function sendSos() {
    Alert.alert(t("drive.sosConfirmTitle"), t("drive.sosConfirmBody"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("drive.sosConfirmAction"),
        style: "destructive",
        onPress: async () => {
          if (!session?.token) return;
          setSosLoading(true);
          try {
            await api("/safety/sos", {
              method: "POST",
              token: session.token,
              body: {
                location: hasFix && latitude && longitude ? { latitude, longitude } : undefined,
                note: "Emergency trigger from rider home screen",
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
          gap: 10,
          backgroundColor: isDark ? "rgba(17, 24, 39, 0.94)" : "rgba(255, 255, 255, 0.94)",
          borderRadius: 18,
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
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: brand.primary,
          alignItems: "center",
          justifyContent: "center",
        },
        earningsInfo: {
          gap: 1,
        },
        earningsLabel: {
          fontSize: 9,
          fontWeight: "700",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
        earningsValue: {
          fontSize: 16,
          fontWeight: "800",
          color: colors.text,
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

        /* ─── Daily Goal Capsule (Bolt Driver Style) ────────────── */
        goalWidget: {
          position: "absolute",
          top: insets.top + 68,
          left: 16,
          right: 16,
          backgroundColor: isDark ? "rgba(17, 24, 39, 0.94)" : "rgba(255, 255, 255, 0.94)",
          borderRadius: 16,
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
          zIndex: layers.header,
          gap: 6,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 4,
        },
        goalHeader: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        },
        goalIcon: {
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: brand.primary,
          alignItems: "center",
          justifyContent: "center",
        },
        goalTitle: {
          flex: 1,
          fontSize: 12,
          fontWeight: "700",
          color: colors.text,
        },
        goalBonus: {
          fontSize: 11,
          fontWeight: "800",
          color: brand.primary,
        },
        goalTrack: {
          height: 4,
          borderRadius: 2,
          backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB",
          overflow: "hidden",
        },
        goalFill: {
          height: 4,
          borderRadius: 2,
          backgroundColor: brand.primary,
        },

        /* ─── Job Preference Filter Bar ─────────────────────────── */
        preferenceWrap: {
          position: "absolute",
          bottom: insets.bottom + 152,
          left: 16,
          right: 16,
          flexDirection: "row",
          gap: 8,
          zIndex: layers.floatingAction,
        },
        prefChip: {
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          paddingVertical: 8,
          borderRadius: 12,
          backgroundColor: isDark ? "rgba(17, 24, 39, 0.94)" : "rgba(255, 255, 255, 0.94)",
          borderWidth: 1.5,
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 3,
        },
        prefChipActive: {
          backgroundColor: brand.primary,
          borderColor: brand.primary,
        },
        prefText: {
          fontSize: 11,
          fontWeight: "700",
          color: colors.textMuted,
        },
        prefTextActive: {
          color: "#000000",
        },

        /* ─── Online Status Control (Pill) ──────────────────────── */
        statusControlWrap: {
          position: "absolute",
          bottom: insets.bottom + 84,
          left: 16,
          right: 16,
          zIndex: layers.floatingAction,
        },

        /* ─── Active Trip Banner ────────────────────────────────── */
        activeTripWrap: {
          position: "absolute",
          bottom: insets.bottom + 152,
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
          padding: 14,
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
          top: insets.top + 130,
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
          bottom: insets.bottom + 12,
          left: 16,
          right: 16,
          zIndex: layers.floatingAction,
        },
        navDockInner: {
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "center",
          backgroundColor: isDark ? "rgba(17, 24, 39, 0.95)" : "rgba(255, 255, 255, 0.95)",
          borderRadius: 20,
          paddingVertical: 8,
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
          width: 54,
          height: 44,
          borderRadius: 12,
        },
        navItemActive: {
          backgroundColor: isDark ? "rgba(250, 204, 21, 0.15)" : "rgba(250, 204, 21, 0.1)",
        },
        navLabel: {
          fontSize: 10,
          fontWeight: "600",
          color: colors.textMuted,
          marginTop: 2,
        },
        navLabelActive: {
          color: brand.primary,
        },
      }),
    [colors, isDark, insets, online],
  );

  return (
    <View style={s.screen}>
      {/* ─── Full-Screen Map with Surge Hotspots ────────────────── */}
      <View style={s.mapArea}>
        <AppMap
          region={{
            latitude: latitude ?? 5.6037,
            longitude: longitude ?? -0.187,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
          }}
          markers={riderMarkers}
          autoCenterOnLocation={hasFix}
          showCenterButton
          centerButtonInset={{ bottom: insets.bottom + 200, right: 16 }}
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
            <Text style={{ fontSize: 12, fontWeight: "900", color: "#000000" }}>GH₵</Text>
          </View>
          <View style={s.earningsInfo}>
            <Text style={s.earningsLabel}>Today's Net</Text>
            <Text style={s.earningsValue}>GH₵ {todayEarnings.toFixed(2)}</Text>
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

      {/* ─── Top Floating Daily Goal Progress Widget ────────────── */}
      <Pressable
        style={s.goalWidget}
        onPress={() => setGoalModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Daily goal details"
      >
        <View style={s.goalHeader}>
          <View style={s.goalIcon}>
            <Award size={13} color="#000000" />
          </View>
          <Text style={s.goalTitle} numberOfLines={1}>
            Goal: GH₵ {todayEarnings.toFixed(0)} / GH₵ {dailyGoal} ({Math.min(100, Math.round((todayEarnings / dailyGoal) * 100))}%)
          </Text>
          <Text style={[s.goalBonus, todayEarnings >= dailyGoal && { color: "#10B981" }]}>
            {todayEarnings >= dailyGoal ? "Achieved 🎉" : `GH₵ ${Math.max(0, dailyGoal - todayEarnings).toFixed(0)} left`}
          </Text>
        </View>
        <View style={s.goalTrack}>
          <View
            style={[
              s.goalFill,
              todayEarnings >= dailyGoal && { backgroundColor: "#10B981" },
              { width: `${Math.min(100, Math.max(5, (todayEarnings / dailyGoal) * 100))}%` },
            ]}
          />
        </View>
      </Pressable>

      <DailyGoalModal
        visible={goalModalVisible}
        onClose={() => setGoalModalVisible(false)}
        currentGoal={dailyGoal}
        onSaveGoal={(newGoal) => setDailyGoal(newGoal)}
        todayEarnings={todayEarnings}
        completedTrips={todayTrips}
      />

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

      {/* ─── Job Preference Quick Filter (Bolt / Yango Pro Style) ─── */}
      {online && !activeRide && !activeDelivery && (
        <View style={s.preferenceWrap}>
          <Pressable
            style={[s.prefChip, jobPreference === "both" && s.prefChipActive]}
            onPress={() => setJobPreference("both")}
          >
            <Zap size={13} color={jobPreference === "both" ? "#000000" : colors.textMuted} />
            <Text style={[s.prefText, jobPreference === "both" && s.prefTextActive]}>All Jobs</Text>
          </Pressable>
          <Pressable
            style={[s.prefChip, jobPreference === "rides" && s.prefChipActive]}
            onPress={() => setJobPreference("rides")}
          >
            <Navigation size={13} color={jobPreference === "rides" ? "#000000" : colors.textMuted} />
            <Text style={[s.prefText, jobPreference === "rides" && s.prefTextActive]}>Rides Only</Text>
          </Pressable>
          <Pressable
            style={[s.prefChip, jobPreference === "deliveries" && s.prefChipActive]}
            onPress={() => setJobPreference("deliveries")}
          >
            <Package size={13} color={jobPreference === "deliveries" ? "#000000" : colors.textMuted} />
            <Text style={[s.prefText, jobPreference === "deliveries" && s.prefTextActive]}>Parcels Only</Text>
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
