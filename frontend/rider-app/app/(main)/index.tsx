import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Power, ShieldAlert, TrendingUp } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { AppMap } from "@/components/AppMap";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { MapBottomSheet, MAP_SHEET_CENTER_INSET } from "@/components/ui/MapBottomSheet";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { useRiderLocation } from "@/hooks/useRiderLocation";
import { useUserLocation } from "@/hooks/useUserLocation";
import { ApiError, api, money } from "@/lib/api";
import { radius, shadows, spacing } from "@/theme/tokens";

const RIDER_MIN_ONLINE_BALANCE = 30;

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

  async function handleToggleOnline() {
    // Going offline never needs a balance check.
    if (online) {
      try {
        await toggleOnline();
      } catch {
        // toggleOnline already sets the banner message
      }
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
    if (balance < RIDER_MIN_ONLINE_BALANCE) {
      Alert.alert(
        "Insufficient Balance",
        `Keep at least GH₵ ${RIDER_MIN_ONLINE_BALANCE} in your wallet, then top up via MoMo/Paystack to go online.`,
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: "Top Up Now",
            onPress: () => router.push("/(main)/wallet"),
          },
        ],
      );
      return;
    }

    try {
      await toggleOnline();
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
            {
              text: "Top Up Now",
              onPress: () => router.push("/(main)/wallet"),
            },
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

  const todayEarnings = rides
    .filter((r) => (r.status ?? "").toLowerCase() === "completed")
    .reduce((sum, r) => sum + Number(r.riderEarnings ?? r.finalFare ?? 0), 0);

  const wallet = wallets[0];

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
        powerBtnOn: { backgroundColor: colors.online, borderWidth: 2, borderColor: colors.online },
        sosBtn: {
          minWidth: 44,
          height: 44,
          borderRadius: 22,
          paddingHorizontal: spacing.md,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: spacing.xs,
          backgroundColor: colors.danger,
        },
        sosLabel: { ...typography.label, color: colors.textOnDanger },
        floatBanner: {
          backgroundColor: colors.warningLight,
          borderRadius: radius.lg,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.warning,
          gap: spacing.sm,
        },
        floatTitle: { ...typography.bodySemibold, color: colors.text },
        floatBody: { ...typography.caption, color: colors.textSecondary },
        floatLink: { ...typography.captionMedium, color: colors.accent },
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
        earningsValue: { ...typography.h2, color: colors.textOnPrimary, marginTop: spacing.xs },
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
        activeValue: { ...typography.bodySemibold, marginTop: spacing.xs, color: colors.text },
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
        centerButtonInset={{ bottom: MAP_SHEET_CENTER_INSET, right: spacing.lg }}
      />

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.topBarWrap}>
          <View style={styles.top}>
            <Avatar name={session?.user.fullName ?? "A"} size={40} imageUri={session?.user.avatarUrl ?? undefined} />
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
              {sosLoading ? (
                <ActivityIndicator color={colors.textOnDanger} size="small" />
              ) : (
                <>
                  <ShieldAlert size={16} color={colors.textOnDanger} />
                  <Text style={styles.sosLabel}>SOS</Text>
                </>
              )}
            </Pressable>
            <Pressable
              style={[styles.powerBtn, online ? styles.powerBtnOn : styles.powerBtnOff]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                void handleToggleOnline();
              }}
              accessibilityLabel={online ? t("drive.offline") : t("drive.online")}
              accessibilityRole="button"
            >
              <Power size={22} color={online ? colors.textOnPrimary : colors.text} />
            </Pressable>
          </View>
        </View>

        <MapBottomSheet>
          {!online && Number(wallet?.availableBalance ?? 0) < RIDER_MIN_ONLINE_BALANCE ? (
            <Pressable style={styles.floatBanner} onPress={() => router.push("/(main)/wallet")}>
              <Text style={styles.floatTitle}>Wallet float needed</Text>
              <Text style={styles.floatBody}>
                Keep at least GH₵ {RIDER_MIN_ONLINE_BALANCE} available to go online and receive jobs.
              </Text>
              <Text style={styles.floatLink}>Open wallet →</Text>
            </Pressable>
          ) : null}

          <View style={styles.earningsHero}>
            <View style={styles.earningsIcon}>
              <TrendingUp size={20} color={colors.textOnPrimary} />
            </View>
            <View style={styles.earningsBody}>
              <Text style={styles.earningsLabel}>{t("drive.todayEarnings")}</Text>
              <Text style={styles.earningsValue}>{money(todayEarnings, wallet?.currency ?? "GHS")}</Text>
            </View>
            <Badge label={online ? t("drive.online") : t("drive.offline")} tone={online ? "success" : "default"} />
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
        </MapBottomSheet>
      </SafeAreaView>
    </View>
  );
}
