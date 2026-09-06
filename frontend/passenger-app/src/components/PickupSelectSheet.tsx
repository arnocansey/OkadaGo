import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Crosshair, MapPin, Navigation, Info, ChevronDown } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";

type Props = {
  visible: boolean;
  pickupAddress: string;
  pickupCoords: { latitude: number; longitude: number };
  destinationAddress?: string;
  destinationCoords?: { latitude: number; longitude: number };
  landmark: string;
  onLandmarkChange: (text: string) => void;
  onConfirm: () => void;
  onRecenter: () => void;
  resolving?: boolean;
  loading?: boolean;
  mapComponent: React.ReactNode;
};

const GHANA_LANDMARKS = [
  "Near bus stop",
  "Near market",
  "Beside fuel station",
  "Near traffic light",
  "Blue gate",
  "Near mosque/church",
  "Opposite school",
  "Near hospital",
  "Close to junction",
  "Near ATM",
];

/**
 * PickupSelectSheet — Ghana-focused pickup selection interface.
 *
 * Map ~65% of screen, confirmation card ~35%.
 * Pickup pin is draggable; destination stays visible at all times.
 *
 * Layout (390 × 844):
 * ┌──────────────────────────────────┐
 * │  ┌────────────────────────────┐  │
 * │  │  ⓘ Drag map to adjust pin  │  │ ← Hint banner (top of map)
 * │  └────────────────────────────┘  │
 * │                                  │
 * │          MAP (~65%)              │ ← Draggable pickup pin
 * │       [Destination pin]          │    Destination pin always visible
 * │       [Pickup pin] ◎             │    Recenter button (bottom-right)
 * │                                  │
 * ├──────────────────────────────────┤
 * │  ╔════════════════════════════╗  │
 * │  ║  📍 PICKUP                ║  │ ← Floating card (~35%)
 * │  ║  Accra Mall, West Hills    ║  │    Pickup address prominent
 * │  ║                            ║  │
 * │  ║  🏷️ Landmark (optional)    ║  │ ← Landmark field
 * │  ║  ┌──────────────────────┐  ║  │    Quick-pick chips below
 * │  ║  │ Near bus stop     ▾  │  ║  │
 * │  ║  └──────────────────────┘  ║  │
 * │  ║  ○ Near bus stop           ║  │ ← Quick-pick chips
 * │  ║  ○ Beside fuel station     ║  │
 * │  ║                            ║  │
 * │  ║  ──────────────────────    ║  │
 * │  ║  🏍️ Osu, Oxford Street    ║  │ ← Destination (muted, always visible)
 * │  ║                            ║  │
 * │  ║  ┌──────────────────────┐  ║  │
 * │  ║  │   CONFIRM PICKUP     │  ║  │ ← Large thumb-zone CTA
 * │  ║  └──────────────────────┘  ║  │
 * │  ╚════════════════════════════╝  │
 * └──────────────────────────────────┘
 */
export function PickupSelectSheet({
  visible,
  pickupAddress,
  pickupCoords,
  destinationAddress,
  destinationCoords,
  landmark,
  onLandmarkChange,
  onConfirm,
  onRecenter,
  resolving = false,
  loading = false,
  mapComponent,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [landmarkFocused, setLandmarkFocused] = useState(false);
  const [showChips, setShowChips] = useState(false);
  const cardSlide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(cardSlide, {
        toValue: 1,
        useNativeDriver: true,
        damping: 18,
        stiffness: 120,
      }).start();
    } else {
      cardSlide.setValue(0);
    }
  }, [visible, cardSlide]);

  const s = useMemo(
    () =>
      StyleSheet.create({
        screen: {
          flex: 1,
          backgroundColor: colors.bg,
        },

        /* ─── Map Area (~65%) ──────────────────────────────────── */
        mapArea: {
          flex: 65,
          position: "relative",
        },
        recenterBtn: {
          position: "absolute",
          right: 16,
          bottom: 16,
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: isDark ? "rgba(17, 24, 39, 0.95)" : "rgba(255, 255, 255, 0.95)",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.4 : 0.1,
          shadowRadius: 8,
          elevation: 6,
          borderWidth: 1,
          borderColor: colors.border,
        },

        /* ─── Hint Banner (on map) ─────────────────────────────── */
        hintBanner: {
          position: "absolute",
          top: insets.top + 12,
          left: 16,
          right: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          backgroundColor: isDark ? "rgba(17, 24, 39, 0.92)" : "rgba(255, 255, 255, 0.92)",
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 11,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 8,
          elevation: 4,
          borderWidth: 1,
          borderColor: colors.border,
        },
        hintIcon: {
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
        },
        hintText: {
          flex: 1,
          fontSize: 13,
          fontWeight: "600",
          color: colors.textSecondary,
        },

        /* ─── Destination badge (on map, always visible) ──────── */
        destBadge: {
          position: "absolute",
          bottom: 16,
          left: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          backgroundColor: isDark ? "rgba(17, 24, 39, 0.92)" : "rgba(255, 255, 255, 0.92)",
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 6,
          elevation: 3,
          borderWidth: 1,
          borderColor: colors.border,
          maxWidth: "70%",
        },
        destBadgeDot: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.danger,
        },
        destBadgeText: {
          flex: 1,
          fontSize: 12,
          fontWeight: "600",
          color: colors.textSecondary,
        },

        /* ─── Pickup Card (~35%) ────────────────────────────────── */
        cardArea: {
          flex: 35,
          backgroundColor: isDark ? "rgba(17, 24, 39, 0.98)" : "rgba(255, 255, 255, 0.98)",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: isDark ? 0.6 : 0.2,
          shadowRadius: 24,
          elevation: 16,
          borderWidth: 1,
          borderBottomWidth: 0,
          borderColor: colors.border,
        },
        cardHandle: {
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)",
          alignSelf: "center",
          marginTop: 10,
          marginBottom: 4,
        },
        cardContent: {
          flex: 1,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: insets.bottom + 12,
        },

        /* ─── Pickup Address (prominent) ──────────────────────── */
        pickupRow: {
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 14,
        },
        pickupMarker: {
          width: 14,
          height: 14,
          borderRadius: 7,
          backgroundColor: colors.primary,
          marginTop: 3,
          borderWidth: 2,
          borderColor: isDark ? "rgba(17,24,39,0.98)" : "rgba(255,255,255,0.98)",
        },
        pickupInfo: {
          flex: 1,
        },
        pickupLabel: {
          fontSize: 10,
          fontWeight: "700",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          marginBottom: 2,
        },
        pickupAddressText: {
          fontSize: 17,
          fontWeight: "700",
          color: colors.text,
          lineHeight: 23,
        },
        pickupAddressLoading: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        },
        pickupLoadingText: {
          fontSize: 14,
          color: colors.textMuted,
          fontStyle: "italic",
        },
        pickupCoords: {
          fontSize: 11,
          fontWeight: "500",
          color: colors.textMuted,
          marginTop: 2,
          fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
        },

        /* ─── Landmark Field ──────────────────────────────────── */
        landmarkSection: {
          marginBottom: 12,
        },
        landmarkHeader: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        },
        landmarkLabel: {
          fontSize: 11,
          fontWeight: "700",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
        landmarkOptional: {
          fontSize: 11,
          fontWeight: "500",
          color: colors.textMuted,
          fontStyle: "italic",
        },
        landmarkInput: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 13,
          borderWidth: 1.5,
          borderColor: landmarkFocused
            ? colors.primary
            : isDark
              ? "rgba(255,255,255,0.08)"
              : "rgba(0,0,0,0.06)",
        },
        landmarkInputIcon: {
          width: 28,
          height: 28,
          borderRadius: 8,
          backgroundColor: landmarkFocused ? colors.primary + "20" : colors.surfaceOverlay,
          alignItems: "center",
          justifyContent: "center",
        },
        landmarkTextInput: {
          flex: 1,
          fontSize: 14,
          fontWeight: "500",
          color: colors.text,
          padding: 0,
        },

        /* ─── Quick-pick Chips ────────────────────────────────── */
        chipsRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 6,
          marginTop: 8,
        },
        chip: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 8,
          backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
          borderWidth: 1,
          borderColor: colors.border,
        },
        chipText: {
          fontSize: 11,
          fontWeight: "500",
          color: colors.textSecondary,
        },
        chipActive: {
          backgroundColor: colors.primary + "15",
          borderColor: colors.primary + "40",
        },
        chipActiveText: {
          color: colors.primary,
        },

        /* ─── Divider ─────────────────────────────────────────── */
        divider: {
          height: 1,
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
          marginVertical: 10,
        },

        /* ─── Destination Info (always visible, muted) ────────── */
        destRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
        },
        destMarker: {
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: colors.danger,
        },
        destInfo: {
          flex: 1,
        },
        destLabel: {
          fontSize: 10,
          fontWeight: "700",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 1,
        },
        destAddressText: {
          fontSize: 13,
          fontWeight: "500",
          color: colors.textSecondary,
        },

        /* ─── Confirm Button (Thumb Zone) ──────────────────────── */
        confirmBtn: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          backgroundColor: colors.primary,
          borderRadius: 18,
          paddingVertical: 18,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.35 : 0.1,
          shadowRadius: 12,
          elevation: 8,
        },
        confirmBtnDisabled: {
          opacity: 0.5,
        },
        confirmBtnIcon: {
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: "rgba(0,0,0,0.15)",
          alignItems: "center",
          justifyContent: "center",
        },
        confirmText: {
          fontSize: 17,
          fontWeight: "700",
          color: colors.textOnPrimary,
          letterSpacing: 0.3,
        },
      }),
    [colors, isDark, insets, landmarkFocused],
  );

  if (!visible) return null;

  return (
    <View style={s.screen}>
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MAP AREA (~65%)                                            */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <View style={s.mapArea}>
        {mapComponent}

        {/* Hint banner */}
        <View style={s.hintBanner} pointerEvents="none">
          <View style={s.hintIcon}>
            <Crosshair size={13} color={colors.textOnPrimary} />
          </View>
          <Text style={s.hintText}>
            Drag the map to adjust your pickup pin
          </Text>
        </View>

        {/* Destination badge on map — always visible */}
        {destinationAddress ? (
          <View style={s.destBadge} pointerEvents="none">
            <View style={s.destBadgeDot} />
            <Text style={s.destBadgeText} numberOfLines={1}>
              {destinationAddress}
            </Text>
          </View>
        ) : null}

        {/* Recenter button */}
        <Pressable
          style={s.recenterBtn}
          onPress={onRecenter}
          accessibilityLabel="Center on current location"
        >
          <Crosshair size={22} color={colors.primary} />
        </Pressable>
      </View>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* PICKUP CONFIRMATION CARD (~35%)                            */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <KeyboardAvoidingView
        style={s.cardArea}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 10 : 0}
      >
        <View style={s.cardHandle} />

        <View style={s.cardContent}>
          {/* ─── Pickup Address (prominent) ────────────────────── */}
          <View style={s.pickupRow}>
            <View style={s.pickupMarker} />
            <View style={s.pickupInfo}>
              <Text style={s.pickupLabel}>Pickup</Text>
              {resolving ? (
                <View style={s.pickupAddressLoading}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={s.pickupLoadingText}>Resolving address…</Text>
                </View>
              ) : (
                <>
                  <Text style={s.pickupAddressText} numberOfLines={2}>
                    {pickupAddress || "Tap map to set pickup"}
                  </Text>
                  <Text style={s.pickupCoords}>
                    {pickupCoords.latitude.toFixed(5)}, {pickupCoords.longitude.toFixed(5)}
                  </Text>
                </>
              )}
            </View>
          </View>

          {/* ─── Landmark / Pickup Note ────────────────────────── */}
          <View style={s.landmarkSection}>
            <View style={s.landmarkHeader}>
              <Text style={s.landmarkLabel}>Landmark or pickup note</Text>
              <Text style={s.landmarkOptional}>Optional</Text>
            </View>
            <View style={s.landmarkInput}>
              <View style={s.landmarkInputIcon}>
                <MapPin size={14} color={landmarkFocused ? colors.primary : colors.textMuted} />
              </View>
              <TextInput
                style={s.landmarkTextInput}
                placeholder='e.g. "Near bus stop" or "Blue gate"'
                placeholderTextColor={colors.textMuted}
                value={landmark}
                onChangeText={onLandmarkChange}
                onFocus={() => {
                  setLandmarkFocused(true);
                  setShowChips(true);
                }}
                onBlur={() => {
                  setLandmarkFocused(false);
                  // Keep chips visible briefly after blur
                  setTimeout(() => setShowChips(false), 200);
                }}
                returnKeyType="done"
                blurOnSubmit
              />
            </View>

            {/* Quick-pick chips — Ghana-specific landmarks */}
            {showChips && !landmark && (
              <View style={s.chipsRow}>
                {GHANA_LANDMARKS.slice(0, 6).map((chip) => (
                  <Pressable
                    key={chip}
                    style={s.chip}
                    onPress={() => {
                      onLandmarkChange(chip);
                      setShowChips(false);
                      Keyboard.dismiss();
                    }}
                  >
                    <Text style={s.chipText}>{chip}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* ─── Divider ───────────────────────────────────────── */}
          <View style={s.divider} />

          {/* ─── Destination (always visible, muted) ───────────── */}
          {destinationAddress ? (
            <View style={s.destRow}>
              <View style={s.destMarker} />
              <View style={s.destInfo}>
                <Text style={s.destLabel}>Destination</Text>
                <Text style={s.destAddressText} numberOfLines={1}>
                  {destinationAddress}
                </Text>
              </View>
            </View>
          ) : null}

          {/* ─── Confirm Pickup — Thumb-zone CTA ───────────────── */}
          <Pressable
            style={[s.confirmBtn, loading && s.confirmBtnDisabled]}
            onPress={() => {
              Keyboard.dismiss();
              onConfirm();
            }}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Confirm pickup location"
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.textOnPrimary} />
            ) : (
              <View style={s.confirmBtnIcon}>
                <Navigation size={14} color={colors.textOnPrimary} />
              </View>
            )}
            <Text style={s.confirmText}>
              {loading ? "Confirming…" : "Confirm Pickup"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
