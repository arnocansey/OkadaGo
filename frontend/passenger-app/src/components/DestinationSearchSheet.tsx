import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowDown, Circle, MapPin, Search, X } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { useAddressAutocomplete } from "@/hooks/useAddressAutocomplete";
import type { PlaceSuggestion, SavedPlace } from "@/types";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelectDestination: (params: {
    address: string;
    latitude: number;
    longitude: number;
  }) => void;
  savedPlaces: SavedPlace[];
  onSelectSavedPlace: (place: SavedPlace) => void;
  sessionToken?: string;
  userLocation?: { latitude: number; longitude: number };
  recentDestinations?: Array<{
    address: string;
    latitude: number;
    longitude: number;
    label?: string;
  }>;
};

/**
 * DestinationSearchSheet
 *
 * Full-screen search with semi-transparent backdrop (map dimmed behind).
 * - Pickup field (current location, read-only)
 * - Destination field (autofocus, editable)
 * - Connecting route indicator between fields
 * - Grouped destination cards (Recent, Saved, Suggestions)
 * - Keyboard-aware: KeyboardAvoidingView keeps inputs visible
 */
export function DestinationSearchSheet({
  visible,
  onClose,
  onSelectDestination,
  savedPlaces,
  onSelectSavedPlace,
  sessionToken,
  userLocation,
  recentDestinations = [],
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [pickupQuery] = useState("Current location");
  const [destinationQuery, setDestinationQuery] = useState("");
  const [destinationFocused, setDestinationFocused] = useState(true);

  const destinationAutocomplete = useAddressAutocomplete({
    token: sessionToken,
    query: destinationQuery,
    proximity: userLocation,
    enabled: destinationFocused && visible,
  });

  useEffect(() => {
    if (!visible) {
      setDestinationQuery("");
      setDestinationFocused(true);
      destinationAutocomplete.clearSuggestions();
    }
  }, [visible]);

  const handleSelectSuggestion = useCallback(
    async (suggestion: PlaceSuggestion) => {
      Keyboard.dismiss();
      try {
        const resolved = await destinationAutocomplete.resolveSuggestion(suggestion);
        onSelectDestination({
          address: resolved.address,
          latitude: resolved.latitude,
          longitude: resolved.longitude,
        });
      } catch {
        onSelectDestination({
          address: suggestion.name,
          latitude: suggestion.latitude ?? userLocation?.latitude ?? 0,
          longitude: suggestion.longitude ?? userLocation?.longitude ?? 0,
        });
      }
    },
    [destinationAutocomplete, onSelectDestination, userLocation],
  );

  const handleSelectSaved = useCallback(
    (place: SavedPlace) => {
      Keyboard.dismiss();
      onSelectSavedPlace(place);
    },
    [onSelectSavedPlace],
  );

  const handleSelectRecent = useCallback(
    (dest: { address: string; latitude: number; longitude: number }) => {
      Keyboard.dismiss();
      onSelectDestination(dest);
    },
    [onSelectDestination],
  );

  const suggestions = destinationAutocomplete.suggestions;
  const isLoading = destinationAutocomplete.loading;
  const error = destinationAutocomplete.error;

  const showSuggestions = destinationFocused && (isLoading || error || suggestions.length > 0);
  const hasContent = showSuggestions || recentDestinations.length > 0 || savedPlaces.length > 0;

  const s = useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: "rgba(0,0,0,0.55)",
          zIndex: 100,
        },
        sheet: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 101,
        },
        container: {
          flex: 1,
          paddingTop: insets.top,
        },

        /* ─── Header ──────────────────────────────────────────── */
        header: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingBottom: 12,
          gap: 12,
        },
        backBtn: {
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
        },
        headerTitle: {
          flex: 1,
          fontSize: 18,
          fontWeight: "600",
          color: colors.text,
        },

        /* ─── Fields Card ─────────────────────────────────────── */
        fieldsCard: {
          marginHorizontal: 16,
          backgroundColor: isDark ? "rgba(17, 24, 39, 0.97)" : "rgba(255, 255, 255, 0.97)",
          borderRadius: 20,
          padding: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.5 : 0.18,
          shadowRadius: 16,
          elevation: 8,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        },
        fieldRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        },
        fieldDot: {
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: colors.primary,
        },
        fieldDotDestination: {
          backgroundColor: colors.danger,
        },
        fieldInput: {
          flex: 1,
          fontSize: 15,
          fontWeight: "500",
          color: colors.text,
          paddingVertical: 12,
        },
        fieldInputPlaceholder: {
          color: colors.textMuted,
        },
        fieldClearBtn: {
          width: 24,
          height: 24,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)",
        },

        /* ─── Route Indicator ─────────────────────────────────── */
        routeIndicator: {
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 4,
          paddingLeft: 4,
        },
        routeLine: {
          width: 2,
          height: 20,
          backgroundColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
          borderRadius: 1,
        },
        routeArrow: {
          marginLeft: -1,
        },

        /* ─── Suggestions List ────────────────────────────────── */
        suggestionsArea: {
          flex: 1,
          marginTop: 12,
          marginHorizontal: 16,
        },
        sectionLabel: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.6,
          marginBottom: 8,
          paddingHorizontal: 4,
        },
        suggestionCard: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 12,
          marginBottom: 8,
        },
        suggestionCardActive: {
          backgroundColor: isDark ? "rgba(250, 204, 21, 0.1)" : "rgba(250, 204, 21, 0.08)",
          borderWidth: 1,
          borderColor: colors.primary,
        },
        suggestionIcon: {
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          alignItems: "center",
          justifyContent: "center",
        },
        suggestionBody: {
          flex: 1,
        },
        suggestionName: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.text,
        },
        suggestionAddress: {
          fontSize: 12,
          color: colors.textMuted,
          marginTop: 2,
        },
        loadingRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingHorizontal: 14,
          paddingVertical: 14,
        },
        loadingText: {
          fontSize: 13,
          color: colors.textMuted,
        },

        /* ─── Saved Places Grid ───────────────────────────────── */
        savedGrid: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 8,
        },
        savedCard: {
          width: "48%",
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
          borderRadius: 14,
          paddingHorizontal: 12,
          paddingVertical: 12,
        },
        savedIcon: {
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: isDark ? "rgba(250, 204, 21, 0.1)" : "rgba(250, 204, 21, 0.08)",
          alignItems: "center",
          justifyContent: "center",
        },
        savedBody: {
          flex: 1,
        },
        savedLabel: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.text,
        },
        savedAddress: {
          fontSize: 11,
          color: colors.textMuted,
          marginTop: 1,
        },
      }),
    [colors, isDark, insets],
  );

  if (!visible) return null;

  return (
    <>
      {/* ─── Dimmed backdrop (map visible but darkened) ─────────── */}
      <Pressable style={s.backdrop} onPress={onClose} />

      {/* ─── Search sheet ──────────────────────────────────────── */}
      <KeyboardAvoidingView
        style={s.sheet}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
      >
        <View style={s.container}>
          {/* ─── Header ───────────────────────────────────────── */}
          <View style={s.header}>
            <Pressable style={s.backBtn} onPress={onClose} accessibilityLabel="Close search">
              <X size={18} color={colors.text} />
            </Pressable>
            <Text style={s.headerTitle}>Set destination</Text>
          </View>

          {/* ─── Pickup + Destination fields ──────────────────── */}
          <View style={s.fieldsCard}>
            {/* Pickup field (read-only) */}
            <View style={s.fieldRow}>
              <View style={s.fieldDot} />
              <Text style={[s.fieldInput, { color: colors.textSecondary }]}>
                {pickupQuery}
              </Text>
            </View>

            {/* Route indicator (dotted line + arrow) */}
            <View style={s.routeIndicator}>
              <View style={s.routeLine} />
            </View>

            {/* Destination field (editable, autofocus) */}
            <View style={s.fieldRow}>
              <View style={[s.fieldDot, s.fieldDotDestination]} />
              <Text
                style={[
                  s.fieldInput,
                  !destinationQuery && s.fieldInputPlaceholder,
                ]}
                onPress={() => setDestinationFocused(true)}
              >
                {destinationQuery || "Where are you going?"}
              </Text>
              {destinationQuery.length > 0 ? (
                <Pressable
                  style={s.fieldClearBtn}
                  onPress={() => {
                    setDestinationQuery("");
                    destinationAutocomplete.clearSuggestions();
                  }}
                  accessibilityLabel="Clear destination"
                >
                  <X size={12} color={colors.textMuted} />
                </Pressable>
              ) : null}
            </View>
          </View>

          {/* ─── Suggestions / Results ─────────────────────────── */}
          <ScrollView
            style={s.suggestionsArea}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          >
            {/* Autocomplete suggestions */}
            {showSuggestions && (
              <>
                <Text style={s.sectionLabel}>Results</Text>
                {isLoading && (
                  <View style={s.loadingRow}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={s.loadingText}>Searching places…</Text>
                  </View>
                )}
                {error && (
                  <View style={[s.suggestionCard, { borderColor: colors.danger, borderWidth: 1 }]}>
                    <Text style={{ fontSize: 13, color: colors.danger }}>{error}</Text>
                  </View>
                )}
                {!isLoading &&
                  !error &&
                  suggestions.map((suggestion) => (
                    <Pressable
                      key={suggestion.placeId}
                      style={s.suggestionCard}
                      onPress={() => handleSelectSuggestion(suggestion)}
                    >
                      <View style={s.suggestionIcon}>
                        <MapPin size={16} color={colors.primary} />
                      </View>
                      <View style={s.suggestionBody}>
                        <Text style={s.suggestionName} numberOfLines={1}>
                          {suggestion.name}
                        </Text>
                        <Text style={s.suggestionAddress} numberOfLines={1}>
                          {suggestion.fullAddress}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
              </>
            )}

            {/* Recent destinations (grouped) */}
            {!showSuggestions && recentDestinations.length > 0 && (
              <>
                <Text style={s.sectionLabel}>Recent</Text>
                {recentDestinations.slice(0, 5).map((dest, i) => (
                  <Pressable
                    key={`${dest.latitude}-${dest.longitude}-${i}`}
                    style={s.suggestionCard}
                    onPress={() => handleSelectRecent(dest)}
                  >
                    <View style={s.suggestionIcon}>
                      <MapPin size={16} color={colors.textSecondary} />
                    </View>
                    <View style={s.suggestionBody}>
                      <Text style={s.suggestionName} numberOfLines={1}>
                        {dest.label || dest.address}
                      </Text>
                      <Text style={s.suggestionAddress} numberOfLines={1}>
                        {dest.address}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </>
            )}

            {/* Saved places (2-column grid) */}
            {!showSuggestions && savedPlaces.length > 0 && (
              <>
                <Text style={[s.sectionLabel, { marginTop: 16 }]}>Saved places</Text>
                <View style={s.savedGrid}>
                  {savedPlaces.slice(0, 6).map((place) => (
                    <Pressable
                      key={place.id}
                      style={s.savedCard}
                      onPress={() => handleSelectSaved(place)}
                    >
                      <View style={s.savedIcon}>
                        <MapPin size={14} color={colors.primary} />
                      </View>
                      <View style={s.savedBody}>
                        <Text style={s.savedLabel} numberOfLines={1}>
                          {place.label}
                        </Text>
                        <Text style={s.savedAddress} numberOfLines={1}>
                          {place.address}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            {/* Empty state */}
            {!showSuggestions &&
              recentDestinations.length === 0 &&
              savedPlaces.length === 0 && (
                <View style={{ alignItems: "center", paddingTop: 40, gap: 8 }}>
                  <Search size={28} color={colors.textMuted} />
                  <Text style={{ fontSize: 14, color: colors.textMuted }}>
                    Start typing to search destinations
                  </Text>
                </View>
              )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
