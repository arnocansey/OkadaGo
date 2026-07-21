import { useMemo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type TextInputProps } from "react-native";
import { MapPin } from "lucide-react-native";
import { Input } from "@/components/ui/Input";
import { useTheme } from "@/context/ThemeContext";
import { radius, spacing } from "@/theme/tokens";
import type { PlaceSuggestion } from "@/types";

type Props = TextInputProps & {
  label?: string;
  hint?: string;
  error?: string;
  suggestions: PlaceSuggestion[];
  suggestionsLoading?: boolean;
  suggestionsError?: string | null;
  showSuggestions?: boolean;
  /** Expand the suggestions list (e.g. when the map is collapsed for search mode). */
  expanded?: boolean;
  onSelectSuggestion: (suggestion: PlaceSuggestion) => void;
};

export function AddressAutocompleteField({
  label,
  hint,
  error,
  suggestions,
  suggestionsLoading,
  suggestionsError,
  showSuggestions = false,
  expanded = false,
  onSelectSuggestion,
  style,
  ...rest
}: Props) {
  const { colors, typography } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: { position: "relative", zIndex: expanded ? 20 : 1 },
        dropdown: {
          marginTop: spacing.xs,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.md,
          backgroundColor: colors.surface,
          overflow: "hidden",
          maxHeight: expanded ? 320 : 180,
        },
        suggestionRow: {
          flexDirection: "row",
          alignItems: "flex-start",
          gap: spacing.sm,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          minHeight: 52,
        },
        suggestionRowLast: { borderBottomWidth: 0 },
        suggestionName: { ...typography.bodyMedium, color: colors.text, flex: 1 },
        suggestionAddress: { ...typography.caption, color: colors.textMuted, flex: 1, marginTop: 2 },
        statusRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
        },
        statusText: { ...typography.caption, color: colors.textMuted },
        statusError: { ...typography.caption, color: colors.danger },
      }),
    [colors, typography, expanded],
  );

  const visible = showSuggestions && (suggestionsLoading || suggestionsError || suggestions.length > 0);

  return (
    <View style={styles.wrap}>
      <Input label={label} hint={hint} error={error} style={style} {...rest} />

      {visible ? (
        <View style={styles.dropdown}>
          {suggestionsLoading ? (
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.statusText}>Searching places…</Text>
            </View>
          ) : null}

          {!suggestionsLoading && suggestionsError ? (
            <View style={styles.statusRow}>
              <Text style={styles.statusError}>{suggestionsError}</Text>
            </View>
          ) : null}

          {!suggestionsLoading && !suggestionsError
            ? suggestions.map((suggestion, index) => (
                <Pressable
                  key={suggestion.placeId}
                  style={[
                    styles.suggestionRow,
                    index === suggestions.length - 1 ? styles.suggestionRowLast : null,
                  ]}
                  onPress={() => onSelectSuggestion(suggestion)}
                >
                  <MapPin size={16} color={colors.primary} style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.suggestionName} numberOfLines={1}>
                      {suggestion.name}
                    </Text>
                    <Text style={styles.suggestionAddress} numberOfLines={2}>
                      {suggestion.fullAddress}
                    </Text>
                  </View>
                </Pressable>
              ))
            : null}
        </View>
      ) : null}
    </View>
  );
}
