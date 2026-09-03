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
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Briefcase, Clock, Home, MapPin, Search, Star, X } from "lucide-react-native";
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

/** Map saved-place label to an icon */
function placeIcon(label: string) {
  const l = label.toLowerCase();
  if (l.includes("home")) return Home;
  if (l.includes("work") || l.includes("office") || l.includes("company")) return Briefcase;
  if (l.includes("favourite") || l.includes("favorite")) return Star;
  return MapPin;
}

/** Popular locations shown when there's no search query */
const POPULAR_LOCATIONS = [
  { id: "1", label: "Kotoka Airport", address: "Kotoka International Airport, Accra", latitude: 5.6054, longitude: -0.1668 },
  { id: "2", label: "Accra Mall", address: "Accra Mall, Tetteh Quarshie Interchange", latitude: 5.6456, longitude: -0.1770 },
  { id: "3", label: "Osu Oxford Street", address: "Osu, Oxford Street, Accra", latitude: 5.5577, longitude: -0.1780 },
  { id: "4", label: "Legon Campus", address: "University of Ghana, Legon", latitude: 5.6502, longitude: -0.1864 },
];

/**
 * DestinationSearchSheet v2
 *
 * Full-screen search overlay with:
 * - Pickup + Destination connected fields at top
 * - Route indicator between fields
 * - Recent, Saved, Popular sections as compact rows
 * - Continue button always accessible above keyboard
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
  const destInputRef = useRef<TextInput>(null);

  const [pickupQuery] = useState("Current location");
  const [destinationQuery, setDestinationQuery] = useState("");
  const [destinationFocused, setDestinationFocused] = useState(true);
  const [selectedDest, setSelectedDest] = useState<{
    address: string;
    latitude: number;
    longitude: number;
  } | null>(null);

  const destinationAutocomplete = useAddressAutocomplete({
    token: sessionToken,
    query: destinationQuery,
    proximity: userLocation,
    enabled: destinationFocused && visible,
  });

  useEffect(() => {
    if (visible) {
      setTimeout(() => destInputRef.current?.focus(), 300);
    } else {
      setDestinationQuery("");
      setDestinationFocused(true);
      setSelectedDest(null);
      destinationAutocomplete.clearSuggestions();
    }
  }, [visible]);

  const handleSelectSuggestion = useCallback(
    async (suggestion: PlaceSuggestion) => {
      Keyboard.dismiss();
      try {
        const resolved = await destinationAutocomplete.resolveSuggestion(suggestion);
        setSelectedDest({
          address: resolved.address,
          latitude: resolved.latitude,
          longitude: resolved.longitude,
        });
        setDestinationQuery(resolved.address);
        onSelectDestination(resolved);
      } catch {
        const fallback = {
          address: suggestion.fullAddress || suggestion.name,
          latitude: suggestion.latitude ?? userLocation?.latitude ?? 5.6037,
          longitude: suggestion.longitude ?? userLocation?.longitude ?? -0.1870,
        };
        setSelectedDest(fallback);
        setDestinationQuery(suggestion.name);
        onSelectDestination(fallback);
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

  const handleSelectPopular = useCallback(
    (loc: { address: string; latitude: number; longitude: number }) => {
      Keyboard.dismiss();
      onSelectDestination(loc);
    },
    [onSelectDestination],
  );

  const handleContinue = useCallback(() => {
    if (selectedDest) {
      onSelectDestination(selectedDest);
    }
  }, [selectedDest, onSelectDestination]);

  const suggestions = destinationAutocomplete.suggestions;
  const isLoading = destinationAutocomplete.loading;
  const error = destinationAutocomplete.error;

  const showSuggestions = destinationFocused && destinationQuery.length > 0 && (isLoading || error || suggestions.length > 0);
  const showDefaultContent = !showSuggestions && destinationQuery.length === 0;

  const s = useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: isDark ? "rgba(8, 14, 26, 0.98)" : "rgba(248, 250, 252, 0.98)",
          zIndex: 100,
        },
        sheet: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 101,
          backgroundColor: isDark ? "#080E1A" : "#F8FAFC",
        },
        container: {
          flex: 1,
          paddingTop: Math.max(insets.top, 12),
          backgroundColor: isDark ? "#080E1A" : "#F8FAFC",
        },

        /* ─── Header ──────────────────────────────────────── */
        header: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingBottom: 12,
          gap: 12,
          backgroundColor: isDark ? "#080E1A" : "#F8FAFC",
        },
        backBtn: {
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
        },
        headerTitle: {
          flex: 1,
          fontSize: 18,
          fontWeight: "700",
          color: colors.text,
        },

        /* ─── Fields Card ─────────────────────────────────── */
        fieldsCard: {
          marginHorizontal: 16,
          marginBottom: 12,
          backgroundColor: isDark ? "#121A28" : "#FFFFFF",
          borderRadius: 16,
          padding: 14,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.4 : 0.12,
          shadowRadius: 12,
          elevation: 6,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        },
        fieldRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        },
        fieldDot: {
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: colors.primary,
        },
        fieldDotDest: {
          backgroundColor: colors.danger,
        },
        fieldInput: {
          flex: 1,
          fontSize: 15,
          fontWeight: "500",
          color: colors.text,
          paddingVertical: 10,
        },
        fieldInputPlaceholder: {
          color: colors.textMuted,
        },
        fieldClearBtn: {
          width: 22,
          height: 22,
          borderRadius: 11,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)",
        },

        /* ─── Route Indicator ─────────────────────────────── */
        routeLine: {
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 2,
          paddingLeft: 4,
          gap: 3,
        },
        routeDash: {
          width: 2,
          borderRadius: 1,
          backgroundColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
        },

        /* ─── Scroll Content ──────────────────────────────── */
        scrollArea: {
          flex: 1,
          marginHorizontal: 16,
          backgroundColor: isDark ? "#080E1A" : "#F8FAFC",
        },
        sectionLabel: {
          fontSize: 11,
          fontWeight: "700",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.6,
          marginBottom: 8,
          marginTop: 16,
          paddingHorizontal: 4,
        },
        sectionLabelFirst: {
          marginTop: 4,
        },

        /* ─── Compact Row ─────────────────────────────────── */
        row: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderRadius: 14,
          marginBottom: 8,
          backgroundColor: isDark ? "#121A28" : "#FFFFFF",
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.2 : 0.05,
          shadowRadius: 4,
          elevation: 2,
        },
        rowPressed: {
          backgroundColor: isDark ? "#1A2538" : "#F1F5F9",
        },
        rowIcon: {
          width: 34,
          height: 34,
          borderRadius: 10,
          backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
          alignItems: "center",
          justifyContent: "center",
        },
        rowIconSaved: {
          backgroundColor: isDark ? "rgba(250, 204, 21, 0.15)" : "rgba(250, 204, 21, 0.1)",
        },
        rowBody: {
          flex: 1,
        },
        rowName: {
          fontSize: 15,
          fontWeight: "600",
          color: colors.text,
        },
        rowAddress: {
          fontSize: 12,
          color: colors.textMuted,
          marginTop: 2,
        },

        /* ─── Loading ─────────────────────────────────────── */
        loadingRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingVertical: 14,
          paddingHorizontal: 14,
          backgroundColor: isDark ? "#121A28" : "#FFFFFF",
          borderRadius: 14,
          marginBottom: 8,
        },
        loadingText: {
          fontSize: 13,
          color: colors.textMuted,
        },

        /* ─── Error ───────────────────────────────────────── */
        errorRow: {
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.danger,
          marginBottom: 8,
          backgroundColor: isDark ? "#121A28" : "#FFFFFF",
        },
        errorText: {
          fontSize: 13,
          color: colors.danger,
        },

        /* ─── Empty State ─────────────────────────────────── */
        emptyState: {
          alignItems: "center",
          paddingTop: 36,
          paddingBottom: 24,
          gap: 8,
        },
        emptyText: {
          fontSize: 14,
          color: colors.textMuted,
        },

        /* ─── Bottom Bar (Continue) ───────────────────────── */
        bottomBar: {
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 16),
          backgroundColor: isDark ? "#080E1A" : "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        },
        continueBtn: {
          height: 52,
          borderRadius: 14,
          backgroundColor: selectedDest ? colors.primary : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
          alignItems: "center",
          justifyContent: "center",
        },
        continueBtnEnabled: {
          backgroundColor: colors.primary,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
          elevation: 6,
        },
        continueText: {
          fontSize: 16,
          fontWeight: "700",
          color: selectedDest ? colors.textOnPrimary : colors.textMuted,
        },
      }),
    [colors, isDark, insets, selectedDest],
  );

  if (!visible) return null;

  return (
    <>
      {/* ─── Dimmed backdrop ─────────────────────────────────── */}
      <Pressable style={s.backdrop} onPress={onClose} />

      {/* ─── Full-screen sheet ───────────────────────────────── */}
      <KeyboardAvoidingView
        style={s.sheet}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
      >
        <View style={s.container}>
          {/* ─── Header ──────────────────────────────────── */}
          <View style={s.header}>
            <Pressable style={s.backBtn} onPress={onClose} accessibilityLabel="Close search">
              <X size={18} color={colors.text} />
            </Pressable>
            <Text style={s.headerTitle}>Set destination</Text>
          </View>

          {/* ─── Pickup + Destination Fields ─────────────── */}
          <View style={s.fieldsCard}>
            {/* Pickup */}
            <View style={s.fieldRow}>
              <View style={s.fieldDot} />
              <Text style={[s.fieldInput, { color: colors.textSecondary }]}>
                {pickupQuery}
              </Text>
            </View>

            {/* Route indicator */}
            <View style={s.routeLine}>
              <View style={[s.routeDash, { height: 14 }]} />
              <View style={[s.routeDash, { height: 8 }]} />
              <View style={[s.routeDash, { height: 4 }]} />
            </View>

            {/* Destination */}
            <View style={s.fieldRow}>
              <View style={[s.fieldDot, s.fieldDotDest]} />
              <TextInput
                ref={destInputRef}
                style={[s.fieldInput, !destinationQuery && s.fieldInputPlaceholder]}
                value={destinationQuery}
                onChangeText={(text) => {
                  setDestinationQuery(text);
                  setSelectedDest(null);
                }}
                onFocus={() => setDestinationFocused(true)}
                placeholder="Where are you going?"
                placeholderTextColor={colors.textMuted}
                autoFocus
                returnKeyType="search"
                autoCapitalize="words"
                autoCorrect={false}
              />
              {destinationQuery.length > 0 ? (
                <Pressable
                  style={s.fieldClearBtn}
                  onPress={() => {
                    setDestinationQuery("");
                    setSelectedDest(null);
                    destinationAutocomplete.clearSuggestions();
                    destInputRef.current?.focus();
                  }}
                  accessibilityLabel="Clear destination"
                >
                  <X size={12} color={colors.textMuted} />
                </Pressable>
              ) : null}
            </View>
          </View>

          {/* ─── Scrollable Content ──────────────────────── */}
          <ScrollView
            style={s.scrollArea}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="on-drag"
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* Autocomplete suggestions */}
            {showSuggestions && (
              <>
                <Text style={[s.sectionLabel, s.sectionLabelFirst]}>Results</Text>
                {isLoading && (
                  <View style={s.loadingRow}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={s.loadingText}>Searching places...</Text>
                  </View>
                )}
                {error && (
                  <View style={s.errorRow}>
                    <Text style={s.errorText}>{error}</Text>
                  </View>
                )}
                {!isLoading &&
                  !error &&
                  suggestions.map((suggestion) => (
                    <Pressable
                      key={suggestion.placeId}
                      style={({ pressed }) => [s.row, pressed && s.rowPressed]}
                      onPress={() => handleSelectSuggestion(suggestion)}
                    >
                      <View style={s.rowIcon}>
                        <MapPin size={16} color={colors.primary} />
                      </View>
                      <View style={s.rowBody}>
                        <Text style={s.rowName} numberOfLines={1}>
                          {suggestion.name}
                        </Text>
                        <Text style={s.rowAddress} numberOfLines={1}>
                          {suggestion.fullAddress}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
              </>
            )}

            {/* Default content: Recent + Saved + Popular */}
            {showDefaultContent && (
              <>
                {/* Recent */}
                {recentDestinations.length > 0 && (
                  <>
                    <Text style={[s.sectionLabel, s.sectionLabelFirst]}>Recent</Text>
                    {recentDestinations.slice(0, 5).map((dest, i) => (
                      <Pressable
                        key={`${dest.latitude}-${dest.longitude}-${i}`}
                        style={({ pressed }) => [s.row, pressed && s.rowPressed]}
                        onPress={() => handleSelectRecent(dest)}
                      >
                        <View style={s.rowIcon}>
                          <Clock size={16} color={colors.textSecondary} />
                        </View>
                        <View style={s.rowBody}>
                          <Text style={s.rowName} numberOfLines={1}>
                            {dest.label || dest.address}
                          </Text>
                          <Text style={s.rowAddress} numberOfLines={1}>
                            {dest.address}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </>
                )}

                {/* Saved Places */}
                {savedPlaces.length > 0 && (
                  <>
                    <Text style={[s.sectionLabel, recentDestinations.length === 0 && s.sectionLabelFirst]}>
                      Saved Places
                    </Text>
                    {savedPlaces.slice(0, 6).map((place) => {
                      const Icon = placeIcon(place.label);
                      return (
                        <Pressable
                          key={place.id}
                          style={({ pressed }) => [s.row, pressed && s.rowPressed]}
                          onPress={() => handleSelectSaved(place)}
                        >
                          <View style={[s.rowIcon, s.rowIconSaved]}>
                            <Icon size={16} color={colors.primary} />
                          </View>
                          <View style={s.rowBody}>
                            <Text style={s.rowName} numberOfLines={1}>
                              {place.label}
                            </Text>
                            <Text style={s.rowAddress} numberOfLines={1}>
                              {place.address}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </>
                )}

                {/* Popular Locations */}
                <Text style={[s.sectionLabel, recentDestinations.length === 0 && savedPlaces.length === 0 && s.sectionLabelFirst]}>
                  Popular in Accra
                </Text>
                {POPULAR_LOCATIONS.map((loc) => (
                  <Pressable
                    key={loc.id}
                    style={({ pressed }) => [s.row, pressed && s.rowPressed]}
                    onPress={() => handleSelectPopular(loc)}
                  >
                    <View style={s.rowIcon}>
                      <MapPin size={16} color={colors.accent} />
                    </View>
                    <View style={s.rowBody}>
                      <Text style={s.rowName} numberOfLines={1}>
                        {loc.label}
                      </Text>
                      <Text style={s.rowAddress} numberOfLines={1}>
                        {loc.address}
                      </Text>
                    </View>
                  </Pressable>
                ))}

                {/* Empty state */}
                {recentDestinations.length === 0 && savedPlaces.length === 0 && (
                  <View style={s.emptyState}>
                    <Search size={28} color={colors.textMuted} />
                    <Text style={s.emptyText}>Start typing to search destinations</Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          {/* ─── Continue Button (always above keyboard) ──── */}
          <View style={s.bottomBar}>
            <Pressable
              style={[s.continueBtn, selectedDest && s.continueBtnEnabled]}
              onPress={handleContinue}
              disabled={!selectedDest}
              accessibilityRole="button"
              accessibilityLabel="Continue to booking"
            >
              <Text style={s.continueText}>Continue</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
