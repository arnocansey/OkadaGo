import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Box,
  CheckCircle2,
  ChevronLeft,
  Clock,
  ClipboardCheck,
  MapPin,
  MessageCircle,
  Navigation,
  Package,
  Phone,
  Shield,
  User,
  Weight,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { AppMap } from "@/components/AppMap";
import { TripChatModal } from "./TripChatModal";
import { MotorcycleNavigation } from "@/components/MotorcycleNavigation";
import { PackageVerificationSheet } from "@/components/PackageVerificationSheet";
import { DeliveryCompletionSheet } from "@/components/DeliveryCompletionSheet";
import { SafetyCenter } from "@/components/SafetyCenter";
import { useTheme } from "@/context/ThemeContext";
import { useLiveRoutePreview } from "@/hooks/useLiveRoutePreview";
import { useUserLocation } from "@/hooks/useUserLocation";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { openGoogleMapsNavigation, openWazeNavigation } from "@/lib/navigation";
import { brand, layers } from "@/theme/design-system";

type PackageData = {
  type: string;
  size: string;
  description?: string;
  weight?: string;
  fragile?: boolean;
};

type RecipientData = {
  name: string;
  phone?: string;
  instructions?: string;
};

type StopData = {
  id: string;
  type: "PICKUP" | "DROPOFF";
  address: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  recipientName?: string;
  recipientPhone?: string;
  instructions?: string;
  status: string;
};

type DeliveryData = {
  id: string;
  status: string;
  pickupAddress: string;
  pickupLandmark?: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  dropoffAddress: string;
  dropoffLandmark?: string;
  dropoffLatitude?: number;
  dropoffLongitude?: number;
  estimatedFee?: number;
  riderEarnings?: number;
  currency?: string;
  package?: PackageData;
  senderName?: string;
  senderPhone?: string;
  recipient?: RecipientData;
  stops?: StopData[];
};

type Props = {
  delivery: DeliveryData;
  onAdvance: (proofPhotoBase64?: string) => void;
  onCompleteStop?: (stopId: string) => void;
  onVerifyPackage?: (stopId: string, verificationCode: string) => Promise<boolean>;
  loading?: boolean;
};

/**
 * DeliveryNavigationSheet — Dedicated delivery mode for riders.
 *
 * Clearly identifies package delivery vs passenger ride.
 * Shows package details, recipient info, delivery instructions.
 * Package verification at pickup and delivery.
 *
 * Layout — Pickup Phase:
 * ┌─────────────────────────────────┐
 * │       MAP (70%)                 │ ← Route to pickup
 * ├─────────────────────────────────┤
 * │  📦 PACKAGE PICKUP              │ ← Delivery badge
 * │  ─────────────────────────────  │
 * │  📦 Standard • Medium • 2.5kg   │ ← Package details
 * │  📌 Accra Mall, Entrance B      │ ← Pickup location
 * │  ─────────────────────────────  │
 * │  💰 Est. earnings: GH₵ 45      │ ← Earnings
 * │  ─────────────────────────────  │
 * │  [Google Maps] [Waze]           │
 * │  ─────────────────────────────  │
 * │  ┌─────────────────────────────┐│
 * │  │   CONFIRM PICKUP            ││ ← Primary CTA
 * │  └─────────────────────────────┘│
 * └─────────────────────────────────┘
 *
 * Layout — Delivery Phase:
 * ┌─────────────────────────────────┐
 * │       MAP (70%)                 │ ← Route to dropoff
 * ├─────────────────────────────────┤
 * │  📬 DELIVER TO                  │ ← Delivery badge
 * │  ─────────────────────────────  │
 * │  👤 Ama Mensah                  │ ← Recipient
 * │  📞 +233 24 567 8901           │
 * │  📍 123 Osu Oxford St          │ ← Dropoff
 * │  📝 Leave at front desk        │ ← Instructions
 * │  ─────────────────────────────  │
 * │  💰 Est. earnings: GH₵ 45      │ ← Earnings
 * │  ─────────────────────────────  │
 * │  [Google Maps] [Waze]           │
 * │  ─────────────────────────────  │
 * │  ┌─────────────────────────────┐│
 * │  │   CONFIRM DELIVERY          ││ ← Primary CTA
 * │  └─────────────────────────────┘│
 * └─────────────────────────────────┘
 */
export function DeliveryNavigationSheet({
  delivery,
  onAdvance,
  onCompleteStop,
  onVerifyPackage,
  loading = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { session } = useApp();
  const [sosLoading, setSosLoading] = useState(false);
  const [confirmingPickup, setConfirmingPickup] = useState(false);
  const [confirmingDelivery, setConfirmingDelivery] = useState(false);
  const [showPackageVerification, setShowPackageVerification] = useState(false);
  const [showDeliveryCompletion, setShowDeliveryCompletion] = useState(false);
  const [showSafetyCenter, setShowSafetyCenter] = useState(false);
  const [showInAppNav, setShowInAppNav] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);

  const status = delivery.status?.toLowerCase() ?? "assigned";
  const isPickupPhase = ["assigned", "arriving"].includes(status);
  const isAtPickup = status === "arrived";
  const isDeliveryPhase = ["picked_up", "in_transit"].includes(status);
  const isAtDropoff = status === "delivering";
  const isCompleted = status === "completed" || status === "delivered";

  // Find current stop
  const currentStop = delivery.stops?.find(
    (s) => s.status !== "COMPLETED" && s.status !== "DELIVERED",
  );
  const isMultiStop = (delivery.stops?.length ?? 0) > 1;
  const completedStops =
    delivery.stops?.filter((s) => s.status === "COMPLETED" || s.status === "DELIVERED").length ?? 0;
  const totalStops = delivery.stops?.length ?? 0;

  const { latitude: riderLat, longitude: riderLng } = useUserLocation();

  // Live route preview
  const livePreview = useLiveRoutePreview(
    session?.token,
    riderLat && riderLng ? { latitude: riderLat, longitude: riderLng } : null,
    isPickupPhase && delivery.pickupLatitude && delivery.pickupLongitude
      ? { latitude: delivery.pickupLatitude, longitude: delivery.pickupLongitude }
      : (isDeliveryPhase || isAtDropoff) && delivery.dropoffLatitude && delivery.dropoffLongitude
        ? { latitude: delivery.dropoffLatitude, longitude: delivery.dropoffLongitude }
        : null,
    true,
  );

  const routeCoordinates = useMemo(() => {
    if (livePreview?.route && livePreview.route.length > 0) {
      return livePreview.route.map(([lat, lon]) => ({ latitude: lat, longitude: lon }));
    }
    const targetLat = isPickupPhase ? delivery.pickupLatitude : delivery.dropoffLatitude;
    const targetLon = isPickupPhase ? delivery.pickupLongitude : delivery.dropoffLongitude;
    if (riderLat && riderLng && targetLat && targetLon) {
      return [
        { latitude: riderLat, longitude: riderLng },
        { latitude: targetLat, longitude: targetLon },
      ];
    }
    return undefined;
  }, [livePreview, isPickupPhase, delivery.pickupLatitude, delivery.pickupLongitude, delivery.dropoffLatitude, delivery.dropoffLongitude, riderLat, riderLng]);

  const markers = useMemo(() => {
    const m = [];
    if (riderLat && riderLng) {
      m.push({
        id: "rider-current-location",
        latitude: riderLat,
        longitude: riderLng,
        title: "Your Location",
        pinColor: brand.primary,
      });
    }
    if (delivery.pickupLatitude && delivery.pickupLongitude) {
      m.push({
        id: "pickup",
        latitude: delivery.pickupLatitude,
        longitude: delivery.pickupLongitude,
        title: "Pickup",
        pinColor: brand.primary,
      });
    }
    if (
      (isDeliveryPhase || isAtDropoff) &&
      delivery.dropoffLatitude &&
      delivery.dropoffLongitude
    ) {
      m.push({
        id: "dropoff",
        latitude: delivery.dropoffLatitude,
        longitude: delivery.dropoffLongitude,
        title: "Dropoff",
        pinColor: colors.danger,
      });
    }
    return m;
  }, [riderLat, riderLng, delivery, isDeliveryPhase, isAtDropoff, colors]);

  const earnings = delivery.riderEarnings ?? delivery.estimatedFee ?? 0;
  const currency = delivery.currency ?? "GH₵";

  const actionLabel = useMemo(() => {
    if (isPickupPhase || isAtPickup) return "CONFIRM PICKUP";
    if (isDeliveryPhase || isAtDropoff) return "CONFIRM DELIVERY";
    return "Continue";
  }, [isPickupPhase, isAtPickup, isDeliveryPhase, isAtDropoff]);

  async function handleConfirmPickup(photoUri?: string) {
    setConfirmingPickup(true);
    try {
      if (onVerifyPackage && currentStop && photoUri) {
        await onVerifyPackage(currentStop.id, photoUri);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onAdvance();
    } catch (e) {
      Alert.alert(
        "Pickup failed",
        e instanceof Error ? e.message : "Could not confirm pickup.",
      );
    } finally {
      setConfirmingPickup(false);
      setShowPackageVerification(false);
    }
  }

  async function handleConfirmDelivery(photoBase64?: string) {
    setConfirmingDelivery(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onAdvance(photoBase64);
    } catch (e) {
      Alert.alert(
        "Delivery failed",
        e instanceof Error ? e.message : "Could not confirm delivery.",
      );
    } finally {
      setConfirmingDelivery(false);
      setShowDeliveryCompletion(false);
    }
  }

  function handleAction() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isPickupPhase || isAtPickup) {
      handleConfirmPickup();
    } else if (isDeliveryPhase || isAtDropoff) {
      setShowDeliveryCompletion(true);
    } else {
      onAdvance();
    }
  }

  const s = useMemo(
    () =>
      StyleSheet.create({
        screen: {
          flex: 1,
          backgroundColor: colors.bg,
        },

        /* ─── Map Area ────────────────────────────────────────── */
        mapArea: {
          flex: 52,
          position: "relative",
        },

        /* ─── Bottom Sheet ────────────────────────────────────── */
        sheet: {
          flex: 48,
          backgroundColor: isDark ? colors.surface : "#FFFFFF",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: isDark ? 0.5 : 0.18,
          shadowRadius: 20,
          elevation: 12,
          borderWidth: 1,
          borderBottomWidth: 0,
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        },
        sheetScroll: {
          flex: 1,
        },
        sheetContent: {
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: insets.bottom + 24,
        },

        /* ─── Handle Bar ──────────────────────────────────────── */
        handleBar: {
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)",
          alignSelf: "center",
          marginBottom: 12,
        },

        /* ─── Delivery Badge ──────────────────────────────────── */
        badge: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        },
        badgeIcon: {
          width: 28,
          height: 28,
          borderRadius: 8,
          backgroundColor: "#FF6B0015",
          alignItems: "center",
          justifyContent: "center",
        },
        badgeText: {
          fontSize: 13,
          fontWeight: "700",
          color: "#FF6B00",
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
        badgePickup: {
          backgroundColor: brand.primary + "15",
        },
        badgePickupText: {
          color: brand.primary,
        },

        /* ─── Package Info Card ───────────────────────────────── */
        packageCard: {
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
          borderRadius: 12,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          padding: 12,
          marginBottom: 12,
        },
        packageRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginBottom: 6,
        },
        packageIcon: {
          width: 20,
          height: 20,
          borderRadius: 6,
          backgroundColor: "#FF6B0020",
          alignItems: "center",
          justifyContent: "center",
        },
        packageLabel: {
          fontSize: 11,
          fontWeight: "700",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
        packageValue: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.text,
          flex: 1,
        },
        packageTags: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 6,
          marginTop: 8,
        },
        packageTag: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 6,
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
        },
        packageTagText: {
          fontSize: 11,
          fontWeight: "600",
          color: colors.textSecondary,
        },
        fragileTag: {
          backgroundColor: "#FEE2E220",
          borderColor: "#FEE2E2",
        },
        fragileText: {
          color: "#EF4444",
        },

        /* ─── Location Section ────────────────────────────────── */
        locationSection: {
          marginBottom: 12,
        },
        locationHeader: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
        },
        locationDot: {
          width: 8,
          height: 8,
          borderRadius: 4,
        },
        locationLabel: {
          fontSize: 11,
          fontWeight: "700",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.8,
        },
        addressText: {
          fontSize: 16,
          fontWeight: "600",
          color: colors.text,
          marginBottom: 2,
        },
        landmarkText: {
          fontSize: 13,
          fontWeight: "500",
          color: colors.textSecondary,
          marginBottom: 4,
        },

        /* ─── Recipient Card ──────────────────────────────────── */
        recipientCard: {
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
          borderRadius: 12,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          padding: 12,
          marginBottom: 12,
        },
        recipientRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          marginBottom: 8,
        },
        recipientAvatar: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.surfaceOverlay,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: colors.border,
        },
        recipientInfo: {
          flex: 1,
        },
        recipientLabel: {
          fontSize: 10,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
        recipientName: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.text,
          marginTop: 2,
        },
        recipientPhone: {
          fontSize: 12,
          fontWeight: "500",
          color: colors.textSecondary,
          marginTop: 1,
        },
        contactBtns: {
          flexDirection: "row",
          gap: 8,
        },
        contactBtn: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.surfaceOverlay,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: colors.border,
        },
        instructionsBox: {
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 8,
          marginTop: 8,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
        },
        instructionsIcon: {
          width: 20,
          height: 20,
          borderRadius: 6,
          backgroundColor: "#FF6B0020",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 1,
        },
        instructionsText: {
          flex: 1,
          fontSize: 13,
          fontWeight: "500",
          color: colors.textSecondary,
          lineHeight: 18,
        },

        /* ─── Divider ──────────────────────────────────────────── */
        divider: {
          height: 1,
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
          marginBottom: 12,
        },

        /* ─── Earnings Row ────────────────────────────────────── */
        earningsRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        },
        earningsLeft: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        },
        earningsIcon: {
          width: 28,
          height: 28,
          borderRadius: 8,
          backgroundColor: "#22C55E15",
          alignItems: "center",
          justifyContent: "center",
        },
        earningsLabel: {
          fontSize: 13,
          fontWeight: "500",
          color: colors.textSecondary,
        },
        earningsAmount: {
          fontSize: 18,
          fontWeight: "700",
          color: "#22C55E",
        },

        /* ─── Multi-Stop Progress ─────────────────────────────── */
        stopProgress: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        },
        stopProgressBar: {
          flex: 1,
          height: 4,
          borderRadius: 2,
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
          overflow: "hidden",
        },
        stopProgressFill: {
          height: "100%",
          borderRadius: 2,
          backgroundColor: brand.primary,
        },
        stopProgressText: {
          fontSize: 11,
          fontWeight: "600",
          color: colors.textMuted,
        },

        /* ─── Action Button ────────────────────────────────────── */
        actionBtn: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          height: 56,
          borderRadius: 16,
          backgroundColor: brand.primary,
          shadowColor: brand.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 8,
          marginBottom: 8,
        },
        actionBtnDisabled: {
          opacity: 0.5,
        },
        actionText: {
          fontSize: 16,
          fontWeight: "700",
          color: "#000000",
        },

        /* ─── Navigation Apps ──────────────────────────────────── */
        navRow: {
          flexDirection: "row",
          gap: 8,
        },
        navBtn: {
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          height: 44,
          borderRadius: 12,
          backgroundColor: colors.surfaceOverlay,
          borderWidth: 1,
          borderColor: colors.border,
        },
        navBtnText: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.textSecondary,
        },

        /* ─── Back Button ─────────────────────────────────────────── */
        backWrap: {
          position: "absolute",
          top: insets.top + 12,
          left: 16,
          zIndex: layers.floatingAction,
        },
        backBtn: {
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isDark ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.9)",
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 4,
        },

        /* ─── Safety Button ─────────────────────────────────────────── */
        sosWrap: {
          position: "absolute",
          top: insets.top + 12,
          right: 16,
          zIndex: layers.floatingAction,
        },
        sosBtn: {
          minWidth: 48,
          height: 48,
          borderRadius: 24,
          paddingHorizontal: 14,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 6,
          backgroundColor: "#3B82F6",
          shadowColor: "#3B82F6",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
          elevation: 8,
        },
        sosLabel: {
          fontSize: 12,
          fontWeight: "700",
          color: "#FFFFFF",
        },
      }),
    [colors, isDark, insets],
  );

  const pickupLat = delivery.pickupLatitude;
  const pickupLon = delivery.pickupLongitude;
  const dropoffLat = delivery.dropoffLatitude;
  const dropoffLon = delivery.dropoffLongitude;

  return (
    <View style={s.screen}>
      {/* ─── Map Area (70%) ────────────────────────────────────── */}
      <View style={s.mapArea}>
        <AppMap
          markers={markers}
          routeCoordinates={routeCoordinates}
          fitToMarkers={markers.length > 0}
          showCenterButton
          centerButtonInset={{ bottom: 16, right: 16 }}
        />

        {/* Back Button */}
        <View style={s.backWrap}>
          <Pressable
            style={s.backBtn}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={22} color={colors.text} />
          </Pressable>
        </View>

        {/* Chat & Safety Center Buttons */}
        <View style={s.sosWrap}>
          <Pressable
            style={[s.sosBtn, { backgroundColor: colors.surfaceOverlay, borderColor: colors.border, borderWidth: 1 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowChatModal(true);
            }}
            accessibilityLabel="Open Chat with Customer"
          >
            <MessageCircle size={16} color={colors.primary} />
            <Text style={[s.sosLabel, { color: colors.text }]}>Chat</Text>
          </Pressable>

          <Pressable
            style={s.sosBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowSafetyCenter(true);
            }}
            accessibilityLabel="Open Safety Center"
          >
            <Shield size={16} color="#FFFFFF" />
            <Text style={s.sosLabel}>Safety</Text>
          </Pressable>
        </View>
      </View>

      {/* ─── Bottom Sheet ──────────────────────────────────────── */}
      <KeyboardAvoidingView
        style={s.sheet}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={s.sheetScroll}
          contentContainerStyle={s.sheetContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
          nestedScrollEnabled={true}
        >
          {/* Handle Bar */}
          <View style={s.handleBar} />

          {/* ═══════════════════════════════════════════════════════ */}
          {/* PICKUP PHASE: Navigate to pickup                      */}
          {/* ═══════════════════════════════════════════════════════ */}
          {(isPickupPhase || isAtPickup) && (
            <>
              {/* Delivery Badge */}
              <View style={s.badge}>
                <View style={[s.badgeIcon, s.badgePickup]}>
                  <Package size={14} color={brand.primary} />
                </View>
                <Text style={[s.badgeText, s.badgePickupText]}>
                  Package Pickup
                </Text>
              </View>

              {/* Package Info */}
              {delivery.package && (
                <View style={s.packageCard}>
                  <View style={s.packageRow}>
                    <View style={s.packageIcon}>
                      <Box size={12} color="#FF6B00" />
                    </View>
                    <Text style={s.packageLabel}>Package</Text>
                    <Text style={s.packageValue} numberOfLines={1}>
                      {delivery.package.type}
                    </Text>
                  </View>
                  <View style={s.packageTags}>
                    <View style={s.packageTag}>
                      <Package size={10} color={colors.textSecondary} />
                      <Text style={s.packageTagText}>
                        {delivery.package.size}
                      </Text>
                    </View>
                    {delivery.package.weight && (
                      <View style={s.packageTag}>
                        <Weight size={10} color={colors.textSecondary} />
                        <Text style={s.packageTagText}>
                          {delivery.package.weight}
                        </Text>
                      </View>
                    )}
                    {delivery.package.fragile && (
                      <View style={[s.packageTag, s.fragileTag]}>
                        <Text style={[s.packageTagText, s.fragileText]}>
                          Fragile
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Pickup Location */}
              <View style={s.locationSection}>
                <View style={s.locationHeader}>
                  <View
                    style={[s.locationDot, { backgroundColor: brand.primary }]}
                  />
                  <Text style={s.locationLabel}>Pickup Location</Text>
                </View>
                <Text style={s.addressText} numberOfLines={1}>
                  {delivery.pickupAddress}
                </Text>
                {delivery.pickupLandmark && (
                  <Text style={s.landmarkText} numberOfLines={1}>
                    {delivery.pickupLandmark}
                  </Text>
                )}
              </View>

              <View style={s.divider} />

              {/* Sender Info */}
              {delivery.senderName && (
                <>
                  <View style={s.recipientCard}>
                    <View style={s.recipientRow}>
                      <View style={s.recipientAvatar}>
                        <User size={16} color={colors.textSecondary} />
                      </View>
                      <View style={s.recipientInfo}>
                        <Text style={s.recipientLabel}>Sender</Text>
                        <Text style={s.recipientName} numberOfLines={1}>
                          {delivery.senderName}
                        </Text>
                      </View>
                      {delivery.senderPhone && (
                        <View style={s.contactBtns}>
                          <Pressable
                            style={s.contactBtn}
                            onPress={() =>
                              Linking.openURL(`tel:${delivery.senderPhone}`)
                            }
                            accessibilityLabel="Call sender"
                          >
                            <Phone size={16} color={colors.primary} />
                          </Pressable>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={s.divider} />
                </>
              )}

              {/* Earnings */}
              <View style={s.earningsRow}>
                <View style={s.earningsLeft}>
                  <View style={s.earningsIcon}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: "#22C55E" }}>
                      ₵
                    </Text>
                  </View>
                  <Text style={s.earningsLabel}>Estimated earnings</Text>
                </View>
                <Text style={s.earningsAmount}>
                  {currency} {earnings}
                </Text>
              </View>

              {/* Multi-stop progress */}
              {isMultiStop && (
                <View style={s.stopProgress}>
                  <View style={s.stopProgressBar}>
                    <View
                      style={[
                        s.stopProgressFill,
                        { width: `${(completedStops / totalStops) * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={s.stopProgressText}>
                    {completedStops}/{totalStops} stops
                  </Text>
                </View>
              )}

              {/* Action Button */}
              <Pressable
                style={[
                  s.actionBtn,
                  (loading || confirmingPickup) && s.actionBtnDisabled,
                ]}
                onPress={handleAction}
                disabled={loading || confirmingPickup}
                accessibilityRole="button"
                accessibilityLabel={actionLabel}
              >
                {loading || confirmingPickup ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <>
                    {isAtPickup ? (
                      <ClipboardCheck size={18} color="#000000" />
                    ) : (
                      <Navigation size={18} color="#000000" />
                    )}
                    <Text style={s.actionText}>{actionLabel}</Text>
                  </>
                )}
              </Pressable>

              {/* Navigation Button */}
              {isPickupPhase && pickupLat && pickupLon && (
                <View style={s.navRow}>
                  <Pressable
                    style={s.navBtn}
                    onPress={() => setShowInAppNav(true)}
                  >
                    <Navigation size={16} color={colors.primary} />
                    <Text style={s.navBtnText}>Navigate to Pickup (In-App)</Text>
                  </Pressable>
                </View>
              )}
            </>
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* DELIVERY PHASE: Navigate to dropoff                    */}
          {/* ═══════════════════════════════════════════════════════ */}
          {(isDeliveryPhase || isAtDropoff) && (
            <>
              {/* Delivery Badge */}
              <View style={s.badge}>
                <View style={s.badgeIcon}>
                  <Package size={14} color="#FF6B00" />
                </View>
                <Text style={s.badgeText}>Deliver Package</Text>
              </View>

              {/* Package Info */}
              {delivery.package && (
                <View style={s.packageCard}>
                  <View style={s.packageRow}>
                    <View style={s.packageIcon}>
                      <Box size={12} color="#FF6B00" />
                    </View>
                    <Text style={s.packageLabel}>Package</Text>
                    <Text style={s.packageValue} numberOfLines={1}>
                      {delivery.package.type}
                    </Text>
                  </View>
                  <View style={s.packageTags}>
                    <View style={s.packageTag}>
                      <Package size={10} color={colors.textSecondary} />
                      <Text style={s.packageTagText}>
                        {delivery.package.size}
                      </Text>
                    </View>
                    {delivery.package.weight && (
                      <View style={s.packageTag}>
                        <Weight size={10} color={colors.textSecondary} />
                        <Text style={s.packageTagText}>
                          {delivery.package.weight}
                        </Text>
                      </View>
                    )}
                    {delivery.package.fragile && (
                      <View style={[s.packageTag, s.fragileTag]}>
                        <Text style={[s.packageTagText, s.fragileText]}>
                          Fragile
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Recipient Card */}
              {delivery.recipient && (
                <View style={s.recipientCard}>
                  <View style={s.recipientRow}>
                    <View style={s.recipientAvatar}>
                      <User size={16} color={colors.textSecondary} />
                    </View>
                    <View style={s.recipientInfo}>
                      <Text style={s.recipientLabel}>Recipient</Text>
                      <Text style={s.recipientName} numberOfLines={1}>
                        {delivery.recipient.name}
                      </Text>
                      {delivery.recipient.phone && (
                        <Text style={s.recipientPhone} numberOfLines={1}>
                          {delivery.recipient.phone}
                        </Text>
                      )}
                    </View>
                    {delivery.recipient?.phone && (
                      <View style={s.contactBtns}>
                        <Pressable
                          style={s.contactBtn}
                          onPress={() =>
                            Linking.openURL(`tel:${delivery.recipient!.phone}`)
                          }
                          accessibilityLabel="Call recipient"
                        >
                          <Phone size={16} color={colors.primary} />
                        </Pressable>
                        <Pressable
                          style={s.contactBtn}
                          onPress={() => {}}
                          accessibilityLabel="Message recipient"
                        >
                          <MessageCircle size={16} color={colors.primary} />
                        </Pressable>
                      </View>
                    )}
                  </View>

                  {/* Delivery Instructions */}
                  {delivery.recipient.instructions && (
                    <View style={s.instructionsBox}>
                      <View style={s.instructionsIcon}>
                        <ClipboardCheck size={10} color="#FF6B00" />
                      </View>
                      <Text style={s.instructionsText}>
                        {delivery.recipient.instructions}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Dropoff Location */}
              <View style={s.locationSection}>
                <View style={s.locationHeader}>
                  <View
                    style={[s.locationDot, { backgroundColor: colors.danger }]}
                  />
                  <Text style={s.locationLabel}>Dropoff Location</Text>
                </View>
                <Text style={s.addressText} numberOfLines={1}>
                  {delivery.dropoffAddress}
                </Text>
                {delivery.dropoffLandmark && (
                  <Text style={s.landmarkText} numberOfLines={1}>
                    {delivery.dropoffLandmark}
                  </Text>
                )}
              </View>

              <View style={s.divider} />

              {/* Earnings */}
              <View style={s.earningsRow}>
                <View style={s.earningsLeft}>
                  <View style={s.earningsIcon}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: "#22C55E" }}>
                      ₵
                    </Text>
                  </View>
                  <Text style={s.earningsLabel}>Estimated earnings</Text>
                </View>
                <Text style={s.earningsAmount}>
                  {currency} {earnings}
                </Text>
              </View>

              {/* Multi-stop progress */}
              {isMultiStop && (
                <View style={s.stopProgress}>
                  <View style={s.stopProgressBar}>
                    <View
                      style={[
                        s.stopProgressFill,
                        { width: `${(completedStops / totalStops) * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={s.stopProgressText}>
                    {completedStops}/{totalStops} stops
                  </Text>
                </View>
              )}

              {/* Action Button */}
              <Pressable
                style={[
                  s.actionBtn,
                  (loading || confirmingDelivery) && s.actionBtnDisabled,
                ]}
                onPress={handleAction}
                disabled={loading || confirmingDelivery}
                accessibilityRole="button"
                accessibilityLabel={actionLabel}
              >
                {loading || confirmingDelivery ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <>
                    {isAtDropoff ? (
                      <CheckCircle2 size={18} color="#000000" />
                    ) : (
                      <Navigation size={18} color="#000000" />
                    )}
                    <Text style={s.actionText}>{actionLabel}</Text>
                  </>
                )}
              </Pressable>

              {/* Navigation Button */}
              {(isDeliveryPhase || isAtDropoff) && dropoffLat && dropoffLon && (
                <View style={s.navRow}>
                  <Pressable
                    style={s.navBtn}
                    onPress={() => setShowInAppNav(true)}
                  >
                    <Navigation size={16} color={colors.primary} />
                    <Text style={s.navBtnText}>Navigate to Dropoff (In-App)</Text>
                  </Pressable>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ─── In-App Motorcycle Navigation Modal ─────────────────── */}
      <Modal
        visible={showInAppNav}
        animationType="slide"
        onRequestClose={() => setShowInAppNav(false)}
      >
        <MotorcycleNavigation
          destinationAddress={isPickupPhase ? delivery.pickupAddress : delivery.dropoffAddress}
          destinationLandmark={isPickupPhase ? delivery.pickupLandmark : delivery.dropoffLandmark}
          destinationLatitude={isPickupPhase ? delivery.pickupLatitude : delivery.dropoffLatitude}
          destinationLongitude={isPickupPhase ? delivery.pickupLongitude : delivery.dropoffLongitude}
          pickupAddress={delivery.pickupAddress}
          pickupLandmark={delivery.pickupLandmark}
          passengerName={isPickupPhase ? delivery.senderName : delivery.recipient?.name}
          passengerPhone={isPickupPhase ? delivery.senderPhone : delivery.recipient?.phone}
          riderEarnings={delivery.riderEarnings}
          estimatedFare={delivery.estimatedFee}
          currency={delivery.currency}
          rideType="PACKAGE DELIVERY"
          packageDetails={delivery.package?.type ? `${delivery.package.type}${delivery.package.weight ? ` • ${delivery.package.weight}` : ""}` : undefined}
          onClose={() => setShowInAppNav(false)}
          onCallPassenger={() => {
            const phone = isPickupPhase ? delivery.senderPhone : delivery.recipient?.phone;
            if (phone) Linking.openURL(`tel:${phone}`);
          }}
        />
      </Modal>

      {/* ─── Package Verification Sheet ──────────────────────────── */}
      <PackageVerificationSheet
        visible={showPackageVerification}
        deliveryId={delivery.id}
        stopId={currentStop?.id}
        senderName={delivery.senderName}
        packageType={delivery.package?.type}
        onVerified={(photoUri) => handleConfirmPickup(photoUri)}
        onSkip={() => setShowPackageVerification(false)}
        onVerify={onVerifyPackage && currentStop ? (code) => onVerifyPackage(currentStop.id, code) : undefined}
      />

      {/* ─── Delivery Completion Sheet ───────────────────────────── */}
      <DeliveryCompletionSheet
        visible={showDeliveryCompletion}
        deliveryId={delivery.id}
        recipientName={delivery.recipient?.name}
        recipientPhone={delivery.recipient?.phone}
        dropoffAddress={delivery.dropoffAddress}
        dropoffLandmark={delivery.dropoffLandmark}
        package={delivery.package}
        onVerified={(photoBase64) => handleConfirmDelivery(photoBase64)}
        onSkip={() => setShowDeliveryCompletion(false)}
        onVerify={onVerifyPackage && currentStop ? (pin) => onVerifyPackage(currentStop.id, pin) : undefined}
      />

      {/* ─── Safety Center ──────────────────────────────────────── */}
      <SafetyCenter
        visible={showSafetyCenter}
        onClose={() => setShowSafetyCenter(false)}
        tripId={delivery.id}
        tripKind="delivery"
        passengerName={delivery.senderName}
        passengerPhone={delivery.senderPhone}
        pickupAddress={delivery.pickupAddress}
        destinationAddress={delivery.dropoffAddress}
        pickupLatitude={delivery.pickupLatitude}
        pickupLongitude={delivery.pickupLongitude}
      />

      {/* ─── Delivery Chat Modal ────────────────────────────────── */}
      <TripChatModal
        visible={showChatModal}
        tripId={delivery.id}
        onClose={() => setShowChatModal(false)}
      />
    </View>
  );
}
