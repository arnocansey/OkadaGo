import { useMemo, useRef } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Clock, ArrowRight } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { StandardBike } from "@/components/vehicles/StandardBike";
import { ExpressBike } from "@/components/vehicles/ExpressBike";
import { CargoTrike } from "@/components/vehicles/CargoTrike";
import { space, radii, type, layout } from "@/theme/design-system";

export type RideType = "standard" | "express" | "cargo";

type RideOption = {
  id: RideType;
  label: string;
  subtitle: string;
  benefit: string;
  fare?: string;
  eta?: string;
};

type Props = {
  options: RideOption[];
  selected: RideType;
  onSelect: (id: RideType) => void;
  onConfirm: () => void;
  loading?: boolean;
  currency?: string;
};

const CATEGORY_TABS: Array<{ id: RideType; label: string }> = [
  { id: "standard", label: "OkadaGo" },
  { id: "express", label: "OkadaX" },
  { id: "cargo", label: "Cargo" },
];

function getVehicle(id: RideType, size: "featured" | "compact") {
  const featured = size === "featured";
  switch (id) {
    case "standard":
      return <StandardBike width={featured ? 160 : 56} height={featured ? 112 : 40} />;
    case "express":
      return <ExpressBike width={featured ? 160 : 56} height={featured ? 112 : 40} />;
    case "cargo":
      return <CargoTrike width={featured ? 180 : 64} height={featured ? 124 : 44} />;
  }
}

/**
 * BookingSheet — Compact bottom-sheet ride selector.
 *
 * Layout (inside bottom ~50% of screen):
 * ┌──────────────────────────────────┐
 * │  ─── handle ───                  │
 * │                                  │
 * │  [OkadaGo] [OkadaX] [Cargo]     │  ← horizontal category tabs
 * │                                  │
 * │  ┌──────────────────────────┐   │
 * │  │  🏍️  OkadaGo             │   │  ← featured card (selected ride)
 * │  │      Standard motorcycle  │   │
 * │  │  ⏱ 8 min  ●  Affordable  │   │
 * │  │              GHS 24.50    │   │
 * │  └──────────────────────────┘   │
 * │                                  │
 * │  ── Other options ──────────────│
 * │  🏍️ OkadaX   ~6 min  Fast  ₵30│  ← compact rows
 * │  🚚 Cargo    ~10 min  Load ₵22│
 * │                                  │
 * │  ┌──────────────────────────┐   │
 * │  │     Continue  →          │   │  ← fixed CTA
 * │  └──────────────────────────┘   │
 * └──────────────────────────────────┘
 */
export function BookingSheet({ options, selected, onSelect, onConfirm, loading }: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const scrollRef = useRef<ScrollView>(null);

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
          borderTopLeftRadius: radii.sheet,
          borderTopRightRadius: radii.sheet,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: isDark ? 0.5 : 0.12,
          shadowRadius: 20,
          elevation: 12,
          paddingBottom: insets.bottom || space[4],
        },
        handle: {
          alignSelf: "center",
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: isDark ? colors.borderStrong : "#D1D5DB",
          marginTop: space[3],
          marginBottom: space[2],
        },
        inner: {
          flex: 1,
          paddingHorizontal: layout.sheetPadding,
        },

        /* ─── Category Tabs ─────────────────────────────── */
        tabRow: {
          flexDirection: "row",
          gap: space[2],
          marginBottom: space[3],
        },
        tab: {
          paddingHorizontal: space[4],
          paddingVertical: space[2],
          borderRadius: radii.pill,
          backgroundColor: isDark ? colors.surfaceOverlay : "#F1F3F5",
        },
        tabActive: {
          backgroundColor: colors.primary,
        },
        tabText: {
          ...type.captionEmphasis,
          color: isDark ? colors.textSecondary : "#495057",
        },
        tabTextActive: {
          color: "#000000",
        },

        /* ─── Featured Card ─────────────────────────────── */
        featuredCard: {
          backgroundColor: isDark ? colors.surfaceRaised : "#FAFAFA",
          borderRadius: radii.card,
          borderWidth: 2,
          borderColor: colors.primary,
          padding: space[4],
          marginBottom: space[3],
        },
        featuredTop: {
          flexDirection: "row",
          alignItems: "center",
          gap: space[3],
        },
        featuredVehicle: {
          width: 72,
          height: 56,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: radii.md,
          backgroundColor: isDark ? "rgba(250,204,21,0.08)" : "rgba(250,204,21,0.06)",
        },
        featuredInfo: {
          flex: 1,
        },
        featuredName: {
          ...type.title,
          color: colors.text,
        },
        featuredSubtitle: {
          ...type.caption,
          color: colors.textMuted,
          marginTop: 1,
        },
        featuredFareWrap: {
          alignItems: "flex-end",
        },
        featuredFare: {
          ...type.title,
          color: colors.primary,
        },
        featuredFareLabel: {
          ...type.micro,
          color: colors.textMuted,
        },
        featuredMeta: {
          flexDirection: "row",
          alignItems: "center",
          gap: space[3],
          marginTop: space[3],
        },
        metaChip: {
          flexDirection: "row",
          alignItems: "center",
          gap: space[1],
          paddingHorizontal: space[2],
          paddingVertical: 4,
          borderRadius: radii.sm,
          backgroundColor: isDark ? colors.surfaceOverlay : "#F1F3F5",
        },
        metaChipText: {
          ...type.micro,
          color: colors.textSecondary,
        },

        /* ─── Section Divider ───────────────────────────── */
        dividerRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: space[3],
          marginBottom: space[2],
        },
        dividerLine: {
          flex: 1,
          height: 1,
          backgroundColor: colors.border,
        },
        dividerText: {
          ...type.micro,
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },

        /* ─── Compact Alternative Rows ──────────────────── */
        altRow: {
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: space[3],
          paddingHorizontal: space[3],
          borderRadius: radii.md,
          backgroundColor: isDark ? colors.surfaceOverlay : "#F8F9FA",
          marginBottom: space[2],
          borderWidth: 1.5,
          borderColor: "transparent",
        },
        altRowActive: {
          borderColor: colors.primary,
          backgroundColor: isDark ? "rgba(250,204,21,0.06)" : "rgba(250,204,21,0.04)",
        },
        altVehicle: {
          width: 52,
          height: 36,
          alignItems: "center",
          justifyContent: "center",
          marginRight: space[3],
        },
        altInfo: {
          flex: 1,
        },
        altName: {
          ...type.bodyEmphasis,
          color: colors.text,
        },
        altBenefit: {
          ...type.micro,
          color: colors.textMuted,
          marginTop: 1,
        },
        altRight: {
          alignItems: "flex-end",
          gap: 2,
        },
        altEta: {
          ...type.micro,
          color: colors.textSecondary,
        },
        altFare: {
          ...type.bodyEmphasis,
          color: colors.text,
        },

        /* ─── Continue CTA ──────────────────────────────── */
        ctaWrap: {
          paddingHorizontal: layout.sheetPadding,
          paddingTop: space[3],
          paddingBottom: insets.bottom ? 0 : space[3],
        },
        ctaBtn: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: space[2],
          height: 56,
          borderRadius: radii.lg,
          backgroundColor: colors.primary,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 8,
        },
        ctaLabel: {
          ...type.bodyEmphasis,
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
        ref={scrollRef}
        style={s.inner}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Category Tabs */}
        <View style={s.tabRow}>
          {CATEGORY_TABS.map((tab) => {
            const isActive = selected === tab.id;
            return (
              <Pressable
                key={tab.id}
                style={[s.tab, isActive && s.tabActive]}
                onPress={() => onSelect(tab.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
              >
                <Text style={[s.tabText, isActive && s.tabTextActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Featured Card — Selected Ride */}
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
                <Text style={s.featuredName}>{featured.label}</Text>
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
            </View>
          </Pressable>
        ) : null}

        {/* Other Options */}
        {alternatives.length > 0 ? (
          <>
            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>Other options</Text>
              <View style={s.dividerLine} />
            </View>

            {alternatives.map((alt) => (
              <Pressable
                key={alt.id}
                style={s.altRow}
                onPress={() => onSelect(alt.id)}
                accessibilityRole="radio"
                accessibilityState={{ checked: false }}
              >
                <View style={s.altVehicle}>
                  {getVehicle(alt.id, "compact")}
                </View>
                <View style={s.altInfo}>
                  <Text style={s.altName}>{alt.label}</Text>
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

        {/* Spacer for scroll content */}
        <View style={{ height: space[2] }} />
      </ScrollView>

      {/* Fixed Continue CTA */}
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
