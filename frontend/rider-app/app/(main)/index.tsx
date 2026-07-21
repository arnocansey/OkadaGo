import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Power, ShieldAlert, TrendingUp } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { AppMap } from "@/components/AppMap";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { useRiderLocation } from "@/hooks/useRiderLocation";
import { useUserLocation } from "@/hooks/useUserLocation";
import { api, money } from "@/lib/api";
import { radius, shadows, spacing } from "@/theme/tokens";

// Avatar background colors hashed from name
const AVATAR_COLORS = ["#FFC107", "#3B82F6", "#A855F7", "#EC4899", "#F59E0B", "#FF3B30"];
function avatarColor(name: string) {
  return AVATAR_COLORS[(name.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
}

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { session, online, toggleOnline, wallets, rides, activeRide, activeDelivery, incomingRide, incomingDelivery, refresh } = useApp();
  const { colors, typography, isDark } = useTheme();
  const { latitude, longitude } = useUserLocation();
  const [sosLoading, setSosLoading] = useState(false);

  // Keeps currentLatitude/currentLongitude (and the PostGIS currentLocation
  // column) fresh while the rider is online but not on a trip. Deliberately
  // omits `activeTrip` — trip/[id].tsx already posts ride-location pings on
  // its own faster interval while a trip is active, so passing it here would
  // double-post to /rides/:id/location.
  useRiderLocation({
    token: session?.token,
    riderProfileId: session?.user.riderProfileId,
    online,
  });

  useEffect(() => {
    const interval = setInterval(() => refresh(), 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    if (incomingRide && online) {
      router.push({ pathname: "/request/[id]", params: { id: incomingRide.id, kind: "ride" } });
    }
  }, [incomingRide?.id, online]);

  useEffect(() => {
    if (incomingDelivery && online) {
      router.push({ pathname: "/request/[id]", params: { id: incomingDelivery.id, kind: "delivery" } });
    }
  }, [incomingDelivery?.id, online]);

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

  const todayEarnings = rides
    .filter((r) => (r.status ?? "").toLowerCase() === "completed")
    .reduce((sum, r) => sum + Number(r.riderEarnings ?? r.finalFare ?? 0), 0);

  const wallet = wallets[0];
  const bgColor = avatarColor(session?.user.fullName ?? "A");

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
        top: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        },
        avatar: {
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
        },
        avatarText: { ...typography.bodySemibold, color: colors.textOnPrimary },
        greeting: { ...typography.h3, color: colors.text },
        sub: { ...typography.caption, color: colors.textSecondary },
        powerBtn: {
          width: 52,
          height: 52,
          borderRadius: 26,
          alignItems: "center",
          justifyContent: "center",
          ...shadows.md,
        },
        powerBtnOff: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
        powerBtnOn: { backgroundColor: colors.success, borderWidth: 2, borderColor: colors.success },
        sosBtn: {
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.danger,
        },
        sheet: {
          backgroundColor: colors.background,
          borderTopLeftRadius: radius.xxl,
          borderTopRightRadius: radius.xxl,
          padding: spacing.xl,
          paddingBottom: spacing.xxxl,
          ...shadows.sheet,
          gap: spacing.lg,
        },
        earningsHero: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.primary,
          borderRadius: radius.lg,
          padding: spacing.lg,
          gap: spacing.lg,
        },
        earningsIcon: {
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: "rgba(255,255,255,0.15)",
          alignItems: "center",
          justifyContent: "center",
        },
        earningsBody: { flex: 1 },
        earningsLabel: { ...typography.caption, color: colors.textOnPrimary },
        earningsValue: { ...typography.h2, color: colors.textOnPrimary, marginTop: 2 },
        statusPill: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full },
        statusOn: { backgroundColor: colors.successLight },
        statusOff: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
        statusText: { ...typography.label },
        statusTextOn: { color: colors.success },
        statusTextOff: { color: colors.textMuted },
        activeCard: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.border,
        },
        activeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
        activeLabel: { ...typography.label, color: colors.textMuted },
        activeValue: { ...typography.bodySemibold, marginTop: 2, color: colors.text },
        activeArrow: { fontSize: 22, color: colors.textMuted, fontWeight: "300" },
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
        centerButtonInset={{ bottom: 240, right: spacing.lg }}
      />

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        {/* Frosted-glass top bar */}
        <View style={styles.topBarWrap}>
          <View style={styles.top}>
            <View style={[styles.avatar, { backgroundColor: bgColor }]}>
              <Text style={styles.avatarText}>{session?.user.fullName[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>{t("drive.hi", { name: session?.user.fullName.split(" ")[0] })}</Text>
              <Text style={styles.sub}>{online ? t("drive.onlineHint") : t("drive.offlineHint")}</Text>
            </View>
            <Pressable
              style={styles.sosBtn}
              disabled={sosLoading}
              onPress={() => void sendSos()}
              accessibilityLabel={t("drive.sendSos")}
              accessibilityRole="button"
            >
              <ShieldAlert size={20} color={colors.danger} />
            </Pressable>
            <Pressable
              style={[styles.powerBtn, online ? styles.powerBtnOn : styles.powerBtnOff]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                toggleOnline();
              }}
            >
              <Power size={22} color={online ? colors.textOnPrimary : colors.text} />
            </Pressable>
          </View>
        </View>

        {/* Bottom sheet */}
        <View style={styles.sheet}>
          <View style={styles.earningsHero}>
            <View style={styles.earningsIcon}>
              <TrendingUp size={20} color={colors.textOnPrimary} />
            </View>
            <View style={styles.earningsBody}>
              <Text style={styles.earningsLabel}>{t("drive.todayEarnings")}</Text>
              <Text style={styles.earningsValue}>{money(todayEarnings, wallet?.currency ?? "GHS")}</Text>
            </View>
            <View style={[styles.statusPill, online ? styles.statusOn : styles.statusOff]}>
              <Text style={[styles.statusText, online ? styles.statusTextOn : styles.statusTextOff]}>
                {online ? t("drive.online") : t("drive.offline")}
              </Text>
            </View>
          </View>

          {(activeRide || activeDelivery) && (
            <Pressable
              style={styles.activeCard}
              onPress={() =>
                router.push({
                  pathname: "/trip/[id]",
                  params: { id: (activeRide ?? activeDelivery)!.id, kind: activeRide ? "ride" : "delivery" },
                })
              }
            >
              <View style={styles.activeDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.activeLabel}>{t("drive.activeTrip")}</Text>
                <Text style={styles.activeValue} numberOfLines={1}>
                  {activeRide?.destinationAddress ?? activeDelivery?.dropoffAddress}
                </Text>
              </View>
              <Text style={styles.activeArrow}>›</Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
