import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Home, MapPin, Package, Search, UtensilsCrossed } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { AppMap } from "@/components/AppMap";
import { Avatar } from "@/components/ui/Avatar";
import { MapBottomSheet, MAP_SHEET_CENTER_INSET } from "@/components/ui/MapBottomSheet";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { useUserLocation } from "@/hooks/useUserLocation";
import { api } from "@/lib/api";
import { radius, shadows, spacing } from "@/theme/tokens";
import type { HomeService, SavedPlace } from "@/types";

const SERVICES: Array<{ id: HomeService; labelKey: string; icon: typeof Search }> = [
  { id: "ride", labelKey: "home.serviceRide", icon: MapPin },
  { id: "food", labelKey: "home.serviceFood", icon: UtensilsCrossed },
  { id: "send", labelKey: "home.serviceSend", icon: Package },
];

export default function HomeScreen() {
  const { t } = useTranslation();
  const { session, activeRide, activeDelivery } = useApp();
  const { colors, typography, isDark } = useTheme();
  const { latitude, longitude } = useUserLocation();
  const [service, setService] = useState<HomeService>("ride");
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);

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

  useEffect(() => {
    if (!session?.token) return;
    api<SavedPlace[]>("/places/saved", { token: session.token })
      .then(setSavedPlaces)
      .catch(() => setSavedPlaces([]));
  }, [session?.token]);

  function openService(placeId?: string) {
    if (service === "food") {
      router.push("/food");
      return;
    }
    router.push({
      pathname: "/ride/book",
      params: {
        mode: service === "send" ? "delivery" : "ride",
        ...(placeId ? { placeId } : {}),
      },
    });
  }

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1 },
        overlay: { ...StyleSheet.absoluteFillObject, justifyContent: "space-between" },
        topBarWrap: {
          marginHorizontal: spacing.lg,
          marginTop: spacing.sm,
          backgroundColor: isDark ? "rgba(28,28,30,0.92)" : "rgba(255,255,255,0.92)",
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
          ...shadows.md,
        },
        topBar: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        },
        greeting: { ...typography.h3, color: colors.text },
        sub: { ...typography.caption, color: colors.textSecondary },
        activeTripWrap: { marginHorizontal: spacing.lg },
        activeTrip: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          backgroundColor: colors.primary,
          borderRadius: radius.lg,
          padding: spacing.lg,
          ...shadows.md,
        },
        activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.textOnPrimary },
        activeLabel: { ...typography.label, color: colors.textOnPrimary },
        activeValue: { ...typography.bodySemibold, color: colors.textOnPrimary, marginTop: 2 },
        activeArrow: { fontSize: 22, color: colors.textOnPrimary, fontWeight: "300" },
        serviceTabs: { flexDirection: "row", gap: spacing.sm },
        serviceTab: {
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
          paddingVertical: spacing.md,
          borderRadius: radius.md,
          backgroundColor: colors.surface,
        },
        serviceTabActive: {
          backgroundColor: colors.primaryLight,
          borderWidth: 1.5,
          borderColor: colors.primary,
        },
        serviceLabel: { ...typography.captionMedium, color: colors.textMuted },
        serviceLabelActive: { color: colors.primary },
        searchBar: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.lg,
          borderWidth: 1.5,
          borderColor: colors.border,
        },
        searchPlaceholder: { ...typography.body, color: colors.textMuted, flex: 1 },
        savedSection: { gap: spacing.sm },
        savedTitle: { ...typography.captionMedium, color: colors.textMuted },
        savedRow: { flexDirection: "row", gap: spacing.sm },
        savedChip: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.xs,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.md,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        },
        savedLabel: { ...typography.captionMedium, color: colors.text },
      }),
    [colors, typography, isDark],
  );

  return (
    <View style={styles.screen}>
      <AppMap
        region={{
          latitude,
          longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        }}
        autoCenterOnLocation
        showCenterButton
        centerButtonInset={{ bottom: MAP_SHEET_CENTER_INSET, right: spacing.lg }}
      />

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.topBarWrap}>
          <View style={styles.topBar}>
            <View>
              <Text style={styles.greeting}>Hello, {session?.user.fullName.split(" ")[0]} 👋</Text>
              <Text style={styles.sub}>Where to today?</Text>
            </View>
            <Pressable onPress={() => router.push("/(main)/profile")} accessibilityRole="button">
              <Avatar name={session?.user.fullName ?? "A"} size={40} imageUri={session?.user.avatarUrl ?? undefined} />
            </Pressable>
          </View>
        </View>

        {(activeRide || activeDelivery) && (
          <Animated.View style={[styles.activeTripWrap, { transform: [{ scale: pulseAnim }] }]}>
            <Pressable
              style={styles.activeTrip}
              onPress={() =>
                router.push({
                  pathname: "/ride/track/[id]",
                  params: { id: (activeRide ?? activeDelivery)!.id, kind: activeRide ? "ride" : "delivery" },
                })
              }
            >
              <View style={styles.activeDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.activeLabel}>Active trip — tap to track</Text>
                <Text style={styles.activeValue} numberOfLines={1}>
                  {activeRide?.destinationAddress ?? activeDelivery?.dropoffAddress}
                </Text>
              </View>
              <Text style={styles.activeArrow}>›</Text>
            </Pressable>
          </Animated.View>
        )}

        <MapBottomSheet>
          <View style={styles.serviceTabs}>
            {SERVICES.map(({ id, labelKey, icon: Icon }) => (
              <Pressable
                key={id}
                onPress={() => setService(id)}
                style={[styles.serviceTab, service === id && styles.serviceTabActive]}
              >
                <Icon size={18} color={service === id ? colors.primary : colors.textMuted} />
                <Text style={[styles.serviceLabel, service === id && styles.serviceLabelActive]}>{t(labelKey)}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.searchBar} onPress={() => openService()}>
            <Search size={20} color={colors.textMuted} />
            <Text style={styles.searchPlaceholder}>
              {service === "ride" ? "Search destination" : service === "food" ? "Restaurants & groceries" : "Send a package"}
            </Text>
          </Pressable>

          {savedPlaces.length > 0 ? (
            <View style={styles.savedSection}>
              <Text style={styles.savedTitle}>Saved places</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.savedRow}>
                {savedPlaces.map((place) => (
                  <Pressable key={place.id} style={styles.savedChip} onPress={() => openService(place.id)}>
                    <Home size={14} color={colors.primary} />
                    <Text style={styles.savedLabel}>{place.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </MapBottomSheet>
      </SafeAreaView>
    </View>
  );
}
