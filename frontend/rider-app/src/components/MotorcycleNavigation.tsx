import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronRight,
  Clock,
  Info,
  MapPin,
  MessageCircle,
  Navigation,
  Package,
  Phone,
  ShieldAlert,
  User,
  X,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { AppMap } from "@/components/AppMap";
import { TripChatModal } from "@/components/TripChatModal";
import { SafetyCenter } from "@/components/SafetyCenter";
import { useTheme } from "@/context/ThemeContext";
import { useLiveRoutePreview } from "@/hooks/useLiveRoutePreview";
import { useUserLocation } from "@/hooks/useUserLocation";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { isOffRoute } from "@/lib/geo";
import { openGoogleMapsNavigation, openWazeNavigation } from "@/lib/navigation";
import { brand, layers } from "@/theme/design-system";

type NavigationStep = {
  instruction: string;
  distance: number;
  maneuver: "left" | "right" | "straight" | "uturn" | "arrive";
};

type Props = {
  destinationAddress?: string;
  destinationLandmark?: string;
  destinationLatitude?: number;
  destinationLongitude?: number;
  pickupAddress?: string;
  pickupLandmark?: string;
  passengerName?: string;
  passengerPhone?: string;
  riderEarnings?: number;
  estimatedFare?: number;
  currency?: string;
  rideType?: string;
  packageDetails?: string;
  tripId?: string;
  onClose?: () => void;
  onCallPassenger?: () => void;
  onSos?: () => void;
  onChat?: () => void;
};

/**
 * MotorcycleNavigation — Optimized navigation for motorcycle riders.
 *
 * Large, glanceable UI designed for motorcycle use.
 * Turn-by-turn instructions, upcoming turns, ETA, distance.
 *
 * Layout:
 * ┌─────────────────────────────────┐
 * │  [SOS]              [✕ Close]  │ ← Top bar
 * │                                 │
 * │         MAP (full screen)       │ ← Navigation map
 * │                                 │
 * │  ┌─────────────────────────────┐│
 * │  │  ← Turn left in 200m       ││ ← Current instruction (LARGE)
 * │  │  onto Oxford Street         ││
 * │  └─────────────────────────────┘│
 * │  ┌───────┐ ┌───────┐ ┌───────┐ │
 * │  │ 2.3km │ │ 8 min │ │ 4:32  │ │ ← Stats row
 * │  │dist   │ │ ETA   │ │arrive │ │
 * │  └───────┘ └───────┘ └───────┘ │
 * │  ┌─────────────────────────────┐│
 * │  │  → Then turn right onto     ││ ← Next instruction
 * │  │  Cantonments Road           ││
 * │  └─────────────────────────────┘│
 * │  ┌─────────────────────────────┐│
 * │  │  📞 Call Kwame A.           ││ ← Passenger quick action
 * │  └─────────────────────────────┘│
 * └─────────────────────────────────┘
 */
export function MotorcycleNavigation({
  destinationAddress,
  destinationLandmark,
  destinationLatitude,
  destinationLongitude,
  pickupAddress,
  pickupLandmark,
  passengerName,
  passengerPhone,
  riderEarnings,
  estimatedFare,
  currency = "GHS",
  rideType,
  packageDetails,
  tripId,
  onClose,
  onCallPassenger,
  onSos,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { session } = useApp();
  const [showSafetyCenter, setShowSafetyCenter] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);

  const [currentStep, setCurrentStep] = useState(0);
  const [offRoute, setOffRoute] = useState(false);

  const { latitude: riderLat, longitude: riderLng } = useUserLocation();

  // Live route preview — refresh every 15s during active navigation
  const livePreview = useLiveRoutePreview(
    session?.token,
    riderLat && riderLng ? { latitude: riderLat, longitude: riderLng } : null,
    destinationLatitude && destinationLongitude
      ? { latitude: destinationLatitude, longitude: destinationLongitude }
      : null,
    true,
    15000,
  );

  // Route steps — from live preview API data
  const steps: NavigationStep[] = useMemo(() => {
    if (livePreview?.steps && livePreview.steps.length > 0) {
      return livePreview.steps.map((s) => ({
        instruction: s.instruction,
        distance: s.distanceMeters,
        maneuver: s.maneuver,
      }));
    }
    // Fallback: single "Continue" step if no route data yet
    if (livePreview?.distanceKm) {
      return [
        { instruction: "Continue to destination", distance: Math.round(livePreview.distanceKm * 1000), maneuver: "straight" },
      ];
    }
    return [];
  }, [livePreview?.steps, livePreview?.distanceKm]);

  // Advance step when route data updates
  useEffect(() => {
    if (livePreview?.steps && livePreview.steps.length > 0) {
      setCurrentStep(0);
    }
  }, [livePreview?.steps?.length, livePreview?.distanceKm]);

  const routeCoordinates = useMemo(() => {
    if (livePreview?.route && livePreview.route.length > 0) {
      return livePreview.route.map(([lat, lon]) => ({ latitude: lat, longitude: lon }));
    }
    if (riderLat && riderLng && destinationLatitude && destinationLongitude) {
      return [
        { latitude: riderLat, longitude: riderLng },
        { latitude: destinationLatitude, longitude: destinationLongitude },
      ];
    }
    return undefined;
  }, [livePreview, riderLat, riderLng, destinationLatitude, destinationLongitude]);

  // Off-route detection
  useEffect(() => {
    if (!routeCoordinates || routeCoordinates.length < 2 || !riderLat || !riderLng) return;

    const checkOffRoute = () => {
      const routeCoords = routeCoordinates.map((c) => ({
        latitude: c.latitude,
        longitude: c.longitude,
      }));
      const isCurrentlyOffRoute = isOffRoute(
        { latitude: riderLat, longitude: riderLng },
        routeCoords,
        50, // 50m threshold
      );

      if (isCurrentlyOffRoute && !offRoute) {
        setOffRoute(true);
        // Trigger immediate route refresh
        setCurrentStep(0);
      } else if (!isCurrentlyOffRoute && offRoute) {
        setOffRoute(false);
      }
    };

    checkOffRoute();
    const timer = setInterval(checkOffRoute, 5000);
    return () => clearInterval(timer);
  }, [riderLat, riderLng, routeCoordinates, offRoute]);

  // Auto-advance step when rider is close to the current step's end point
  useEffect(() => {
    if (!livePreview?.steps || livePreview.steps.length === 0 || !riderLat || !riderLng) return;

    const checkAdvance = () => {
      const rawSteps = livePreview.steps!;
      if (currentStep >= rawSteps.length - 1) return;

      const target = rawSteps[currentStep];
      if (!target) return;

      const R = 6371e3;
      const toRad = (d: number) => (d * Math.PI) / 180;
      const dLat = toRad(target.endLat - riderLat);
      const dLon = toRad(target.endLon - riderLng);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(riderLat)) * Math.cos(toRad(target.endLat)) * Math.sin(dLon / 2) ** 2;
      const distM = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      if (distM < 40) {
        setCurrentStep((prev) => Math.min(prev + 1, rawSteps.length - 1));
      }
    };

    checkAdvance();
    const timer = setInterval(checkAdvance, 3000);
    return () => clearInterval(timer);
  }, [riderLat, riderLng, livePreview?.steps, currentStep]);

  const step = steps[currentStep];
  const nextStep = steps[currentStep + 1];

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
    if (destinationLatitude && destinationLongitude) {
      m.push({
        id: "destination",
        latitude: destinationLatitude,
        longitude: destinationLongitude,
        title: "Destination",
        pinColor: colors.danger,
      });
    }
    return m;
  }, [riderLat, riderLng, destinationLatitude, destinationLongitude, colors.danger]);

  // Safety button opens SafetyCenter
  function openSafety() {
    setShowSafetyCenter(true);
  }

  function getManeuverIcon(maneuver: NavigationStep["maneuver"]) {
    switch (maneuver) {
      case "left":
        return <ArrowLeft size={32} color="#000000" />;
      case "right":
        return <ArrowRight size={32} color="#000000" />;
      case "uturn":
        return <ArrowDown size={32} color="#000000" style={{ transform: [{ rotate: "180deg" }] }} />;
      case "arrive":
        return <MapPin size={32} color="#000000" />;
      default:
        return <ArrowUp size={32} color="#000000" />;
    }
  }

  function formatDistance(meters: number): string {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters} m`;
  }

  const s = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.bg,
        },

        /* ─── Map Area ───────────────────────────────────────── */
        mapArea: {
          flex: 1,
          position: "relative",
        },

        /* ─── Top Bar ────────────────────────────────────────── */
        topBar: {
          position: "absolute",
          top: insets.top + 8,
          left: 16,
          right: 16,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: layers.floatingAction,
        },
        sosBtn: {
          minWidth: 56,
          height: 48,
          borderRadius: 24,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          backgroundColor: isDark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.9)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 4,
        },
        safetyText: {
          fontSize: 14,
          fontWeight: "700",
          color: "#3B82F6",
        },
        closeBtn: {
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: isDark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.9)",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 4,
        },

        /* ─── Bottom Panel ───────────────────────────────────── */
        bottomPanel: {
          backgroundColor: isDark ? colors.surface : "#FFFFFF",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: isDark ? 0.5 : 0.18,
          shadowRadius: 20,
          elevation: 12,
          paddingBottom: insets.bottom + 12,
        },
        panelContent: {
          paddingHorizontal: 20,
          paddingTop: 16,
        },

        /* ─── Current Instruction (LARGE) ────────────────────── */
        instructionCard: {
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
          borderRadius: 16,
          padding: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 16,
          marginBottom: 16,
        },
        maneuverIcon: {
          width: 56,
          height: 56,
          borderRadius: 16,
          backgroundColor: brand.primary,
          alignItems: "center",
          justifyContent: "center",
        },
        instructionText: {
          flex: 1,
        },
        instructionMain: {
          fontSize: 20,
          fontWeight: "700",
          color: colors.text,
          lineHeight: 26,
          marginBottom: 4,
        },
        instructionDistance: {
          fontSize: 16,
          fontWeight: "600",
          color: brand.primary,
        },

        /* ─── Stats Row ──────────────────────────────────────── */
        statsRow: {
          flexDirection: "row",
          gap: 12,
          marginBottom: 16,
        },
        statCard: {
          flex: 1,
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
          borderRadius: 12,
          padding: 12,
          alignItems: "center",
        },
        statValue: {
          fontSize: 22,
          fontWeight: "700",
          color: colors.text,
          marginBottom: 2,
        },
        statLabel: {
          fontSize: 11,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },

        /* ─── Next Instruction ────────────────────────────────── */
        nextCard: {
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
          borderRadius: 12,
          padding: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        },
        nextIcon: {
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: colors.surfaceOverlay,
          alignItems: "center",
          justifyContent: "center",
        },
        nextText: {
          flex: 1,
        },
        nextLabel: {
          fontSize: 11,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 2,
        },
        nextInstruction: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.textSecondary,
        },

        /* ─── Passenger Action ────────────────────────────────── */
        passengerBtn: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          height: 48,
          borderRadius: 12,
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        },
        passengerText: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.textSecondary,
        },

        /* ─── Destination Badge ───────────────────────────────── */
        destinationBadge: {
          position: "absolute",
          bottom: 16,
          left: 16,
          right: 16,
          backgroundColor: isDark ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.95)",
          borderRadius: 12,
          padding: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 4,
        },
        destinationIcon: {
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: brand.primary + "20",
          alignItems: "center",
          justifyContent: "center",
        },
        destinationInfo: {
          flex: 1,
        },
        destinationLabel: {
          fontSize: 10,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
        destinationName: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.text,
          marginTop: 2,
        },
        destinationActions: {
          flexDirection: "row",
          gap: 8,
        },
        destActionBtn: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.surfaceOverlay,
          alignItems: "center",
          justifyContent: "center",
        },
      }),
    [colors, isDark, insets],
  );

  return (
    <View style={s.container}>
      {/* ─── Map Area ───────────────────────────────────────── */}
      <View style={s.mapArea}>
        <AppMap
          markers={markers}
          routeCoordinates={routeCoordinates}
          fitToMarkers={markers.length > 0}
          showCenterButton={false}
        />

        {/* Top Bar */}
        <View style={s.topBar}>
          <Pressable
            style={s.sosBtn}
            onPress={openSafety}
            accessibilityLabel="Open safety center"
          >
            <ShieldAlert size={16} color="#FFFFFF" />
            <Text style={s.safetyText}>Safety</Text>
          </Pressable>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              style={s.closeBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowChatModal(true);
              }}
              accessibilityLabel="Open Chat"
            >
              <MessageCircle size={20} color={colors.primary} />
            </Pressable>

            <Pressable
              style={s.closeBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowInfoModal(true);
              }}
              accessibilityLabel="View ride details"
            >
              <Info size={20} color={colors.primary} />
            </Pressable>

            <Pressable
              style={s.closeBtn}
              onPress={onClose}
              accessibilityLabel="Close navigation"
            >
              <X size={20} color={colors.text} />
            </Pressable>
          </View>
        </View>

        {/* Destination Badge on Map */}
        {destinationAddress && (
          <View style={s.destinationBadge}>
            <View style={s.destinationIcon}>
              <MapPin size={16} color={brand.primary} />
            </View>
            <View style={s.destinationInfo}>
              <Text style={s.destinationLabel}>Destination</Text>
              <Text style={s.destinationName} numberOfLines={1}>
                {destinationAddress}
              </Text>
            </View>
            {passengerPhone && (
              <View style={s.destinationActions}>
                <Pressable
                  style={s.destActionBtn}
                  onPress={onCallPassenger}
                  accessibilityLabel="Call passenger"
                >
                  <Phone size={16} color={colors.primary} />
                </Pressable>
              </View>
            )}
          </View>
        )}
      </View>

      {/* ─── Bottom Panel ───────────────────────────────────── */}
      <View style={s.bottomPanel}>
        <View style={s.panelContent}>
          {/* Off-route Warning Banner */}
          {offRoute && (
            <View style={{
              backgroundColor: "#FEF3C7",
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              borderWidth: 1,
              borderColor: "#F59E0B",
            }}>
              <AlertTriangle size={18} color="#D97706" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#92400E" }}>
                  Off Route — Recalculating
                </Text>
                <Text style={{ fontSize: 11, color: "#B45309", marginTop: 1 }}>
                  Follow the updated route below
                </Text>
              </View>
            </View>
          )}

          {/* Current Instruction (LARGE for glanceability) */}
          <View style={s.instructionCard}>
            <View style={s.maneuverIcon}>
              {getManeuverIcon(step.maneuver)}
            </View>
            <View style={s.instructionText}>
              <Text style={s.instructionMain} numberOfLines={2}>
                {step.instruction}
              </Text>
              <Text style={s.instructionDistance}>
                in {formatDistance(step.distance)}
              </Text>
            </View>
          </View>

          {/* Stats Row */}
          <View style={s.statsRow}>
            <View style={s.statCard}>
              <Text style={s.statValue}>
                {livePreview ? livePreview.distanceKm.toFixed(1) : "—"}
              </Text>
              <Text style={s.statLabel}>km left</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statValue}>
                {livePreview ? Math.round(livePreview.durationMinutes) : "—"}
              </Text>
              <Text style={s.statLabel}>min</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statValue}>
                {livePreview
                  ? new Date(
                      Date.now() + livePreview.durationMinutes * 60 * 1000,
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </Text>
              <Text style={s.statLabel}>arrive</Text>
            </View>
          </View>

          {/* Next Instruction */}
          {nextStep && (
            <View style={s.nextCard}>
              <View style={s.nextIcon}>
                <ChevronRight size={18} color={colors.textMuted} />
              </View>
              <View style={s.nextText}>
                <Text style={s.nextLabel}>Then</Text>
                <Text style={s.nextInstruction} numberOfLines={1}>
                  {nextStep.instruction} ({formatDistance(nextStep.distance)})
                </Text>
              </View>
            </View>
          )}

          {/* Passenger Quick Action */}
          {passengerName && (
            <Pressable
              style={s.passengerBtn}
              onPress={onCallPassenger}
              accessibilityRole="button"
              accessibilityLabel={`Call ${passengerName}`}
            >
              <Phone size={16} color={colors.primary} />
              <Text style={s.passengerText}>Call {passengerName}</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Trip / Delivery Details Modal Overlay */}
      <Modal
        visible={showInfoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 16 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>Ride Details</Text>
              <Pressable onPress={() => setShowInfoModal(false)}>
                <X size={20} color={colors.text} />
              </Pressable>
            </View>

            {rideType && (
              <View style={{ backgroundColor: brand.primary + "20", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignSelf: "flex-start" }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: brand.primary }}>{rideType.toUpperCase()}</Text>
              </View>
            )}

            {(riderEarnings != null || estimatedFare != null) && (
              <View style={{ flexDirection: "row", gap: 16, backgroundColor: colors.background, padding: 12, borderRadius: 12 }}>
                {riderEarnings != null ? (
                  <View>
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>Your Earnings</Text>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: colors.primary }}>{currency} {Number(riderEarnings).toFixed(2)}</Text>
                  </View>
                ) : null}
                {estimatedFare != null ? (
                  <View>
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>Est. Fare</Text>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>{currency} {Number(estimatedFare).toFixed(2)}</Text>
                  </View>
                ) : null}
              </View>
            )}

            {pickupAddress && (
              <View style={{ gap: 4 }}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted }}>PICKUP</Text>
                <Text style={{ fontSize: 14, color: colors.text }}>{pickupAddress}</Text>
                {pickupLandmark ? <Text style={{ fontSize: 12, color: colors.primary }}>Landmark: {pickupLandmark}</Text> : null}
              </View>
            )}

            {destinationAddress && (
              <View style={{ gap: 4 }}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted }}>DESTINATION</Text>
                <Text style={{ fontSize: 14, color: colors.text }}>{destinationAddress}</Text>
                {destinationLandmark ? <Text style={{ fontSize: 12, color: colors.primary }}>Landmark: {destinationLandmark}</Text> : null}
              </View>
            )}

            {passengerName && (
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
                <View>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>Passenger</Text>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{passengerName}</Text>
                </View>
                {passengerPhone && (
                  <Pressable style={{ padding: 10, borderRadius: 20, backgroundColor: brand.primary + "20" }} onPress={onCallPassenger}>
                    <Phone size={18} color={colors.primary} />
                  </Pressable>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Safety Center */}
      <SafetyCenter
        visible={showSafetyCenter}
        onClose={() => setShowSafetyCenter(false)}
      />

      {/* Trip Chat Modal */}
      {tripId && (
        <TripChatModal
          visible={showChatModal}
          tripId={tripId}
          onClose={() => setShowChatModal(false)}
        />
      )}
    </View>
  );
}
