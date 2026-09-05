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
  CheckCircle2,
  ChevronLeft,
  Clock,
  DollarSign,
  Info,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  X,
  Zap,
} from "lucide-react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { AppMap } from "@/components/AppMap";
import { TripChatModal } from "./TripChatModal";
import { MotorcycleNavigation } from "@/components/MotorcycleNavigation";
import { PinVerificationSheet } from "@/components/PinVerificationSheet";
import { SafetyCenter } from "@/components/SafetyCenter";
import { useTheme } from "@/context/ThemeContext";
import { useLiveRoutePreview } from "@/hooks/useLiveRoutePreview";
import { useUserLocation } from "@/hooks/useUserLocation";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { openGoogleMapsNavigation, openWazeNavigation } from "@/lib/navigation";
import { brand, layers } from "@/theme/design-system";

type TripData = {
  id: string;
  kind: "ride" | "delivery";
  status: string;
  passengerName?: string;
  passengerPhone?: string;
  pickupAddress: string;
  pickupLandmark?: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  destinationAddress?: string;
  destinationLandmark?: string;
  destinationLatitude?: number;
  destinationLongitude?: number;
  estimatedFare?: number;
  riderEarnings?: number;
  currency?: string;
  rideType?: string;
  tripPin?: string;
};

type Props = {
  trip: TripData;
  onAdvance: () => void;
  onVerifyPin?: (pin: string) => Promise<boolean>;
  loading?: boolean;
};

/**
 * TripNavigationSheet — Navigation-focused trip screen.
 *
 * Three modes:
 * 1. Navigation (arriving): Route to pickup with ETA
 * 2. Arrived: Simple arrived state + PIN verification sheet
 * 3. Trip (started): Navigation to destination
 *
 * Layout — Arriving:
 * ┌─────────────────────────────────┐
 * │       MAP (70%)                 │ ← Route to pickup
 * ├─────────────────────────────────┤
 * │  📍 PICKUP: Accra Mall          │
 * │  🕐 3 min • 1.2 km             │
 * │  👤 Kwame A.  [📞] [💬]        │
 * │  [ ARRIVED AT PICKUP ]          │ ← CTA
 * │  [Google Maps] [Waze]           │
 * └─────────────────────────────────┘
 *
 * Layout — Arrived (PIN verification):
 * ┌─────────────────────────────────┐
 * │       MAP (70%)                 │ ← Centered on pickup
 * ├─────────────────────────────────┤
 * │  ✅ YOU'VE ARRIVED              │
 * │  👤 Kwame A.                    │
 * │  📍 Near Entrance B             │
 * │  ───────────────────────────    │
 * │  ⏳ WAITING TIPS                │
 * │  • Park safely off road         │
 * │  • Hazard lights on             │
 * │  • Helmet on until seated       │
 * │  ───────────────────────────    │
 * │  ┌─────────────────────────────┐│
 * │  │    VERIFY PASSENGER PIN     ││ ← Opens PinVerificationSheet
 * │  └─────────────────────────────┘│
 * └─────────────────────────────────┘
 *
 * Layout — In Trip:
 * ┌─────────────────────────────────┐
 * │       MAP (70%)                 │ ← Route to destination
 * ├─────────────────────────────────┤
 * │  📍 DESTINATION                 │
 * │  👤 Kwame A.  [📞] [💬]        │
 * │  [ COMPLETE TRIP ]              │
 * │  [Google Maps] [Waze]           │
 * └─────────────────────────────────┘
 */
export function TripNavigationSheet({
  trip,
  onAdvance,
  onVerifyPin,
  loading = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { session } = useApp();
  const [showPinSheet, setShowPinSheet] = useState(false);
  const [showSafetyCenter, setShowSafetyCenter] = useState(false);
  const [showInAppNav, setShowInAppNav] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);

  const status = trip.status?.toLowerCase() ?? "assigned";
  const isArriving = status === "arriving";
  const isArrived = status === "arrived";
  const isPickupPhase = ["assigned", "arriving"].includes(status);
  const isTripPhase = ["started", "picked_up", "in_transit"].includes(status);

  const { latitude: riderLat, longitude: riderLng } = useUserLocation();

  // Live route preview — only when en route
  const livePreview = useLiveRoutePreview(
    session?.token,
    riderLat && riderLng ? { latitude: riderLat, longitude: riderLng } : null,
    isPickupPhase && trip.pickupLatitude && trip.pickupLongitude
      ? { latitude: trip.pickupLatitude, longitude: trip.pickupLongitude }
      : isTripPhase && trip.destinationLatitude && trip.destinationLongitude
        ? { latitude: trip.destinationLatitude, longitude: trip.destinationLongitude }
        : null,
    true,
  );

  const routeCoordinates = useMemo(() => {
    if (livePreview?.route && livePreview.route.length > 0) {
      return livePreview.route.map(([lat, lon]) => ({ latitude: lat, longitude: lon }));
    }
    const targetLat = isPickupPhase ? trip.pickupLatitude : trip.destinationLatitude;
    const targetLon = isPickupPhase ? trip.pickupLongitude : trip.destinationLongitude;
    if (riderLat && riderLng && targetLat && targetLon) {
      return [
        { latitude: riderLat, longitude: riderLng },
        { latitude: targetLat, longitude: targetLon },
      ];
    }
    return undefined;
  }, [livePreview, isPickupPhase, trip.pickupLatitude, trip.pickupLongitude, trip.destinationLatitude, trip.destinationLongitude, riderLat, riderLng]);

  const actionLabel = useMemo(() => {
    switch (status) {
      case "assigned":
      case "arriving":
        return "I Have Arrived";
      case "arrived":
        return "Verify & Start Trip";
      case "started":
      case "in_transit":
        return "Complete Trip";
      default:
        return "I Have Arrived";
    }
  }, [status]);

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
    if (trip.pickupLatitude && trip.pickupLongitude) {
      m.push({
        id: "pickup",
        latitude: trip.pickupLatitude,
        longitude: trip.pickupLongitude,
        title: "Pickup",
        pinColor: brand.primary,
      });
    }
    if (isTripPhase && trip.destinationLatitude && trip.destinationLongitude) {
      m.push({
        id: "destination",
        latitude: trip.destinationLatitude,
        longitude: trip.destinationLongitude,
        title: "Destination",
        pinColor: colors.danger,
      });
    }
    return m;
  }, [riderLat, riderLng, trip, isTripPhase, colors]);

  function handleAction() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isArrived) {
      setShowPinSheet(true);
      return;
    }
    onAdvance();
  }

  function handlePinVerified() {
    setShowPinSheet(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onAdvance();
  }

  const s = useMemo(
    () =>
      StyleSheet.create({
        screen: {
          flex: 1,
          backgroundColor: colors.bg,
        },

        /* ─── Map Area (70%) ──────────────────────────────────── */
        mapArea: {
          flex: isArrived ? 52 : isTripPhase ? 58 : 65,
          position: "relative",
        },

        /* ─── Bottom Sheet ────────────────────────────────────── */
        sheet: {
          flex: isArrived ? 48 : isTripPhase ? 42 : 35,
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

        /* ─── Section Header ──────────────────────────────────── */
        sectionHeader: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
        },
        sectionDot: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: brand.primary,
        },
        sectionLabel: {
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
          marginBottom: 8,
        },

        /* ─── ETA Row ──────────────────────────────────────────── */
        etaRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
        },
        etaItem: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        },
        etaIcon: {
          width: 28,
          height: 28,
          borderRadius: 8,
          backgroundColor: colors.surfaceOverlay,
          alignItems: "center",
          justifyContent: "center",
        },
        etaText: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.text,
        },

        /* ─── Passenger Row ────────────────────────────────────── */
        passengerRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
        },
        passengerAvatar: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.surfaceOverlay,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: colors.border,
        },
        passengerInfo: {
          flex: 1,
        },
        passengerLabel: {
          fontSize: 10,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
        passengerName: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.text,
          marginTop: 2,
        },
        contactBtns: {
          flexDirection: "row",
          gap: 8,
        },
        contactBtn: {
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.surfaceOverlay,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: colors.border,
        },

        /* ─── Divider ──────────────────────────────────────────── */
        divider: {
          height: 1,
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
          marginBottom: 12,
        },

        /* ─── Destination Section ──────────────────────────────── */
        destSection: {
          marginBottom: 12,
        },

        /* ─── Arrived Banner ──────────────────────────────────── */
        arrivedBanner: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        },
        arrivedIcon: {
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: "#22C55E20",
          alignItems: "center",
          justifyContent: "center",
        },
        arrivedText: {
          fontSize: 13,
          fontWeight: "700",
          color: "#22C55E",
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },

        /* ─── Waiting Instructions ──────────────────────────────── */
        waitingCard: {
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
          borderRadius: 12,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          padding: 12,
          marginBottom: 12,
        },
        waitingTitle: {
          fontSize: 11,
          fontWeight: "700",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 8,
        },
        waitingItem: {
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 8,
          marginBottom: 6,
        },
        waitingDot: {
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.primary,
          marginTop: 5,
        },
        waitingText: {
          flex: 1,
          fontSize: 12,
          fontWeight: "500",
          color: colors.textSecondary,
          lineHeight: 17,
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
        verifyPinSecondaryBtn: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          paddingVertical: 12,
          borderRadius: 14,
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          marginTop: 10,
        },
        verifyPinSecondaryText: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.primary,
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

  const pickupLat = trip.pickupLatitude;
  const pickupLon = trip.pickupLongitude;

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

        {/* Chat, Safety Center & Trip Info Buttons */}
        <View style={s.sosWrap}>
          <Pressable
            style={[s.sosBtn, { backgroundColor: colors.surfaceOverlay, borderColor: colors.border, borderWidth: 1 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowChatModal(true);
            }}
            accessibilityLabel="Open Chat with Passenger"
          >
            <MessageCircle size={16} color={colors.primary} />
            <Text style={[s.sosLabel, { color: colors.text }]}>Chat</Text>
          </Pressable>

          <Pressable
            style={[s.sosBtn, { backgroundColor: colors.surfaceOverlay, borderColor: colors.border, borderWidth: 1 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowDetailsModal(true);
            }}
            accessibilityLabel="View Trip Details"
          >
            <Info size={16} color={colors.primary} />
            <Text style={[s.sosLabel, { color: colors.text }]}>Details</Text>
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
          {/* ARRIVING: Navigation to pickup                       */}
          {/* ═══════════════════════════════════════════════════════ */}
          {isPickupPhase && (
            <>
              <View style={s.sectionHeader}>
                <View style={s.sectionDot} />
                <Text style={s.sectionLabel}>Pickup</Text>
              </View>
              <Text style={s.addressText} numberOfLines={1}>
                {trip.pickupAddress}
              </Text>
              {trip.pickupLandmark && (
                <Text style={s.landmarkText} numberOfLines={1}>
                  {trip.pickupLandmark}
                </Text>
              )}

              {/* ETA */}
              <View style={s.etaRow}>
                <View style={s.etaItem}>
                  <View style={s.etaIcon}>
                    <Clock size={14} color={colors.textSecondary} />
                  </View>
                  <Text style={s.etaText}>
                    {livePreview
                      ? `${Math.round(livePreview.durationMinutes)} min`
                      : "—"}
                  </Text>
                </View>
                <View style={s.etaItem}>
                  <View style={s.etaIcon}>
                    <MapPin size={14} color={colors.textSecondary} />
                  </View>
                  <Text style={s.etaText}>
                    {livePreview
                      ? `${livePreview.distanceKm.toFixed(1)} km`
                      : "—"}
                  </Text>
                </View>
              </View>

              {/* Passenger */}
              <View style={s.passengerRow}>
                <View style={s.passengerAvatar}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                    {trip.passengerName?.[0] ?? "P"}
                  </Text>
                </View>
                <View style={s.passengerInfo}>
                  <Text style={s.passengerLabel}>Passenger</Text>
                  <Text style={s.passengerName} numberOfLines={1}>
                    {trip.passengerName ?? "Passenger"}
                  </Text>
                </View>
                <View style={s.contactBtns}>
                  {trip.passengerPhone && (
                    <Pressable
                      style={s.contactBtn}
                      onPress={() => Linking.openURL(`tel:${trip.passengerPhone}`)}
                      accessibilityLabel="Call passenger"
                    >
                      <Phone size={18} color={colors.primary} />
                    </Pressable>
                  )}
                  <Pressable
                    style={s.contactBtn}
                    onPress={() => {}}
                    accessibilityLabel="Message passenger"
                  >
                    <MessageCircle size={18} color={colors.primary} />
                  </Pressable>
                </View>
              </View>

              {/* Action */}
              <Pressable
                style={[s.actionBtn, loading && s.actionBtnDisabled]}
                onPress={handleAction}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel={actionLabel}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <>
                    <Navigation size={18} color="#000000" />
                    <Text style={s.actionText}>{actionLabel}</Text>
                  </>
                )}
              </Pressable>

              {/* Navigation Button */}
              {pickupLat && pickupLon && (
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
          {/* ARRIVED: Pickup confirmation + waiting tips           */}
          {/* ═══════════════════════════════════════════════════════ */}
          {isArrived && (
            <>
              {/* Arrived Banner */}
              <View style={s.arrivedBanner}>
                <View style={s.arrivedIcon}>
                  <CheckCircle2 size={14} color="#22C55E" />
                </View>
                <Text style={s.arrivedText}>You've arrived at pickup</Text>
              </View>

              {/* Passenger */}
              <View style={s.passengerRow}>
                <View style={s.passengerAvatar}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                    {trip.passengerName?.[0] ?? "P"}
                  </Text>
                </View>
                <View style={s.passengerInfo}>
                  <Text style={s.passengerLabel}>Passenger</Text>
                  <Text style={s.passengerName} numberOfLines={1}>
                    {trip.passengerName ?? "Passenger"}
                  </Text>
                </View>
                <View style={s.contactBtns}>
                  {trip.passengerPhone && (
                    <Pressable
                      style={s.contactBtn}
                      onPress={() => Linking.openURL(`tel:${trip.passengerPhone}`)}
                      accessibilityLabel="Call passenger"
                    >
                      <Phone size={18} color={colors.primary} />
                    </Pressable>
                  )}
                  <Pressable
                    style={s.contactBtn}
                    onPress={() => {}}
                    accessibilityLabel="Message passenger"
                  >
                    <MessageCircle size={18} color={colors.primary} />
                  </Pressable>
                </View>
              </View>

              {/* Pickup Address */}
              <View style={s.sectionHeader}>
                <View style={[s.sectionDot, { backgroundColor: "#22C55E" }]} />
                <Text style={s.sectionLabel}>Pickup Point</Text>
              </View>
              <Text style={s.addressText} numberOfLines={1}>
                {trip.pickupAddress}
              </Text>
              {trip.pickupLandmark && (
                <Text style={s.landmarkText} numberOfLines={1}>
                  {trip.pickupLandmark}
                </Text>
              )}

              <View style={s.divider} />

              {/* Waiting Instructions */}
              <View style={s.waitingCard}>
                <Text style={s.waitingTitle}>Safe Waiting</Text>
                <View style={s.waitingItem}>
                  <View style={s.waitingDot} />
                  <Text style={s.waitingText}>
                    Park in a safe spot off the main road
                  </Text>
                </View>
                <View style={s.waitingItem}>
                  <View style={s.waitingDot} />
                  <Text style={s.waitingText}>
                    Turn on hazard lights to stay visible
                  </Text>
                </View>
                <View style={s.waitingItem}>
                  <View style={s.waitingDot} />
                  <Text style={s.waitingText}>
                    Keep helmet on until passenger is seated
                  </Text>
                </View>
              </View>

              <View style={s.divider} />

              {/* Start Trip Button */}
              <Pressable
                style={[s.actionBtn, loading && s.actionBtnDisabled]}
                onPress={handleAction}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Start Trip"
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <>
                    <Zap size={18} color="#000000" />
                    <Text style={s.actionText}>START TRIP</Text>
                  </>
                )}
              </Pressable>

              <Pressable
                style={s.verifyPinSecondaryBtn}
                onPress={() => setShowPinSheet(true)}
              >
                <ShieldCheck size={16} color={colors.primary} />
                <Text style={s.verifyPinSecondaryText}>Enter Passenger PIN (Optional)</Text>
              </Pressable>
            </>
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* TRIP PHASE: Navigation to destination                 */}
          {/* ═══════════════════════════════════════════════════════ */}
          {isTripPhase && (
            <>
              {/* Destination */}
              {trip.destinationAddress && (
                <View style={s.destSection}>
                  <View style={s.sectionHeader}>
                    <View style={[s.sectionDot, { backgroundColor: colors.danger }]} />
                    <Text style={s.sectionLabel}>Destination</Text>
                  </View>
                  <Text style={s.addressText} numberOfLines={1}>
                    {trip.destinationAddress}
                  </Text>
                  {trip.destinationLandmark && (
                    <Text style={s.landmarkText} numberOfLines={1}>
                      {trip.destinationLandmark}
                    </Text>
                  )}
                </View>
              )}

              {/* Passenger */}
              <View style={s.passengerRow}>
                <View style={s.passengerAvatar}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                    {trip.passengerName?.[0] ?? "P"}
                  </Text>
                </View>
                <View style={s.passengerInfo}>
                  <Text style={s.passengerLabel}>Passenger</Text>
                  <Text style={s.passengerName} numberOfLines={1}>
                    {trip.passengerName ?? "Passenger"}
                  </Text>
                </View>
                <View style={s.contactBtns}>
                  {trip.passengerPhone && (
                    <Pressable
                      style={s.contactBtn}
                      onPress={() => Linking.openURL(`tel:${trip.passengerPhone}`)}
                      accessibilityLabel="Call passenger"
                    >
                      <Phone size={18} color={colors.primary} />
                    </Pressable>
                  )}
                  <Pressable
                    style={s.contactBtn}
                    onPress={() => {}}
                    accessibilityLabel="Message passenger"
                  >
                    <MessageCircle size={18} color={colors.primary} />
                  </Pressable>
                </View>
              </View>

              {/* Action */}
              <Pressable
                style={[s.actionBtn, loading && s.actionBtnDisabled]}
                onPress={handleAction}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel={actionLabel}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <>
                    <Navigation size={18} color="#000000" />
                    <Text style={s.actionText}>{actionLabel}</Text>
                  </>
                )}
              </Pressable>

              {/* In-App Navigation Button */}
              {trip.destinationLatitude && trip.destinationLongitude && (
                <View style={s.navRow}>
                  <Pressable
                    style={s.navBtn}
                    onPress={() => setShowInAppNav(true)}
                  >
                    <Navigation size={16} color={colors.primary} />
                    <Text style={s.navBtnText}>Navigate to Destination (In-App)</Text>
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
          destinationAddress={isPickupPhase ? trip.pickupAddress : trip.destinationAddress}
          destinationLandmark={isPickupPhase ? trip.pickupLandmark : trip.destinationLandmark}
          destinationLatitude={isPickupPhase ? trip.pickupLatitude : trip.destinationLatitude}
          destinationLongitude={isPickupPhase ? trip.pickupLongitude : trip.destinationLongitude}
          pickupAddress={trip.pickupAddress}
          pickupLandmark={trip.pickupLandmark}
          passengerName={trip.passengerName}
          passengerPhone={trip.passengerPhone}
          riderEarnings={trip.riderEarnings}
          estimatedFare={trip.estimatedFare}
          currency={trip.currency}
          rideType={trip.rideType}
          onClose={() => setShowInAppNav(false)}
          onCallPassenger={() => trip.passengerPhone && Linking.openURL(`tel:${trip.passengerPhone}`)}
        />
      </Modal>

      {/* ─── PIN Verification Sheet ──────────────────────────────── */}
      <PinVerificationSheet
        visible={showPinSheet}
        tripId={trip.id}
        passengerName={trip.passengerName}
        onVerified={handlePinVerified}
        onSkip={handlePinVerified}
        onVerify={onVerifyPin}
      />

      {/* ─── Comprehensive Trip Details Modal ────────────────────── */}
      <Modal
        visible={showDetailsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>Trip Information</Text>
              <Pressable onPress={() => setShowDetailsModal(false)}>
                <X size={22} color={colors.text} />
              </Pressable>
            </View>

            {/* Ride Tier Badge */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {trip.rideType && (
                <View style={{ backgroundColor: colors.primary + "20", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: colors.primary }}>{trip.rideType.toUpperCase()} OKADA</Text>
                </View>
              )}
              {trip.tripPin && (
                <View style={{ backgroundColor: "#22C55E20", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#22C55E" }}>PIN: {trip.tripPin}</Text>
                </View>
              )}
            </View>

            {/* Fare & Earnings Breakdown */}
            {(trip.riderEarnings != null || trip.estimatedFare != null) && (
              <View style={{ flexDirection: "row", gap: 16, backgroundColor: colors.background, padding: 14, borderRadius: 14 }}>
                {trip.riderEarnings != null && (
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textMuted }}>YOUR EARNINGS</Text>
                    <Text style={{ fontSize: 18, fontWeight: "700", color: colors.primary }}>
                      {trip.currency ?? "GHS"} {Number(trip.riderEarnings).toFixed(2)}
                    </Text>
                  </View>
                )}
                {trip.estimatedFare != null && (
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textMuted }}>ESTIMATED FARE</Text>
                    <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>
                      {trip.currency ?? "GHS"} {Number(trip.estimatedFare).toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Route Addresses */}
            <View style={{ gap: 12, backgroundColor: colors.background, padding: 14, borderRadius: 14 }}>
              <View style={{ gap: 4 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />
                  <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textMuted }}>PICKUP LOCATION</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, paddingLeft: 14 }}>
                  {trip.pickupAddress}
                </Text>
                {trip.pickupLandmark && (
                  <Text style={{ fontSize: 12, color: colors.primary, paddingLeft: 14 }}>
                    Landmark: {trip.pickupLandmark}
                  </Text>
                )}
              </View>

              {trip.destinationAddress && (
                <View style={{ gap: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger }} />
                    <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textMuted }}>DESTINATION</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, paddingLeft: 14 }}>
                    {trip.destinationAddress}
                  </Text>
                  {trip.destinationLandmark && (
                    <Text style={{ fontSize: 12, color: colors.primary, paddingLeft: 14 }}>
                      Landmark: {trip.destinationLandmark}
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* Passenger Info */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.background, padding: 14, borderRadius: 14 }}>
              <View>
                <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textMuted }}>PASSENGER</Text>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>{trip.passengerName ?? "Passenger"}</Text>
                {trip.passengerPhone && (
                  <Text style={{ fontSize: 13, color: colors.textSecondary }}>{trip.passengerPhone}</Text>
                )}
              </View>

              {trip.passengerPhone && (
                <Pressable
                  style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary + "20", alignItems: "center", justifyContent: "center" }}
                  onPress={() => Linking.openURL(`tel:${trip.passengerPhone}`)}
                >
                  <Phone size={20} color={colors.primary} />
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Safety Center ──────────────────────────────────────── */}
      <SafetyCenter
        visible={showSafetyCenter}
        onClose={() => setShowSafetyCenter(false)}
        tripId={trip.id}
        tripKind={trip.kind}
        passengerName={trip.passengerName}
        passengerPhone={trip.passengerPhone}
        pickupAddress={trip.pickupAddress}
        destinationAddress={trip.destinationAddress}
        pickupLatitude={trip.pickupLatitude}
        pickupLongitude={trip.pickupLongitude}
      />

      {/* ─── Trip Chat Modal ────────────────────────────────────── */}
      <TripChatModal
        visible={showChatModal}
        tripId={trip.id}
        onClose={() => setShowChatModal(false)}
      />

      {/* ─── PIN Verification Sheet ─────────────────────────────── */}
      <PinVerificationSheet
        visible={showPinSheet}
        tripId={trip.id}
        passengerName={trip.passengerName}
        onVerify={onVerifyPin}
        onVerified={handlePinVerified}
        onSkip={() => {
          setShowPinSheet(false);
          onAdvance();
        }}
      />
    </View>
  );
}
