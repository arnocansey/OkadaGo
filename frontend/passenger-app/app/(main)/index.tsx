import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Clock,
  CreditCard,
  Home,
  Navigation,
  Package,
  Search,
  Star,
  User,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { AppMap } from "@/components/AppMap";
import { DestinationSearchSheet } from "@/components/DestinationSearchSheet";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { useUserLocation } from "@/hooks/useUserLocation";
import { api } from "@/lib/api";
import { MAP_SHEET_CENTER_INSET } from "@/components/ui/MapBottomSheet";
import type { HomeService, SavedPlace } from "@/types";

/**
 * OkadaGo Passenger Home Screen — v2
 *
 * 390 × 844 viewport
 *
 * ┌─────────────────────────────────┐
 * │ [Logo]                [Avatar]  │ ← Safe area top
 * │                                 │
 * │       FULL-SCREEN MAP           │
 * │                                 │
 * │  ┌───────────────────────────┐  │
 * │  │  ● Current location       │  │
 * │  │  │                        │  │ ← Floating search card
 * │  │  ▼ Where are you going?   │  │
 * │  │                           │  │
 * │  │ [Go Now][Send][Schedule]  │  │ ← Quick actions
 * │  │ [Saved Places]            │  │
 * │  └───────────────────────────┘  │
 * │                                 │
 * │  ┌─────────────────────────┐    │
 * │  │ 🏠   📋   💳   👤      │    │ ← Floating nav dock
 * │  └─────────────────────────┘    │
 * └─────────────────────────────────┘
 */
export default function HomeScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { session, activeRide, activeDelivery } = useApp();
  const { colors, isDark } = useTheme();
  const { latitude, longitude, loading: locationLoading, hasFix } = useUserLocation();
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [recentDestinations, setRecentDestinations] = useState<
    Array<{ address: string; latitude: number; longitude: number; label?: string }>
  >([]);

  /* ─── Fetch saved places ──────────────────────────────────── */
  useEffect(() => {
    if (!session?.token) return;
    api<SavedPlace[]>("/places/saved", { token: session.token })
      .then(setSavedPlaces)
      .catch(() => setSavedPlaces([]));
  }, [session?.token]);

  /* ─── Active trip pulse ───────────────────────────────────── */
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!activeRide && !activeDelivery) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [Boolean(activeRide), Boolean(activeDelivery)]);

  /* ─── Handlers ────────────────────────────────────────────── */
  const handleQuickAction = useCallback((action: HomeService) => {
    if (action === "food") {
      router.push("/food");
      return;
    }
    router.push({
      pathname: "/ride/book",
      params: { mode: action === "send" ? "delivery" : "ride" },
    });
  }, []);

  const handleSelectDestination = useCallback(
    (dest: { address: string; latitude: number; longitude: number }) => {
      setSearchOpen(false);
      setRecentDestinations((prev) => {
        const filtered = prev.filter(
          (r) => !(r.latitude === dest.latitude && r.longitude === dest.longitude),
        );
        return [dest, ...filtered].slice(0, 8);
      });
      router.push({
        pathname: "/ride/book",
        params: {
          mode: "ride",
          destination: dest.address,
          destLat: String(dest.latitude),
          destLng: String(dest.longitude),
        },
      });
    },
    [],
  );

  const handleSelectSavedPlace = useCallback(
    (place: SavedPlace) => {
      setSearchOpen(false);
      router.push({
        pathname: "/ride/book",
        params: {
          mode: "ride",
          placeId: place.id,
          destination: place.address,
          destLat: String(place.latitude),
          destLng: String(place.longitude),
        },
      });
    },
    [],
  );

  /* ─── User initials for avatar ────────────────────────────── */
  const userInitial = useMemo(() => {
    const name = session?.user?.fullName;
    if (name) return name.charAt(0).toUpperCase();
    return "U";
  }, [session?.user?.fullName]);

  /* ─── Styles ──────────────────────────────────────────────── */
  const s = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.bg },

        /* ─── Top Bar ──────────────────────────────────────── */
        topBar: {
          position: "absolute",
          top: insets.top + 8,
          left: 16,
          right: 16,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 20,
        },
        logo: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        },
        logoMark: {
          width: 34,
          height: 34,
          borderRadius: 10,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
        },
        logoMarkText: {
          fontSize: 15,
          fontWeight: "800",
          color: colors.textOnPrimary,
        },
        logoWordmark: {
          fontSize: 17,
          fontWeight: "700",
          color: colors.text,
          letterSpacing: -0.3,
        },
        avatarBtn: {
          width: 42,
          height: 42,
          borderRadius: 21,
          backgroundColor: colors.primaryLight,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 2,
          borderColor: colors.primary,
        },
        avatarInitial: {
          fontSize: 16,
          fontWeight: "700",
          color: colors.primary,
        },

        /* ─── Active Trip Banner ───────────────────────────── */
        activeTripWrap: {
          position: "absolute",
          top: insets.top + 64,
          left: 16,
          right: 16,
          zIndex: 20,
        },
        activeTrip: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          backgroundColor: colors.primary,
          borderRadius: 16,
          padding: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        },
        activeDot: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.textOnPrimary,
        },
        activeLabel: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.textOnPrimary,
        },
        activeValue: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.textOnPrimary,
          marginTop: 2,
        },
        activeArrow: {
          fontSize: 22,
          color: colors.textOnPrimary,
          fontWeight: "300",
        },

        /* ─── Floating Search Card ─────────────────────────── */
        searchCard: {
          position: "absolute",
          top: insets.top + 64,
          left: 16,
          right: 16,
          zIndex: 15,
        },
        searchCardInner: {
          backgroundColor: isDark ? "rgba(17, 24, 39, 0.96)" : "rgba(255, 255, 255, 0.96)",
          borderRadius: 20,
          padding: 14,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.5 : 0.18,
          shadowRadius: 20,
          elevation: 10,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        },

        /* ─── Pickup Row ───────────────────────────────────── */
        pickupRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          marginBottom: 4,
        },
        pickupDot: {
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: colors.primary,
        },
        pickupText: {
          flex: 1,
          fontSize: 13,
          fontWeight: "500",
          color: colors.textSecondary,
        },
        pickupLabel: {
          fontSize: 11,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.4,
        },

        /* ─── Route Indicator ──────────────────────────────── */
        routeLine: {
          flexDirection: "row",
          alignItems: "center",
          paddingLeft: 4,
          height: 24,
        },
        routeDash: {
          width: 2,
          height: 16,
          borderRadius: 1,
          backgroundColor: colors.border,
        },

        /* ─── Destination Field ────────────────────────────── */
        destField: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 14,
        },
        destIcon: {
          width: 10,
          height: 10,
          borderRadius: 5,
          borderWidth: 2,
          borderColor: colors.danger,
          backgroundColor: "transparent",
        },
        destText: {
          flex: 1,
          fontSize: 16,
          fontWeight: "500",
          color: colors.textMuted,
        },

        /* ─── Quick Actions ────────────────────────────────── */
        quickActions: {
          flexDirection: "row",
          gap: 8,
          marginTop: 12,
        },
        quickAction: {
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
          paddingVertical: 10,
          borderRadius: 12,
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
        },
        quickActionActive: {
          backgroundColor: isDark ? "rgba(250, 204, 21, 0.12)" : "rgba(250, 204, 21, 0.1)",
          borderWidth: 1,
          borderColor: colors.primary,
        },
        quickActionText: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.textMuted,
        },
        quickActionTextActive: {
          color: colors.primary,
        },

        /* ─── Floating Nav Dock ────────────────────────────── */
        navDock: {
          position: "absolute",
          bottom: insets.bottom + 12,
          left: 16,
          right: 16,
          zIndex: 20,
        },
        navDockInner: {
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "center",
          backgroundColor: isDark ? "rgba(17, 24, 39, 0.96)" : "rgba(255, 255, 255, 0.96)",
          borderRadius: 24,
          paddingVertical: 10,
          paddingHorizontal: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.5 : 0.18,
          shadowRadius: 20,
          elevation: 10,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        },
        navItem: {
          alignItems: "center",
          justifyContent: "center",
          width: 56,
          height: 44,
          borderRadius: 14,
          gap: 3,
        },
        navItemActive: {
          backgroundColor: isDark ? "rgba(250, 204, 21, 0.15)" : "rgba(250, 204, 21, 0.1)",
        },
        navLabel: {
          fontSize: 10,
          fontWeight: "600",
          color: colors.textMuted,
        },
        navLabelActive: {
          color: colors.primary,
        },
      }),
    [colors, isDark, insets],
  );

  return (
    <View style={s.screen}>
      {/* ─── Full-Screen Map ──────────────────────────────────── */}
      <AppMap
        region={{
          latitude,
          longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        }}
        autoCenterOnLocation={hasFix}
        showCenterButton
        centerButtonInset={{ bottom: MAP_SHEET_CENTER_INSET + 80, right: 16 }}
      />

      {/* ─── Top Bar: Logo + Avatar ───────────────────────────── */}
      <View style={s.topBar} pointerEvents="box-none">
        <View style={s.logo}>
          <View style={s.logoMark}>
            <Text style={s.logoMarkText}>O</Text>
          </View>
          <Text style={s.logoWordmark}>OkadaGo</Text>
        </View>
        <Pressable
          style={s.avatarBtn}
          onPress={() => router.push("/(main)/profile")}
          accessibilityRole="button"
          accessibilityLabel="Profile"
        >
          <Text style={s.avatarInitial}>{userInitial}</Text>
        </Pressable>
      </View>

      {/* ─── Active Trip Banner ───────────────────────────────── */}
      {(activeRide || activeDelivery) && (
        <View style={s.activeTripWrap} pointerEvents="box-none">
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Pressable
              style={s.activeTrip}
              onPress={() =>
                router.push({
                  pathname: "/ride/track/[id]",
                  params: {
                    id: (activeRide ?? activeDelivery)!.id,
                    kind: activeRide ? "ride" : "delivery",
                  },
                })
              }
            >
              <View style={s.activeDot} />
              <View style={{ flex: 1 }}>
                <Text style={s.activeLabel}>{t("home.activeTripLabel")}</Text>
                <Text style={s.activeValue} numberOfLines={1}>
                  {activeRide?.destinationAddress ?? activeDelivery?.dropoffAddress}
                </Text>
              </View>
              <Text style={s.activeArrow}>›</Text>
            </Pressable>
          </Animated.View>
        </View>
      )}

      {/* ─── Floating Search Card ─────────────────────────────── */}
      {!activeRide && !activeDelivery && (
        <View style={s.searchCard}>
          <View style={s.searchCardInner}>
            {/* Pickup */}
            <View style={s.pickupRow}>
              <View style={s.pickupDot} />
              <Text style={s.pickupText} numberOfLines={1}>
                {hasFix ? "Current location" : locationLoading ? "Finding location..." : "Accra, Ghana"}
              </Text>
              <Text style={s.pickupLabel}>Pickup</Text>
            </View>

            {/* Route indicator */}
            <View style={s.routeLine}>
              <View style={s.routeDash} />
              <View style={[s.routeDash, { height: 6, marginTop: 2 }]} />
              <View style={[s.routeDash, { height: 4, marginTop: 2 }]} />
            </View>

            {/* Destination field */}
            <Pressable
              style={s.destField}
              onPress={() => setSearchOpen(true)}
              accessibilityRole="search"
              accessibilityLabel="Search destination"
            >
              <View style={s.destIcon} />
              <Text style={s.destText}>Where are you going?</Text>
              <Search size={18} color={colors.textMuted} />
            </Pressable>

            {/* Quick actions */}
            <View style={s.quickActions}>
              <Pressable
                style={[s.quickAction, s.quickActionActive]}
                onPress={() => handleQuickAction("ride")}
              >
                <Navigation size={13} color={colors.primary} />
                <Text style={[s.quickActionText, s.quickActionTextActive]}>Go Now</Text>
              </Pressable>
              <Pressable
                style={s.quickAction}
                onPress={() => handleQuickAction("send")}
              >
                <Package size={13} color={colors.textMuted} />
                <Text style={s.quickActionText}>Send</Text>
              </Pressable>
              <Pressable
                style={s.quickAction}
                onPress={() => router.push({ pathname: "/ride/book", params: { mode: "ride", schedule: "true" } })}
              >
                <Clock size={13} color={colors.textMuted} />
                <Text style={s.quickActionText}>Schedule</Text>
              </Pressable>
              <Pressable
                style={s.quickAction}
                onPress={() => setSearchOpen(true)}
              >
                <Home size={13} color={colors.textMuted} />
                <Text style={s.quickActionText}>Saved</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* ─── Floating Navigation Dock ─────────────────────────── */}
      <View style={s.navDock}>
        <View style={s.navDockInner}>
          <Pressable style={[s.navItem, s.navItemActive]} accessibilityLabel="Home">
            <Home size={20} color={colors.primary} />
            <Text style={[s.navLabel, s.navLabelActive]}>Home</Text>
          </Pressable>
          <Pressable
            style={s.navItem}
            onPress={() => router.push("/(main)/trips")}
            accessibilityLabel="Trips"
          >
            <Clock size={20} color={colors.textMuted} />
            <Text style={s.navLabel}>Trips</Text>
          </Pressable>
          <Pressable
            style={s.navItem}
            onPress={() => router.push("/(main)/wallet")}
            accessibilityLabel="Wallet"
          >
            <CreditCard size={20} color={colors.textMuted} />
            <Text style={s.navLabel}>Wallet</Text>
          </Pressable>
          <Pressable
            style={s.navItem}
            onPress={() => router.push("/(main)/gopoints")}
            accessibilityLabel="GoPoints"
          >
            <Star size={20} color={colors.textMuted} />
            <Text style={s.navLabel}>Points</Text>
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

      {/* ─── Destination Search Sheet ─────────────────────────── */}
      <DestinationSearchSheet
        visible={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectDestination={handleSelectDestination}
        savedPlaces={savedPlaces}
        onSelectSavedPlace={handleSelectSavedPlace}
        sessionToken={session?.token}
        userLocation={hasFix ? { latitude, longitude } : undefined}
        recentDestinations={recentDestinations}
      />
    </View>
  );
}
