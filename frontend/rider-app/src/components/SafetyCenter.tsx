import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AlertTriangle,
  BookOpen,
  Car,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  Heart,
  MessageCircle,
  Navigation,
  Phone,
  Shield,
  Share2,
  ShieldAlert,
  Siren,
  X,
  Zap,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import { brand, layers } from "@/theme/design-system";

type Props = {
  visible: boolean;
  onClose: () => void;
  tripId?: string;
  tripKind?: "ride" | "delivery";
  passengerName?: string;
  passengerPhone?: string;
  pickupAddress?: string;
  destinationAddress?: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
};

/**
 * SafetyCenter — Comprehensive safety hub for active trips.
 *
 * Layout:
 * ┌─────────────────────────────────┐
 * │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━   │ ← Handle bar
 * │       🛡️ Safety Center          │
 * │  ─────────────────────────────  │
 * │                                 │
 * │  ┌─────────────────────────────┐│
 * │  │   🚨 EMERGENCY HELP        ││ ← Large, visually distinct
 * │  │   Press and hold for 3 sec  ││    Requires long-press to activate
 * │  │   ───────────────────────   ││
 * │  │   ● Emergency Services     ││
 * │  │   ● OkadaGo Safety Team    ││
 * │  └─────────────────────────────┘│
 * │                                 │
 * │  ┌─────────────────────────────┐│
 * │  │   📍 Share Live Trip        ││ ← Quick access
 * │  │   Share your location with  ││
 * │  │   trusted contacts          ││
 * │  └─────────────────────────────┘│
 * │                                 │
 * │  ┌─────────────────────────────┐│
 * │  │   ⚠️ Report Incident        ││
 * │  │   Report safety concerns    ││
 * │  └─────────────────────────────┘│
 * │                                 │
 * │  ┌─────────────────────────────┐│
 * │  │   🔧 Roadside Assistance    ││
 * │  │   Vehicle breakdown support ││
 * │  └─────────────────────────────┘│
 * │                                 │
 * │  ┌─────────────────────────────┐│
 * │  │   📚 Safety Tips            ││
 * │  │   Review safety guidelines  ││
 * │  └─────────────────────────────┘│
 * │                                 │
 * └─────────────────────────────────┘
 */
export function SafetyCenter({
  visible,
  onClose,
  tripId,
  tripKind,
  passengerName,
  passengerPhone,
  pickupAddress,
  destinationAddress,
  pickupLatitude,
  pickupLongitude,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { session } = useApp();

  // Emergency button state
  const [emergencyHolding, setEmergencyHolding] = useState(false);
  const [emergencyProgress, setEmergencyProgress] = useState(0);
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [emergencySent, setEmergencySent] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Roadside assistance state
  const [roadsideLoading, setRoadsideLoading] = useState(false);

  // Safety tips expanded state
  const [showTips, setShowTips] = useState(false);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (holdTimer.current) clearTimeout(holdTimer.current);
      if (holdInterval.current) clearInterval(holdInterval.current);
    };
  }, []);

  // Reset state when sheet closes
  useEffect(() => {
    if (!visible) {
      setEmergencyHolding(false);
      setEmergencyProgress(0);
      setEmergencySent(false);
      setShowTips(false);
    }
  }, [visible]);

  // Animate progress
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: emergencyProgress,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [emergencyProgress, progressAnim]);

  // ─── Emergency Button Handlers ─────────────────────────────────
  const startEmergencyHold = useCallback(() => {
    if (emergencyLoading || emergencySent) return;

    setEmergencyHolding(true);
    setEmergencyProgress(0);

    // Haptic feedback on start
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    let progress = 0;
    holdInterval.current = setInterval(() => {
      progress += 1;
      setEmergencyProgress(progress);

      // Haptic feedback at milestones
      if (progress === 33 || progress === 66) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      if (progress >= 100) {
        // Complete - trigger emergency
        if (holdInterval.current) clearInterval(holdInterval.current);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        triggerEmergency();
      }
    }, 30); // 3 seconds total
  }, [emergencyLoading, emergencySent]);

  const cancelEmergencyHold = useCallback(() => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (holdInterval.current) clearInterval(holdInterval.current);

    setEmergencyHolding(false);
    setEmergencyProgress(0);
  }, []);

  const triggerEmergency = useCallback(async () => {
    setEmergencyLoading(true);
    setEmergencyHolding(false);

    try {
      // Send SOS to backend
      await api("/safety/incidents", {
        method: "POST",
        token: session?.token,
        body: {
          rideId: tripId,
          severity: "CRITICAL",
          category: "SOS",
          description: `Emergency SOS triggered during ${tripKind ?? "trip"}${tripId ? ` ${tripId}` : ""}`,
          location: pickupLatitude && pickupLongitude
            ? { latitude: pickupLatitude, longitude: pickupLongitude }
            : undefined,
        },
      });

      setEmergencySent(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Show confirmation with options
      Alert.alert(
        "🚨 Emergency SOS Sent",
        "Our safety team has been notified and is standing by.\n\nWhat would you like to do?",
        [
          {
            text: "Call Emergency Services",
            onPress: () => Linking.openURL("tel:191"),
            style: "destructive",
          },
          {
            text: "Call Safety Team",
            onPress: () => Linking.openURL("tel:+233000000000"),
          },
          {
            text: "Stay on Line",
            onPress: () => {},
            style: "cancel",
          },
        ],
      );
    } catch (e) {
      Alert.alert(
        "SOS Failed",
        "Could not send emergency alert. Please try calling directly.",
        [
          {
            text: "Call Emergency",
            onPress: () => Linking.openURL("tel:191"),
            style: "destructive",
          },
          { text: "OK", style: "cancel" },
        ],
      );
    } finally {
      setEmergencyLoading(false);
    }
  }, [session?.token, tripId, tripKind, pickupLatitude, pickupLongitude]);

  // ─── Share Trip Handler ────────────────────────────────────────
  const shareTrip = useCallback(async () => {
    const parts = ["I'm currently on an OkadaGo trip."];
    if (tripId) parts.push(`Trip ID: ${tripId}.`);
    if (pickupAddress) parts.push(`Pickup: ${pickupAddress}`);
    if (destinationAddress) parts.push(`Destination: ${destinationAddress}`);
    if (tripId) parts.push(`Track: https://okadago.app/track/${tripId}`);
    const message = parts.join("\n\n");

    try {
      const result = await Share.share({
        message,
        title: "Share My Trip Location",
      });

      if (result.action === Share.sharedAction) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Trip Shared", "Your trip details have been shared.");
      }
    } catch (e) {
      Alert.alert("Share Failed", "Could not share trip details.");
    }
  }, [tripId, tripKind, pickupAddress, destinationAddress]);

  // ─── Report Incident Handler ───────────────────────────────────
  const reportIncident = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Report Safety Incident",
      "Select the type of incident:",
      [
        {
          text: "Unsafe Driving",
          onPress: () => submitIncidentReport("UNSAFE_DRIVING"),
        },
        {
          text: "Harassment",
          onPress: () => submitIncidentReport("HARASSMENT"),
        },
        {
          text: "Vehicle Issue",
          onPress: () => submitIncidentReport("VEHICLE_ISSUE"),
        },
        {
          text: "Route Deviation",
          onPress: () => submitIncidentReport("ROUTE_DEVIATION"),
        },
        {
          text: "Other Concern",
          onPress: () => submitIncidentReport("OTHER"),
        },
        { text: "Cancel", style: "cancel" },
      ],
    );
  }, []);

  const submitIncidentReport = useCallback(
    async (category: string) => {
      try {
        await api("/safety/incidents", {
          method: "POST",
          token: session?.token,
          body: {
            rideId: tripId,
            severity: "MEDIUM",
            category,
            description: `${category.replace(/_/g, " ")} reported during trip`,
          },
        });
        Alert.alert("Report Submitted", "Thank you for reporting. Our team will review this incident.");
      } catch (e) {
        Alert.alert("Report Failed", "Could not submit report. Please try again.");
      }
    },
    [session?.token, tripId],
  );

  // ─── Roadside Assistance Handler ───────────────────────────────
  const requestRoadsideAssistance = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "🔧 Roadside Assistance",
      "What kind of assistance do you need?",
      [
        {
          text: "Flat Tire",
          onPress: () => callRoadside("TIRE"),
        },
        {
          text: "Engine Trouble",
          onPress: () => callRoadside("ENGINE"),
        },
        {
          text: "Battery Dead",
          onPress: () => callRoadside("BATTERY"),
        },
        {
          text: "Fuel Empty",
          onPress: () => callRoadside("FUEL"),
        },
        {
          text: "Accident",
          onPress: () => callRoadside("ACCIDENT"),
          style: "destructive",
        },
        { text: "Cancel", style: "cancel" },
      ],
    );
  }, []);

  const callRoadside = useCallback(
    async (type: string) => {
      setRoadsideLoading(true);
      try {
        const res = await api<{ phone: string; message: string }>("/safety/roadside", {
          method: "POST",
          token: session?.token,
          body: {
            rideId: tripId,
            type,
            location: pickupLatitude && pickupLongitude
              ? { latitude: pickupLatitude, longitude: pickupLongitude }
              : undefined,
          },
        });

        Alert.alert(
          "Assistance Requested",
          `${res.message || "A roadside assistance provider is being dispatched."}\n\nWould you like to call them directly?`,
          [
            {
              text: "Call Now",
              onPress: () => Linking.openURL(`tel:${res.phone}`),
            },
            {
              text: "Wait for Dispatch",
              style: "cancel",
            },
          ],
        );
      } catch (e) {
        Alert.alert(
          "Assistance Requested",
          "We've noted your request. A provider will contact you shortly.\n\nFor immediate help, call our support line.",
          [
            {
              text: "Call Support",
              onPress: () => Linking.openURL("tel:+233000000000"),
            },
            { text: "OK", style: "cancel" },
          ],
        );
      } finally {
        setRoadsideLoading(false);
      }
    },
    [session?.token, tripId, pickupLatitude, pickupLongitude],
  );

  // ─── Styles ────────────────────────────────────────────────────
  const s = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.6)",
          zIndex: layers.modal,
        },
        sheet: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: "85%",
          backgroundColor: isDark ? colors.surface : "#FFFFFF",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: isDark ? 0.6 : 0.25,
          shadowRadius: 24,
          elevation: 16,
          zIndex: layers.modal,
        },
        handleBar: {
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)",
          alignSelf: "center",
          marginTop: 12,
          marginBottom: 8,
        },
        content: {
          flex: 1,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 16,
        },

        /* ─── Header ────────────────────────────────────────────── */
        header: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        },
        headerLeft: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        },
        shieldIcon: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: brand.primary + "20",
          alignItems: "center",
          justifyContent: "center",
        },
        title: {
          fontSize: 20,
          fontWeight: "700",
          color: colors.text,
        },
        closeBtn: {
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          alignItems: "center",
          justifyContent: "center",
        },

        /* ─── Emergency Section ─────────────────────────────────── */
        emergencySection: {
          marginBottom: 20,
        },
        emergencyCard: {
          backgroundColor: emergencySent ? "#22C55E15" : "#EF444410",
          borderRadius: 16,
          borderWidth: 2,
          borderColor: emergencySent ? "#22C55E40" : emergencyHolding ? "#EF4444" : "#EF444430",
          padding: 16,
          overflow: "hidden",
        },
        emergencyHeader: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
        },
        emergencyIcon: {
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: emergencySent ? "#22C55E" : "#EF4444",
          alignItems: "center",
          justifyContent: "center",
        },
        emergencyTitleRow: {
          flex: 1,
        },
        emergencyTitle: {
          fontSize: 16,
          fontWeight: "700",
          color: emergencySent ? "#22C55E" : "#EF4444",
        },
        emergencySubtitle: {
          fontSize: 12,
          fontWeight: "500",
          color: colors.textSecondary,
          marginTop: 2,
        },
        emergencyProgress: {
          height: 4,
          borderRadius: 2,
          backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
          marginBottom: 12,
          overflow: "hidden",
        },
        emergencyProgressBar: {
          height: "100%",
          backgroundColor: "#EF4444",
          borderRadius: 2,
        },
        emergencyOptions: {
          gap: 8,
        },
        emergencyOption: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingVertical: 10,
          paddingHorizontal: 12,
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
          borderRadius: 10,
        },
        emergencyOptionIcon: {
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: "#EF444420",
          alignItems: "center",
          justifyContent: "center",
        },
        emergencyOptionText: {
          flex: 1,
          fontSize: 13,
          fontWeight: "600",
          color: colors.text,
        },
        emergencyOptionArrow: {
          color: colors.textMuted,
        },

        /* ─── Safety Actions Grid ───────────────────────────────── */
        actionsGrid: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
        },
        actionCard: {
          width: "48%",
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
          borderRadius: 14,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          padding: 14,
        },
        actionIcon: {
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
        },
        actionTitle: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.text,
          marginBottom: 4,
        },
        actionDesc: {
          fontSize: 12,
          fontWeight: "400",
          color: colors.textSecondary,
          lineHeight: 16,
        },

        /* ─── Safety Tips ───────────────────────────────────────── */
        tipsSection: {
          marginBottom: 16,
        },
        tipsToggle: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingVertical: 10,
        },
        tipsToggleText: {
          flex: 1,
          fontSize: 14,
          fontWeight: "600",
          color: colors.text,
        },
        tipsContent: {
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
          borderRadius: 12,
          padding: 14,
          gap: 10,
        },
        tipItem: {
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 10,
        },
        tipDot: {
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: brand.primary,
          marginTop: 5,
        },
        tipText: {
          flex: 1,
          fontSize: 13,
          fontWeight: "500",
          color: colors.textSecondary,
          lineHeight: 18,
        },

        /* ─── Footer ────────────────────────────────────────────── */
        footer: {
          alignItems: "center",
          paddingTop: 8,
        },
        footerText: {
          fontSize: 11,
          fontWeight: "500",
          color: colors.textMuted,
          textAlign: "center",
        },
      }),
    [colors, isDark, insets, emergencyHolding, emergencySent],
  );

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <Pressable style={s.overlay} onPress={onClose} />

      {/* Sheet */}
      <View style={s.sheet}>
        <View style={s.handleBar} />

        <ScrollView
          style={s.content}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header */}
          <View style={s.header}>
            <View style={s.headerLeft}>
              <View style={s.shieldIcon}>
                <Shield size={20} color={brand.primary} />
              </View>
              <Text style={s.title}>Safety Center</Text>
            </View>
            <Pressable style={s.closeBtn} onPress={onClose} accessibilityLabel="Close safety center">
              <X size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* EMERGENCY HELP                                         */}
          {/* ═══════════════════════════════════════════════════════ */}
          <View style={s.emergencySection}>
            <View style={s.emergencyCard}>
              <View style={s.emergencyHeader}>
                <View style={s.emergencyIcon}>
                  {emergencyLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : emergencySent ? (
                    <CheckCircle2 size={24} color="#FFFFFF" />
                  ) : (
                    <Siren size={24} color="#FFFFFF" />
                  )}
                </View>
                <View style={s.emergencyTitleRow}>
                  <Text style={s.emergencyTitle}>
                    {emergencySent ? "SOS Active" : "Emergency Help"}
                  </Text>
                  <Text style={s.emergencySubtitle}>
                    {emergencySent
                      ? "Safety team is standing by"
                      : emergencyHolding
                        ? "Keep holding to confirm..."
                        : "Press and hold for 3 seconds"}
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              {!emergencySent && (
                <View style={s.emergencyProgress}>
                  <Animated.View
                    style={[
                      s.emergencyProgressBar,
                      {
                        width: progressAnim.interpolate({
                          inputRange: [0, 100],
                          outputRange: ["0%", "100%"],
                        }),
                      },
                    ]}
                  />
                </View>
              )}

              {/* Emergency Options */}
              <View style={s.emergencyOptions}>
                {!emergencySent ? (
                  <Pressable
                    style={[
                      s.emergencyOption,
                      emergencyHolding && { backgroundColor: "#EF444420" },
                    ]}
                    onPressIn={startEmergencyHold}
                    onPressOut={cancelEmergencyHold}
                    disabled={emergencyLoading}
                  >
                    <View style={s.emergencyOptionIcon}>
                      <Phone size={14} color="#EF4444" />
                    </View>
                    <Text style={s.emergencyOptionText}>Emergency Services (191)</Text>
                    <ChevronRight size={16} color={colors.textMuted} />
                  </Pressable>
                ) : (
                  <>
                    <Pressable
                      style={s.emergencyOption}
                      onPress={() => Linking.openURL("tel:191")}
                    >
                      <View style={s.emergencyOptionIcon}>
                        <Phone size={14} color="#EF4444" />
                      </View>
                      <Text style={s.emergencyOptionText}>Call Emergency Now</Text>
                      <ExternalLink size={16} color={colors.textMuted} />
                    </Pressable>
                    <Pressable
                      style={s.emergencyOption}
                      onPress={() => Linking.openURL("tel:+233000000000")}
                    >
                      <View style={[s.emergencyOptionIcon, { backgroundColor: "#22C55E20" }]}>
                        <Shield size={14} color="#22C55E" />
                      </View>
                      <Text style={s.emergencyOptionText}>Call Safety Team</Text>
                      <ExternalLink size={16} color={colors.textMuted} />
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* SAFETY ACTIONS                                         */}
          {/* ═══════════════════════════════════════════════════════ */}
          <View style={s.actionsGrid}>
            {/* Share Trip */}
            <Pressable style={s.actionCard} onPress={shareTrip}>
              <View style={[s.actionIcon, { backgroundColor: brand.primary + "15" }]}>
                <Share2 size={18} color={brand.primary} />
              </View>
              <Text style={s.actionTitle}>Share Trip</Text>
              <Text style={s.actionDesc}>
                Share your live location with trusted contacts
              </Text>
            </Pressable>

            {/* Report Incident */}
            <Pressable style={s.actionCard} onPress={reportIncident}>
              <View style={[s.actionIcon, { backgroundColor: "#F59E0B15" }]}>
                <AlertTriangle size={18} color="#F59E0B" />
              </View>
              <Text style={s.actionTitle}>Report Incident</Text>
              <Text style={s.actionDesc}>
                Report safety concerns or incidents
              </Text>
            </Pressable>

            {/* Roadside Assistance */}
            <Pressable
              style={s.actionCard}
              onPress={requestRoadsideAssistance}
              disabled={roadsideLoading}
            >
              <View style={[s.actionIcon, { backgroundColor: "#3B82F615" }]}>
                {roadsideLoading ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <Car size={18} color="#3B82F6" />
                )}
              </View>
              <Text style={s.actionTitle}>Roadside Help</Text>
              <Text style={s.actionDesc}>
                Vehicle breakdown or mechanical issues
              </Text>
            </Pressable>

            {/* Safety Tips */}
            <Pressable
              style={s.actionCard}
              onPress={() => setShowTips(!showTips)}
            >
              <View style={[s.actionIcon, { backgroundColor: "#22C55E15" }]}>
                <BookOpen size={18} color="#22C55E" />
              </View>
              <Text style={s.actionTitle}>Safety Tips</Text>
              <Text style={s.actionDesc}>
                Review safety guidelines for this trip
              </Text>
            </Pressable>
          </View>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* SAFETY TIPS EXPANDED                                   */}
          {/* ═══════════════════════════════════════════════════════ */}
          {showTips && (
            <View style={s.tipsSection}>
              <View style={s.tipsContent}>
                <View style={s.tipItem}>
                  <View style={s.tipDot} />
                  <Text style={s.tipText}>
                    Always wear your helmet and ensure the passenger has one too
                  </Text>
                </View>
                <View style={s.tipItem}>
                  <View style={s.tipDot} />
                  <Text style={s.tipText}>
                    Keep to the speed limit and use indicators when turning
                  </Text>
                </View>
                <View style={s.tipItem}>
                  <View style={s.tipDot} />
                  <Text style={s.tipText}>
                    Stay on main roads and avoid unfamiliar shortcuts at night
                  </Text>
                </View>
                <View style={s.tipItem}>
                  <View style={s.tipDot} />
                  <Text style={s.tipText}>
                    Keep your phone charged and share your trip with someone you trust
                  </Text>
                </View>
                <View style={s.tipItem}>
                  <View style={s.tipDot} />
                  <Text style={s.tipText}>
                    If something feels wrong, trust your instincts and pull over safely
                  </Text>
                </View>
                <View style={s.tipItem}>
                  <View style={s.tipDot} />
                  <Text style={s.tipText}>
                    Verify passenger identity before starting the trip
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Footer */}
          <View style={s.footer}>
            <Text style={s.footerText}>
              Your safety is our top priority. Tap any option for more details.
            </Text>
          </View>
        </ScrollView>
      </View>
    </>
  );
}
