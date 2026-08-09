import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Clock,
  Home,
  MapPin,
  Navigation,
  Package,
  Search,
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
 * OkadaGo Passenger Home Screen
 *
 * Layout:
 * ┌─────────────────────────────────┐
 * │ [Logo]            [Profile]     │ ← Safe area top
 * │─────────────────────────────────│
 * │                                 │
 * │       FULL-SCREEN MAP           │
 * │                                 │
 * │  ┌───────────────────────────┐  │
 * │  │  🔍 Where are you going?  │  │ ← Floating search card
 * │  └───────────────────────────┘  │
 * │  [Go Now] [Delivery] [Schedule] │ ← Compact quick actions
 * │  [Saved Places]                 │
 * │                                 │
 * │                                 │
 * │         [ 🏍️ GO ]              │ ← Primary action (lower)
 * │                                 │
 * │  ┌─────────────────────────┐    │
 * │  │ 🏠  📦  📍  👤          │    │ ← Floating nav dock
 * │  └─────────────────────────┘    │
 * └─────────────────────────────────┘
 *
 * Search overlay:
 * - Dimmed backdrop (map visible but darkened)
 * - Pickup + Destination fields with route indicator
 * - Grouped cards: Recent, Saved, Autocomplete suggestions
 * - Keyboard-aware layout
 */
export default function HomeScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { session, activeRide, activeDelivery } = useApp();
  const { colors, isDark } = useTheme();
  const { latitude, longitude, hasFix } = useUserLocation();
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [recentDestinations, setRecentDestinations] = useState<
    Array<{ address: string; latitude: number; longitude: number; label?: string }>
  >([]);

  useEffect(() => {
    if (!session?.token) return;
    api<SavedPlace[]>("/places/saved", { token: session.token })
      .then(setSavedPlaces)
      .catch(() => setSavedPlaces([]));
  }, [session?.token]);

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
      // Add to recent destinations
      setRecentDestinations((prev) => {
        const filtered = prev.filter(
          (r) => !(r.latitude === dest.latitude && r.longitude === dest.longitude),
        );
        return [dest, ...filtered].slice(0, 8);
      });
      // Navigate to booking
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

  const s = useMemo(
    () =>
      StyleSheet.create({
        screen: {
          flex: 1,
          backgroundColor: colors.bg,
        },

        /* ─── Top Bar ──────────────────────────────────────────── */
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
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
        },
        logoText: {
          fontSize: 16,
          fontWeight: "700",
          color: colors.text,
          letterSpacing: -0.3,
        },
        profileBtn: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1.5,
          borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)",
        },

        /* ─── Active Trip Banner ────────────────────────────────── */
        activeTripWrap: {
          position: "absolute",
          top: insets.top + 60,
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

        /* ─── Floating Search Card ──────────────────────────────── */
        searchCard: {
          position: "absolute",
          top: insets.top + 60,
          left: 16,
          right: 16,
          zIndex: 15,
        },
        searchCardInner: {
          backgroundColor: isDark ? "rgba(17, 24, 39, 0.95)" : "rgba(255, 255, 255, 0.95)",
          borderRadius: 20,
          padding: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.4 : 0.15,
          shadowRadius: 16,
          elevation: 8,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        },
        searchField: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          borderRadius: 14,
          paddingHorizontal: 16,
          paddingVertical: 14,
        },
        searchIcon: {
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
        },
        searchText: {
          flex: 1,
          fontSize: 16,
          fontWeight: "500",
          color: colors.textMuted,
        },

        /* ─── Quick Actions Row ─────────────────────────────────── */
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
          gap: 6,
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

        /* ─── Primary Go Button ─────────────────────────────────── */
        goButtonWrap: {
          position: "absolute",
          bottom: insets.bottom + 100,
          left: 0,
          right: 0,
          alignItems: "center",
          zIndex: 15,
        },
        goButton: {
          width: 120,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.primary,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
          elevation: 8,
        },
        goButtonText: {
          fontSize: 18,
          fontWeight: "700",
          color: colors.textOnPrimary,
          letterSpacing: 0.5,
        },

        /* ─── Floating Nav Dock ─────────────────────────────────── */
        navDock: {
          position: "absolute",
          bottom: insets.bottom + 16,
          left: 16,
          right: 16,
          zIndex: 20,
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
          shadowOpacity: isDark ? 0.4 : 0.15,
          shadowRadius: 16,
          elevation: 8,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        },
        navItem: {
          alignItems: "center",
          justifyContent: "center",
          width: 48,
          height: 48,
          borderRadius: 24,
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
          color: colors.primary,
        },
      }),
    [colors, isDark, insets],
  );

  return (
    <View style={s.screen}>
      {/* ─── Full-Screen Map ────────────────────────────────────── */}
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

      {/* ─── Top Bar: Logo + Profile ───────────────────────────── */}
      <View style={s.topBar} pointerEvents="box-none">
        <View style={s.logo}>
          <View style={s.logoMark}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.textOnPrimary }}>O</Text>
          </View>
          <Text style={s.logoText}>OkadaGo</Text>
        </View>
        <Pressable
          style={s.profileBtn}
          onPress={() => router.push("/(main)/profile")}
          accessibilityRole="button"
          accessibilityLabel="Profile"
        >
          <User size={20} color={colors.text} />
        </Pressable>
      </View>

      {/* ─── Active Trip Banner ─────────────────────────────────── */}
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

      {/* ─── Floating Search Card ───────────────────────────────── */}
      {!activeRide && !activeDelivery && (
        <View style={s.searchCard}>
          <View style={s.searchCardInner}>
            <Pressable
              style={s.searchField}
              onPress={() => setSearchOpen(true)}
              accessibilityRole="search"
              accessibilityLabel="Search destination"
            >
              <View style={s.searchIcon}>
                <Search size={14} color={colors.textOnPrimary} />
              </View>
              <Text style={s.searchText}>Where are you going?</Text>
            </Pressable>

            {/* ─── Quick Actions ──────────────────────────────── */}
            <View style={s.quickActions}>
              <Pressable
                style={[s.quickAction, s.quickActionActive]}
                onPress={() => handleQuickAction("ride")}
              >
                <Navigation size={14} color={colors.primary} />
                <Text style={[s.quickActionText, s.quickActionTextActive]}>Go Now</Text>
              </Pressable>
              <Pressable
                style={s.quickAction}
                onPress={() => handleQuickAction("send")}
              >
                <Package size={14} color={colors.textMuted} />
                <Text style={s.quickActionText}>Delivery</Text>
              </Pressable>
              <Pressable
                style={s.quickAction}
                onPress={() => router.push({ pathname: "/ride/book", params: { mode: "ride", schedule: "true" } })}
              >
                <Clock size={14} color={colors.textMuted} />
                <Text style={s.quickActionText}>Schedule</Text>
              </Pressable>
              <Pressable
                style={s.quickAction}
                onPress={() => setSearchOpen(true)}
              >
                <Home size={14} color={colors.textMuted} />
                <Text style={s.quickActionText}>Saved</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* ─── Primary Go Button (Lower Portion) ──────────────────── */}
      {!activeRide && !activeDelivery && (
        <View style={s.goButtonWrap}>
          <Pressable
            style={s.goButton}
            onPress={() => setSearchOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Go"
          >
            <Text style={s.goButtonText}>GO</Text>
          </Pressable>
        </View>
      )}

      {/* ─── Floating Navigation Dock ───────────────────────────── */}
      <View style={s.navDock}>
        <View style={s.navDockInner}>
          <Pressable style={[s.navItem, s.navItemActive]} accessibilityLabel="Home">
            <Home size={22} color={colors.primary} />
            <Text style={[s.navLabel, s.navLabelActive]}>Home</Text>
          </Pressable>
          <Pressable
            style={s.navItem}
            onPress={() => router.push("/(main)/trips")}
            accessibilityLabel="Orders"
          >
            <Package size={22} color={colors.textMuted} />
            <Text style={s.navLabel}>Orders</Text>
          </Pressable>
          <Pressable
            style={s.navItem}
            onPress={() => router.push("/notifications")}
            accessibilityLabel="Notifications"
          >
            <MapPin size={22} color={colors.textMuted} />
            <Text style={s.navLabel}>Activity</Text>
          </Pressable>
          <Pressable
            style={s.navItem}
            onPress={() => router.push("/(main)/profile")}
            accessibilityLabel="Profile"
          >
            <User size={22} color={colors.textMuted} />
            <Text style={s.navLabel}>Profile</Text>
          </Pressable>
        </View>
      </View>

      {/* ─── Destination Search Sheet ───────────────────────────── */}
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
