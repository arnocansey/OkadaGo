import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CheckCircle, Navigation, Shield, Smile, Sparkles, Wrench } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { Avatar } from "@/components/ui/Avatar";

type Props = {
  visible: boolean;
  riderName: string;
  riderAvatar?: string | null;
  onSubmit: (rating: number, tags: string[]) => void;
  onSkip: () => void;
  loading?: boolean;
};

const TAGS = [
  { key: "safe_rider", label: "Safe Rider", icon: Shield },
  { key: "friendly", label: "Friendly", icon: Smile },
  { key: "professional", label: "Professional", icon: Sparkles },
  { key: "clean_bike", label: "Clean Bike", icon: Wrench },
  { key: "great_navigation", label: "Great Navigation", icon: Navigation },
];

/**
 * RateRiderSheet — Premium rider rating experience
 *
 * Designed to be completed in 3–5 seconds:
 * 1. Tap stars (< 1s)
 * 2. Optionally tap 1–2 tags (< 2s)
 * 3. Tap Submit (< 1s)
 *
 * ┌──────────────────────────────────────┐
 * │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
 * │                                      │
 * │        ┌─────┐                       │
 * │        │     │  Kwame Asante         │  ← Rider identity
 * │        │ IMG │  How was your ride?   │
 * │        └─────┘                       │
 * │                                      │
 * │     ☆  ☆  ☆  ☆  ☆                  │  ← Large interactive stars
 * │                                      │
 * │  Quick feedback (optional)           │  ← Tag section label
 * │  [🛡 Safe] [😊 Friendly] [✨ Pro]   │  ← Toggleable chips
 * │  [🔧 Clean] [🧭 Nav]               │
 * │                                      │
 * │  ┌──────────────────────────────┐    │
 * │  │        Submit rating         │    │  ← Primary CTA (gold)
 * │  └──────────────────────────────┘    │
 * │                                      │
 * │          Skip for now                │  ← Ghost dismiss
 * └──────────────────────────────────────┘
 */
export function RateRiderSheet({
  visible,
  riderName,
  riderAvatar,
  onSubmit,
  onSkip,
  loading = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  const toggleTag = useCallback((key: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const handleSubmit = useCallback(() => {
    if (rating === 0) return;
    onSubmit(rating, Array.from(selectedTags));
  }, [rating, selectedTags, onSubmit]);

  const ratingLabel = useMemo(() => {
    if (rating === 0) return "Tap a star";
    if (rating <= 2) return "Poor";
    if (rating === 3) return "Okay";
    if (rating === 4) return "Good";
    return "Excellent";
  }, [rating]);

  const s = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: isDark ? colors.surface : "#FFFFFF",
        },
        handle: {
          alignSelf: "center",
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.borderStrong,
          marginTop: 10,
          marginBottom: 6,
        },
        content: {
          flex: 1,
          paddingHorizontal: 24,
          paddingTop: 8,
          alignItems: "center",
        },

        /* ─── Rider Identity ──────────────────────────── */
        riderSection: {
          alignItems: "center",
          marginTop: 20,
          marginBottom: 28,
        },
        avatarWrap: {
          marginBottom: 12,
        },
        riderName: {
          fontSize: 22,
          fontWeight: "700",
          color: colors.text,
          marginBottom: 4,
        },
        riderQuestion: {
          fontSize: 15,
          color: colors.textSecondary,
        },

        /* ─── Stars ────────────────────────────────────── */
        starsRow: {
          flexDirection: "row",
          gap: 10,
          marginBottom: 6,
        },
        starBtn: {
          padding: 6,
        },
        ratingLabel: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.primary,
          marginBottom: 32,
          height: 20,
        },

        /* ─── Tags ─────────────────────────────────────── */
        tagSectionLabel: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          alignSelf: "flex-start",
          marginBottom: 12,
        },
        tagsContainer: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 32,
          alignSelf: "flex-start",
        },
        tag: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 12,
          borderWidth: 1.5,
          borderColor: colors.border,
          backgroundColor: isDark ? colors.surfaceOverlay : "#F8F9FA",
        },
        tagSelected: {
          borderColor: colors.primary,
          backgroundColor: isDark ? "rgba(250,204,21,0.08)" : "rgba(250,204,21,0.06)",
        },
        tagText: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.text,
        },
        tagTextSelected: {
          color: colors.primary,
        },

        /* ─── Submit ──────────────────────────────────── */
        submitBtn: {
          width: "100%",
          height: 52,
          borderRadius: 16,
          backgroundColor: colors.primary,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          opacity: rating === 0 ? 0.5 : 1,
        },
        submitText: {
          fontSize: 16,
          fontWeight: "700",
          color: colors.background,
        },

        /* ─── Skip ────────────────────────────────────── */
        skipBtn: {
          paddingVertical: 14,
          marginTop: 8,
        },
        skipText: {
          fontSize: 14,
          fontWeight: "500",
          color: colors.textMuted,
        },
      }),
    [colors, isDark],
  );

  if (!visible) return null;

  return (
    <View style={s.overlay}>
      <View style={s.handle} />

      <View style={s.content}>
        {/* ─── Rider Identity ──────────────────────────── */}
        <View style={s.riderSection}>
          <View style={s.avatarWrap}>
            <Avatar name={riderName} size={72} imageUri={riderAvatar ?? undefined} />
          </View>
          <Text style={s.riderName}>{riderName}</Text>
          <Text style={s.riderQuestion}>How was your ride?</Text>
        </View>

        {/* ─── Stars ────────────────────────────────────── */}
        <View style={s.starsRow}>
          {[1, 2, 3, 4, 5].map((value) => (
            <Pressable
              key={value}
              style={s.starBtn}
              onPress={() => setRating(value)}
              accessibilityRole="button"
              accessibilityLabel={`${value} star${value > 1 ? "s" : ""}`}
            >
              <Sparkles
                size={40}
                color={value <= rating ? colors.primary : colors.border}
                fill={value <= rating ? colors.primary : "transparent"}
                strokeWidth={value <= rating ? 0 : 1.5}
              />
            </Pressable>
          ))}
        </View>
        <Text style={s.ratingLabel}>{ratingLabel}</Text>

        {/* ─── Quick Tags ──────────────────────────────── */}
        <Text style={s.tagSectionLabel}>Quick feedback (optional)</Text>
        <View style={s.tagsContainer}>
          {TAGS.map(({ key, label, icon: Icon }) => {
            const isSelected = selectedTags.has(key);
            return (
              <Pressable
                key={key}
                style={[s.tag, isSelected && s.tagSelected]}
                onPress={() => toggleTag(key)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Icon
                  size={14}
                  color={isSelected ? colors.primary : colors.textSecondary}
                />
                <Text style={[s.tagText, isSelected && s.tagTextSelected]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ─── Submit ──────────────────────────────────── */}
        <Pressable
          style={s.submitBtn}
          onPress={handleSubmit}
          disabled={rating === 0 || loading}
          accessibilityRole="button"
        >
          <CheckCircle size={18} color={colors.background} />
          <Text style={s.submitText}>{loading ? "Submitting…" : "Submit rating"}</Text>
        </Pressable>

        {/* ─── Skip ────────────────────────────────────── */}
        <Pressable style={s.skipBtn} onPress={onSkip} accessibilityRole="button">
          <Text style={s.skipText}>Skip for now</Text>
        </Pressable>
      </View>
    </View>
  );
}
