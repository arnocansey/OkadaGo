import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ArrowRight, Clock, Star } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { StandardBike } from "@/components/vehicles/StandardBike";
import { ExpressBike } from "@/components/vehicles/ExpressBike";
import { CargoTrike } from "@/components/vehicles/CargoTrike";

export type RideType = "standard" | "express" | "cargo";

type RideOption = {
  id: RideType;
  label: string;
  subtitle: string;
  benefit: string;
  fare?: string;
  eta?: string;
  rating?: number;
  recommended?: boolean;
};

type Props = {
  options: RideOption[];
  selected: RideType;
  onSelect: (id: RideType) => void;
  onConfirm: () => void;
  loading?: boolean;
};

function getVehicle(id: RideType, size: "featured" | "compact") {
  const featured = size === "featured";
  switch (id) {
    case "standard":
      return <StandardBike width={featured ? 140 : 48} height={featured ? 100 : 34} />;
    case "express":
      return <ExpressBike width={featured ? 140 : 48} height={featured ? 100 : 34} />;
    case "cargo":
      return <CargoTrike width={featured ? 160 : 56} height={featured ? 110 : 38} />;
  }
}

/**
 * BookingSheet v2 — Ride selection bottom sheet
 *
 * ┌──────────────────────────────────────┐
 * │  ─── handle ───                      │
 * │                                      │
 * │  ┌──────────────────────────────┐   │
 * │  │  🏍️  OkadaGo    ⭐ 4.8      │   │  ← Featured card (recommended)
 * │  │      Standard motorcycle      │   │
 * │  │  ⏱ 8 min   ● Affordable     │   │
 * │  │              GHS 24.50       │   │
 * │  └──────────────────────────────┘   │
 * │                                      │
 * │  Other options                       │
 * │  ┌──────────────────────────────┐   │
 * │  │ 🏍️ OkadaX  ⏱6min  Fast  ₵30│   │  ← Compact row
 * │  │ 🚚 Cargo   ⏱10min Load  ₵22│   │
 * │  └──────────────────────────────┘   │
 * │                                      │
 * │  ┌──────────────────────────────┐   │
 * │  │      Continue  →             │   │  ← Fixed CTA
 * │  └──────────────────────────────┘   │
 * └──────────────────────────────────────┘
 */
export function BookingSheet({ options, selected, onSelect, onConfirm, loading }: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const featured = options.find((o) => o.id === selected);
  const alternatives = options.filter((o) => o.id !== selected);

  const s = useMemo(
    () =>
      StyleSheet.create({
        sheet: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: "55%",
          backgroundColor: isDark ? colors.surface : "#FFFFFF",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: isDark ? 0.5 : 0.12,
          shadowRadius: 20,
          elevation: 12,
          paddingBottom: insets.bottom || 16,
        },
        handle: {
          alignSelf: "center",
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: isDark ? colors.borderStrong : "#D1D5DB",
          marginTop: 12,
          marginBottom: 12,
        },
        inner: {
          flex: 1,
          paddingHorizontal: 20,
        },

        /* ─── Featured Card ─────────────────────────────── */
        featuredCard: {
          backgroundColor: isDark ? colors.surfaceRaised : "#FAFAFA",
          borderRadius: 18,
          borderWidth: 2,
          borderColor: colors.primary,
          padding: 16,
          marginBottom: 16,
        },
        featuredTop: {
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
        },
        featuredVehicle: {
          width: 64,
          height: 48,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 12,
          backgroundColor: isDark ? "rgba(250,204,21,0.08)" : "rgba(250,204,21,0.06)",
        },
        featuredInfo: {
          flex: 1,
        },
        featuredNameRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        },
        featuredName: {
          fontSize: 17,
          fontWeight: "700",
          color: colors.text,
        },
        featuredBadge: {
          fontSize: 10,
          fontWeight: "700",
          color: colors.primary,
          backgroundColor: isDark ? "rgba(250,204,21,0.12)" : "rgba(250,204,21,0.15)",
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 4,
          overflow: "hidden",
          textTransform: "uppercase",
          letterSpacing: 0.4,
        },
        featuredSubtitle: {
          fontSize: 13,
          color: colors.textMuted,
          marginTop: 2,
        },
        featuredFareWrap: {
          alignItems: "flex-end",
        },
        featuredFare: {
          fontSize: 20,
          fontWeight: "700",
          color: colors.primary,
        },
        featuredFareLabel: {
          fontSize: 11,
          color: colors.textMuted,
        },
        featuredMeta: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginTop: 12,
        },
        metaChip: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 6,
          backgroundColor: isDark ? colors.surfaceOverlay : "#F1F3F5",
        },
        metaChipText: {
          fontSize: 12,
          fontWeight: "500",
          color: colors.textSecondary,
        },
        metaChipRating: {
          flexDirection: "row",
          alignItems: "center",
          gap: 3,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 6,
          backgroundColor: isDark ? "rgba(250,204,21,0.08)" : "rgba(250,204,21,0.08)",
        },
        ratingText: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.primary,
        },

        /* ─── Section Label ─────────────────────────────── */
        sectionLabel: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 8,
        },

        /* ─── Compact Alternative Row ───────────────────── */
        altRow: {
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderRadius: 14,
          backgroundColor: isDark ? colors.surfaceOverlay : "#F8F9FA",
          marginBottom: 8,
          borderWidth: 1.5,
          borderColor: "transparent",
        },
        altRowActive: {
          borderColor: colors.primary,
          backgroundColor: isDark ? "rgba(250,204,21,0.06)" : "rgba(250,204,21,0.04)",
        },
        altVehicle: {
          width: 44,
          height: 32,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        },
        altInfo: {
          flex: 1,
        },
        altNameRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        },
        altName: {
          fontSize: 15,
          fontWeight: "600",
          color: colors.text,
        },
        altBenefit: {
          fontSize: 12,
          color: colors.textMuted,
          marginTop: 1,
        },
        altRight: {
          alignItems: "flex-end",
          gap: 2,
        },
        altEta: {
          fontSize: 12,
          fontWeight: "500",
          color: colors.textSecondary,
        },
        altFare: {
          fontSize: 15,
          fontWeight: "700",
          color: colors.text,
        },
        altRating: {
          flexDirection: "row",
          alignItems: "center",
          gap: 2,
        },
        altRatingText: {
          fontSize: 11,
          fontWeight: "600",
          color: colors.primary,
        },

        /* ─── Continue CTA ──────────────────────────────── */
        ctaWrap: {
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: insets.bottom ? 0 : 12,
        },
        ctaBtn: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          height: 56,
          borderRadius: 16,
          backgroundColor: colors.primary,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 8,
        },
        ctaLabel: {
          fontSize: 16,
          fontWeight: "700",
          color: "#000000",
        },
        ctaDisabled: {
          opacity: 0.5,
        },
      }),
    [colors, isDark, insets.bottom],
  );

  return (
    <View style={s.sheet}>
      <View style={s.handle} />

      <ScrollView
        style={s.inner}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ─── Featured Card — Recommended Ride ─────────── */}
        {featured ? (
          <Pressable
            style={s.featuredCard}
            onPress={() => onSelect(featured.id)}
            accessibilityRole="radio"
            accessibilityState={{ checked: true }}
          >
            <View style={s.featuredTop}>
              <View style={s.featuredVehicle}>
                {getVehicle(featured.id, "compact")}
              </View>
              <View style={s.featuredInfo}>
                <View style={s.featuredNameRow}>
                  <Text style={s.featuredName}>{featured.label}</Text>
                  <Text style={s.featuredBadge}>Recommended</Text>
                </View>
                <Text style={s.featuredSubtitle}>{featured.subtitle}</Text>
              </View>
              {featured.fare ? (
                <View style={s.featuredFareWrap}>
                  <Text style={s.featuredFare}>{featured.fare}</Text>
                  <Text style={s.featuredFareLabel}>estimated</Text>
                </View>
              ) : null}
            </View>
            <View style={s.featuredMeta}>
              {featured.eta ? (
                <View style={s.metaChip}>
                  <Clock size={12} color="#4CD964" />
                  <Text style={s.metaChipText}>{featured.eta}</Text>
                </View>
              ) : null}
              <View style={s.metaChip}>
                <Text style={s.metaChipText}>{featured.benefit}</Text>
              </View>
              {featured.rating ? (
                <View style={s.metaChipRating}>
                  <Star size={11} color={colors.primary} fill={colors.primary} />
                  <Text style={s.ratingText}>{featured.rating.toFixed(1)}</Text>
                </View>
              ) : null}
            </View>
          </Pressable>
        ) : null}

        {/* ─── Other Options ────────────────────────────── */}
        {alternatives.length > 0 ? (
          <>
            <Text style={s.sectionLabel}>Other options</Text>
            {alternatives.map((alt) => (
              <Pressable
                key={alt.id}
                style={({ pressed }) => [
                  s.altRow,
                  pressed && s.altRowActive,
                ]}
                onPress={() => onSelect(alt.id)}
                accessibilityRole="radio"
                accessibilityState={{ checked: false }}
              >
                <View style={s.altVehicle}>
                  {getVehicle(alt.id, "compact")}
                </View>
                <View style={s.altInfo}>
                  <View style={s.altNameRow}>
                    <Text style={s.altName}>{alt.label}</Text>
                    {alt.rating ? (
                      <View style={s.altRating}>
                        <Star size={10} color={colors.primary} fill={colors.primary} />
                        <Text style={s.altRatingText}>{alt.rating.toFixed(1)}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={s.altBenefit}>{alt.benefit}</Text>
                </View>
                <View style={s.altRight}>
                  {alt.eta ? <Text style={s.altEta}>{alt.eta}</Text> : null}
                  {alt.fare ? <Text style={s.altFare}>{alt.fare}</Text> : null}
                </View>
              </Pressable>
            ))}
          </>
        ) : null}

        {/* Spacer */}
        <View style={{ height: 8 }} />
      </ScrollView>

      {/* ─── Fixed Continue CTA ─────────────────────────── */}
      <View style={s.ctaWrap}>
        <Pressable
          style={[s.ctaBtn, loading && s.ctaDisabled]}
          onPress={onConfirm}
          disabled={loading}
          accessibilityRole="button"
        >
          <Text style={s.ctaLabel}>
            {loading ? "Finding rider..." : "Continue"}
          </Text>
          {!loading && <ArrowRight size={18} color="#000000" />}
        </Pressable>
      </View>
    </View>
  );
}
