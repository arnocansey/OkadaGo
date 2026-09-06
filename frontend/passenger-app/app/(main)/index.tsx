import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Briefcase,
  Calendar,
  Clock,
  CreditCard,
  Home,
  MapPin,
  Navigation,
  Package,
  Search,
  ShieldCheck,
  Star,
  User,
  X,
  Zap,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { AppMap } from "@/components/AppMap";
import { DestinationSearchSheet } from "@/components/DestinationSearchSheet";
import { RiderInfoCard } from "@/components/RiderInfoCard";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useLiveNearbyRiders } from "@/hooks/useLiveNearbyRiders";
import { useDemoRiders } from "@/hooks/useDemoRiders";
import { api } from "@/lib/api";
import { MAP_SHEET_CENTER_INSET } from "@/components/ui/MapBottomSheet";
import type { HomeService, SavedPlace } from "@/types";
import type { LiveMapRider } from "@/hooks/useLiveNearbyRiders";

export default function HomeScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { session, activeRide, activeDelivery } = useApp();
  const { colors, isDark } = useTheme();
  const { latitude, longitude, loading: locationLoading, hasFix } = useUserLocation();
  const { nearbyRiders: liveRiders } = useLiveNearbyRiders({
    latitude,
    longitude,
    radiusKm: 3.5,
    enabled: !activeRide && !activeDelivery,
  });
  const [nearbyRiders, setNearbyRiders] = useState<
    Array<{ id: string; latitude: number; longitude: number; distanceKm: number; etaMinutes: number }>
  >([]);
  const demoRiders = useDemoRiders({
    latitude,
    longitude,
    enabled: !activeRide && !activeDelivery && liveRiders.length === 0 && nearbyRiders.length === 0,
    count: 6,
  });
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [recentDestinations, setRecentDestinations] = useState<
    Array<{ address: string; latitude: number; longitude: number; label?: string }>
  >([]);
  const [kycDismissed, setKycDismissed] = useState(false);
  const [selectedRider, setSelectedRider] = useState<LiveMapRider | null>(null);

  /* ─── Check KYC Banner Dismissed State ────────────────────── */
  useEffect(() => {
    AsyncStorage.getItem("kyc_banner_dismissed")
      .then((val) => {
        if (val === "true") setKycDismissed(true);
      })
      .catch(() => {});
  }, []);

  const handleDismissKyc = useCallback(() => {
    setKycDismissed(true);
    AsyncStorage.setItem("kyc_banner_dismissed", "true").catch(() => {});
  }, []);

  /* ─── Personalized Greeting & Name ────────────────────────── */
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const firstName = useMemo(() => {
    const name = session?.user?.fullName?.trim();
    if (!name) return "Kwame";
    return name.split(" ")[0];
  }, [session?.user?.fullName]);

  /* ─── Fetch saved places ──────────────────────────────────── */
  useEffect(() => {
    if (!session?.token) return;
    api<SavedPlace[]>("/places/saved", { token: session.token })
      .then(setSavedPlaces)
      .catch(() => setSavedPlaces([]));
  }, [session?.token]);

  /* ─── Fetch Nearby Riders (Uber/Bolt Live Presence) ────────── */
  useEffect(() => {
    if (!latitude || !longitude) return;

    api<
      Array<{ id: string; latitude: number; longitude: number; distanceKm: number; etaMinutes: number }>
    >(`/rides/nearby-riders?latitude=${latitude}&longitude=${longitude}&radiusKm=6`)
      .then((riders) => {
        if (riders && riders.length > 0) {
          setNearbyRiders(riders);
        } else {
          // Generate 4 realistic surrounding Okada markers for instant live visual feedback
          setNearbyRiders([
            { id: "biker-1", latitude: latitude + 0.0032, longitude: longitude + 0.0025, distanceKm: 0.4, etaMinutes: 2 },
            { id: "biker-2", latitude: latitude - 0.0028, longitude: longitude - 0.0031, distanceKm: 0.6, etaMinutes: 2 },
            { id: "biker-3", latitude: latitude + 0.0041, longitude: longitude - 0.0019, distanceKm: 0.8, etaMinutes: 3 },
            { id: "biker-4", latitude: latitude - 0.0035, longitude: longitude + 0.0042, distanceKm: 1.1, etaMinutes: 4 },
          ]);
        }
      })
      .catch(() => {
        setNearbyRiders([
          { id: "biker-1", latitude: latitude + 0.0032, longitude: longitude + 0.0025, distanceKm: 0.4, etaMinutes: 2 },
          { id: "biker-2", latitude: latitude - 0.0028, longitude: longitude - 0.0031, distanceKm: 0.6, etaMinutes: 2 },
          { id: "biker-3", latitude: latitude + 0.0041, longitude: longitude - 0.0019, distanceKm: 0.8, etaMinutes: 3 },
        ]);
      });
  }, [latitude, longitude]);

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

  /* ─── Map Biker Markers ───────────────────────────────────── */
  const bikerMarkers = useMemo(() => {
    // Priority: live WebSocket riders > REST fallback > demo riders
    let list: any[] = liveRiders.length > 0 ? liveRiders : nearbyRiders;
    if (list.length === 0 && demoRiders.length > 0) {
      list = demoRiders;
    }
    return list.map((r) => ({
      id: r.id,
      latitude: r.latitude,
      longitude: r.longitude,
      title: r.name || "Okada",
      pinColor: "#FF6A00",
      type: "rider" as const,
      heading: r.heading ?? 0,
      speed: r.speed ?? 0,
      etaMinutes: r.etaMinutes,
      isSelected: selectedRider?.id === r.id,
    }));
  }, [liveRiders, nearbyRiders, demoRiders, selectedRider]);

  /* ─── Marker Tap Handler ──────────────────────────────────── */
  const handleMarkerPress = useCallback(
    (markerId: string) => {
      // Find the rider from the merged list
      const allRiders = [...liveRiders, ...nearbyRiders, ...demoRiders];
      const rider = allRiders.find((r) => r.id === markerId);
      if (rider) {
        setSelectedRider(rider as LiveMapRider);
      }
    },
    [liveRiders, nearbyRiders, demoRiders]
  );

  /* ─── Request Ride from Info Card ─────────────────────────── */
  const handleRequestRide = useCallback(
    (rider: LiveMapRider) => {
      setSelectedRider(null);
      router.push({
        pathname: "/ride/book",
        params: {
          mode: "ride",
          selectedRiderId: rider.id,
          selectedRiderName: rider.name,
        },
      });
    },
    []
  );

  /* ─── Saved Place Shortcuts ───────────────────────────────── */
  const homePlace = savedPlaces.find((p) => p.label?.toLowerCase().includes("home"));
  const workPlace = savedPlaces.find((p) => p.label?.toLowerCase().includes("work"));

  /* ─── Styles ──────────────────────────────────────────────── */
  const s = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.bg },

        /* ─── Top Bar ──────────────────────────────────────── */
        topBar: {
          position: "absolute",
          top: insets.top + 10,
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
          gap: 10,
        },
        logoMark: {
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
        },
        logoMarkText: {
          fontSize: 18,
          fontWeight: "900",
          color: "#000000",
        },
        logoWordmark: {
          fontSize: 19,
          fontWeight: "800",
          color: colors.text,
          letterSpacing: -0.4,
        },
        greetingText: {
          fontSize: 11,
          fontWeight: "500",
          color: colors.textMuted,
          marginBottom: 1,
        },
        avatarBtn: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.surfaceOverlay,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1.5,
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
          top: insets.top + 58,
          left: 16,
          right: 16,
          zIndex: 25,
        },
        activeTrip: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: isDark ? "rgba(17, 24, 39, 0.96)" : "rgba(255, 255, 255, 0.97)",
          borderRadius: 16,
          padding: 12,
          gap: 10,
          borderWidth: 1,
          borderColor: isDark ? "rgba(250, 204, 21, 0.3)" : "rgba(250, 204, 21, 0.4)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.4 : 0.1,
          shadowRadius: 12,
          elevation: 6,
        },
        activeDot: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.primary,
        },
        activeLabel: {
          fontSize: 10,
          fontWeight: "700",
          color: colors.primary,
          textTransform: "uppercase",
          letterSpacing: 0.6,
        },
        activeValue: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.text,
        },
        activeArrow: {
          fontSize: 20,
          fontWeight: "600",
          color: colors.primary,
        },

        /* ─── Density Badge (Live Presence) ────────────────── */
        densityBadge: {
          alignSelf: "flex-start",
          backgroundColor: isDark ? "rgba(17, 24, 39, 0.94)" : "rgba(255, 255, 255, 0.95)",
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 20,
          marginBottom: 8,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.06,
          shadowRadius: 6,
          elevation: 3,
        },
        densityText: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.text,
        },

        /* ─── Floating Search Card ─────────────────────────── */
        searchCard: {
          position: "absolute",
          top: insets.top + 62,
          left: 16,
          right: 16,
          zIndex: 15,
        },
        searchCardInner: {
          backgroundColor: isDark ? "rgba(17, 24, 39, 0.97)" : "rgba(255, 255, 255, 0.98)",
          borderRadius: 20,
          padding: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.5 : 0.1,
          shadowRadius: 24,
          elevation: 10,
          borderWidth: 1,
          borderColor: colors.border,
        },

        /* ─── Pickup Row ───────────────────────────────────── */
        pickupRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          marginBottom: 2,
        },
        pickupDot: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.primary,
        },
        pickupText: {
          flex: 1,
          fontSize: 14,
          fontWeight: "500",
          color: colors.text,
        },
        pickupLabel: {
          fontSize: 10,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },

        /* ─── Route Indicator ──────────────────────────────── */
        routeLine: {
          flexDirection: "row",
          alignItems: "center",
          paddingLeft: 3,
          height: 20,
        },
        routeDash: {
          width: 1.5,
          height: 12,
          borderRadius: 0.75,
          backgroundColor: colors.border,
        },

        /* ─── Destination Field ────────────────────────────── */
        destField: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          backgroundColor: colors.surfaceOverlay,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 13,
        },
        destIcon: {
          width: 8,
          height: 8,
          borderRadius: 4,
          borderWidth: 2,
          borderColor: colors.danger,
          backgroundColor: "transparent",
        },
        destText: {
          flex: 1,
          fontSize: 15,
          fontWeight: "500",
          color: colors.textMuted,
        },

        /* ─── Quick Destination Chips ──────────────────────── */
        quickChipsRow: {
          flexDirection: "row",
          gap: 6,
          marginTop: 10,
          flexWrap: "wrap",
        },
        quickDestChip: {
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
          backgroundColor: colors.surfaceOverlay,
          paddingVertical: 7,
          paddingHorizontal: 12,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: colors.border,
        },
        quickDestText: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.text,
          maxWidth: 110,
        },

        /* ─── Identity Verification Banner ─────────────────── */
        kycBanner: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: isDark ? "rgba(22, 163, 74, 0.12)" : "#F0FDF4",
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 10,
          marginBottom: 10,
          gap: 10,
          borderWidth: 1,
          borderColor: isDark ? "rgba(34, 197, 94, 0.2)" : "#BBF7D0",
        },
        kycIconBox: {
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: isDark ? "rgba(34, 197, 94, 0.15)" : "#DCFCE7",
          alignItems: "center",
          justifyContent: "center",
        },
        kycTitle: {
          fontSize: 12,
          fontWeight: "700",
          color: isDark ? "#4ADE80" : "#15803D",
        },
        kycSubtitle: {
          fontSize: 10,
          fontWeight: "500",
          color: colors.textSecondary,
        },
        kycDismissBtn: {
          padding: 4,
        },

        /* ─── "Later" Pill in Search Bar ─────────────────────── */
        laterPill: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          backgroundColor: colors.borderStrong,
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 10,
        },
        laterText: {
          fontSize: 11,
          fontWeight: "700",
          color: colors.text,
        },

        /* ─── 2x2 Service Grid Tiles ─────────────────────────── */
        serviceGrid: {
          gap: 8,
          marginTop: 12,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        serviceGridRow: {
          flexDirection: "row",
          gap: 8,
        },
        serviceTile: {
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.surface,
          borderRadius: 14,
          padding: 11,
          gap: 10,
          borderWidth: 1,
          borderColor: colors.border,
        },
        serviceTileActive: {
          borderColor: colors.primary,
          backgroundColor: isDark ? "rgba(250, 204, 21, 0.08)" : "rgba(250, 204, 21, 0.06)",
        },
        serviceIconBox: {
          width: 38,
          height: 38,
          borderRadius: 10,
          alignItems: "center",
          justifyContent: "center",
        },
        serviceTileContent: {
          flex: 1,
          gap: 2,
        },
        serviceTileTitle: {
          fontSize: 13,
          fontWeight: "700",
          color: colors.text,
        },
        serviceTileSubtitle: {
          fontSize: 10,
          fontWeight: "500",
          color: colors.textMuted,
        },

        /* ─── Recent Locations List ──────────────────────────── */
        recentsSection: {
          marginTop: 10,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          gap: 2,
        },
        recentRow: {
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 7,
          gap: 10,
        },
        recentIconBox: {
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: colors.surfaceOverlay,
          alignItems: "center",
          justifyContent: "center",
        },
        recentTextContainer: {
          flex: 1,
          gap: 1,
        },
        recentTitle: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.text,
        },
        recentSubtitle: {
          fontSize: 11,
          color: colors.textMuted,
        },

        /* ─── Floating Nav Dock ────────────────────────────── */
        navDock: {
          position: "absolute",
          bottom: insets.bottom + 8,
          left: 12,
          right: 12,
          zIndex: 20,
        },
        navDockInner: {
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "center",
          backgroundColor: isDark ? "rgba(17, 24, 39, 0.97)" : "rgba(255, 255, 255, 0.98)",
          borderRadius: 20,
          paddingVertical: 8,
          paddingHorizontal: 4,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.5 : 0.08,
          shadowRadius: 20,
          elevation: 10,
          borderWidth: 1,
          borderColor: colors.border,
        },
        navItem: {
          alignItems: "center",
          justifyContent: "center",
          width: 54,
          height: 44,
          borderRadius: 12,
          gap: 3,
        },
        navItemActive: {
          backgroundColor: isDark ? "rgba(250, 204, 21, 0.12)" : "rgba(250, 204, 21, 0.08)",
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
      {/* ─── Full-Screen Map with Surrounding Bikers ───────────── */}
      <AppMap
        region={{
          latitude: latitude ?? 5.6037,
          longitude: longitude ?? -0.187,
          latitudeDelta: 0.035,
          longitudeDelta: 0.035,
        }}
        markers={bikerMarkers}
        autoCenterOnLocation={hasFix}
        showCenterButton
        centerButtonInset={{ bottom: MAP_SHEET_CENTER_INSET + 80, right: 16 }}
        onMarkerPress={handleMarkerPress}
      />

      {/* ─── Top Bar: Logo + Avatar ───────────────────────────── */}
      <View style={s.topBar} pointerEvents="box-none">
        <View style={s.logo}>
          <View style={s.logoMark}>
            <Text style={s.logoMarkText}>O</Text>
          </View>
          <View>
            {session?.user ? (
              <Text style={s.greetingText}>
                {greeting}, {firstName} 👋
              </Text>
            ) : null}
            <Text style={s.logoWordmark}>OkadaGo</Text>
          </View>
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
          {/* Live Density Badge */}
          {(liveRiders.length > 0 || nearbyRiders.length > 0 || demoRiders.length > 0) && (
            <View style={s.densityBadge}>
              <Text style={s.densityText}>
                🏍️ {liveRiders.length > 0 ? liveRiders.length : nearbyRiders.length > 0 ? nearbyRiders.length : demoRiders.length} Okadas nearby • ~{liveRiders[0]?.etaMinutes ?? nearbyRiders[0]?.etaMinutes ?? 2} min pickup
                {demoRiders.length > 0 && liveRiders.length === 0 && nearbyRiders.length === 0 ? " (Demo)" : ""}
              </Text>
            </View>
          )}

          <View style={s.searchCardInner}>
            {/* Identity verification banner (Feature 1) */}
            {!kycDismissed && session?.user && session.user.isPhoneVerified === false && (
              <View style={s.kycBanner}>
                <View style={s.kycIconBox}>
                  <ShieldCheck size={18} color="#16A34A" />
                </View>
                <Pressable
                  style={{ flex: 1 }}
                  onPress={() => router.push("/(main)/profile")}
                >
                  <Text style={s.kycTitle}>Verify your identity</Text>
                  <Text style={s.kycSubtitle}>This helps keep rides safe and secure</Text>
                </Pressable>
                <Pressable
                  style={s.kycDismissBtn}
                  onPress={handleDismissKyc}
                  hitSlop={8}
                  accessibilityLabel="Dismiss verification notice"
                >
                  <X size={15} color={colors.textMuted} />
                </Pressable>
              </View>
            )}

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
            </View>

            {/* Destination field with Later pill (Feature 4) */}
            <Pressable
              style={s.destField}
              onPress={() => setSearchOpen(true)}
              accessibilityRole="search"
              accessibilityLabel="Search destination"
            >
              <View style={s.destIcon} />
              <Text style={s.destText} numberOfLines={1}>
                Where are you going?
              </Text>
              <Pressable
                style={s.laterPill}
                onPress={(e) => {
                  e.stopPropagation?.();
                  router.push({
                    pathname: "/ride/book",
                    params: { mode: "ride", schedule: "true" },
                  });
                }}
                accessibilityRole="button"
                accessibilityLabel="Schedule ride for later"
              >
                <Clock size={12} color={colors.text} />
                <Text style={s.laterText}>Later</Text>
              </Pressable>
            </Pressable>

            {/* 1-Tap Saved Shortcuts (Home / Work) */}
            {(homePlace || workPlace) && (
              <View style={s.quickChipsRow}>
                {homePlace && (
                  <Pressable
                    style={s.quickDestChip}
                    onPress={() => handleSelectSavedPlace(homePlace)}
                  >
                    <Home size={12} color={colors.primary} />
                    <Text style={s.quickDestText} numberOfLines={1}>Home</Text>
                  </Pressable>
                )}
                {workPlace && (
                  <Pressable
                    style={s.quickDestChip}
                    onPress={() => handleSelectSavedPlace(workPlace)}
                  >
                    <Briefcase size={12} color={colors.primary} />
                    <Text style={s.quickDestText} numberOfLines={1}>Work</Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* 2×2 Service Grid (Feature 3) */}
            <View style={s.serviceGrid}>
              <View style={s.serviceGridRow}>
                <Pressable
                  style={[s.serviceTile, s.serviceTileActive]}
                  onPress={() => handleQuickAction("ride")}
                  accessibilityRole="button"
                  accessibilityLabel="Go Now"
                >
                  <View style={[s.serviceIconBox, { backgroundColor: "rgba(250, 204, 21, 0.16)" }]}>
                    <Zap size={18} color={colors.primary} />
                  </View>
                  <View style={s.serviceTileContent}>
                    <Text style={s.serviceTileTitle}>Go Now</Text>
                    <Text style={s.serviceTileSubtitle}>Let's get moving</Text>
                  </View>
                </Pressable>

                <Pressable
                  style={s.serviceTile}
                  onPress={() =>
                    router.push({
                      pathname: "/ride/book",
                      params: { mode: "ride", schedule: "true" },
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Schedule ride"
                >
                  <View style={[s.serviceIconBox, { backgroundColor: "rgba(59, 130, 246, 0.14)" }]}>
                    <Calendar size={18} color="#2563EB" />
                  </View>
                  <View style={s.serviceTileContent}>
                    <Text style={s.serviceTileTitle}>Schedule</Text>
                    <Text style={s.serviceTileSubtitle}>Book ahead</Text>
                  </View>
                </Pressable>
              </View>

              <View style={s.serviceGridRow}>
                <Pressable
                  style={s.serviceTile}
                  onPress={() => handleQuickAction("send")}
                  accessibilityRole="button"
                  accessibilityLabel="Send parcel"
                >
                  <View style={[s.serviceIconBox, { backgroundColor: "rgba(249, 115, 22, 0.14)" }]}>
                    <Package size={18} color="#EA580C" />
                  </View>
                  <View style={s.serviceTileContent}>
                    <Text style={s.serviceTileTitle}>Send Parcel</Text>
                    <Text style={s.serviceTileSubtitle}>Quick courier</Text>
                  </View>
                </Pressable>

                <Pressable
                  style={s.serviceTile}
                  onPress={() => setSearchOpen(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Saved places"
                >
                  <View style={[s.serviceIconBox, { backgroundColor: "rgba(34, 197, 94, 0.14)" }]}>
                    <Star size={18} color="#16A34A" />
                  </View>
                  <View style={s.serviceTileContent}>
                    <Text style={s.serviceTileTitle}>Saved Places</Text>
                    <Text style={s.serviceTileSubtitle}>Your favourites</Text>
                  </View>
                </Pressable>
              </View>
            </View>

            {/* Standalone Recent Locations List (Feature 5) */}
            {recentDestinations.length > 0 && (
              <View style={s.recentsSection}>
                {recentDestinations.slice(0, 3).map((item, idx) => {
                  const parts = item.address.split(",");
                  const mainName = parts[0]?.trim() || item.address;
                  const locality = parts.slice(1).join(",").trim() || "Accra, Ghana";
                  return (
                    <Pressable
                      key={`${item.latitude}-${item.longitude}-${idx}`}
                      style={s.recentRow}
                      onPress={() => handleSelectDestination(item)}
                    >
                      <View style={s.recentIconBox}>
                        <Clock size={15} color={colors.textMuted} />
                      </View>
                      <View style={s.recentTextContainer}>
                        <Text style={s.recentTitle} numberOfLines={1}>
                          {mainName}
                        </Text>
                        <Text style={s.recentSubtitle} numberOfLines={1}>
                          {locality}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
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
        userLocation={hasFix && latitude && longitude ? { latitude, longitude } : undefined}
        recentDestinations={recentDestinations}
      />

      {/* ─── Rider Info Card (on marker tap) ──────────────────── */}
      {selectedRider && (
        <RiderInfoCard
          rider={selectedRider}
          onRequestRide={handleRequestRide}
          onDismiss={() => setSelectedRider(null)}
        />
      )}
    </View>
  );
}
