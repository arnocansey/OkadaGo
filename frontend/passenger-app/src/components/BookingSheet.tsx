import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Clock, Star, Users } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { StandardBike } from "@/components/vehicles/StandardBike";
import { ExpressBike } from "@/components/vehicles/ExpressBike";
import { CargoTrike } from "@/components/vehicles/CargoTrike";
import { OkadaSheet, ThumbButton, AsymmetricCard, StatPill } from "@/components/ui";
import { space, radii, type, layout } from "@/theme/design-system";

type RideType = "standard" | "express" | "cargo";

type RideOption = {
  id: RideType;
  label: string;
  subtitle: string;
  fare?: string;
  eta?: string;
  capacity: string;
  rating: string;
  benefits: string[];
};

type Props = {
  options: RideOption[];
  selected: RideType;
  onSelect: (id: RideType) => void;
  onConfirm: () => void;
  loading?: boolean;
};

/**
 * BookingSheet — Motorcycle-first ride selection in a bottom sheet.
 *
 * Design principles:
 * - Map stays visible (40% of screen)
 * - Bottom sheet slides up to 60% with ride options
 * - Each motorcycle is the HERO — large illustration, not a tiny icon
 * - Asymmetric card layout — slight left offset for visual interest
 * - Thumb-zone confirm button at bottom
 * - Stat pills show rating, capacity, ETA inline
 *
 * Visual hierarchy:
 * 1. Motorcycle illustration (dominant within each card)
 * 2. Ride name + fare (primary info)
 * 3. Stats row (secondary)
 * 4. Benefits badges (tertiary)
 */
export function BookingSheet({ options, selected, onSelect, onConfirm, loading }: Props) {
  const { colors, isDark } = useTheme();

  const s = useMemo(
    () =>
      StyleSheet.create({
        header: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: space[2],
        },
        title: {
          ...type.headline,
          color: colors.text,
        },
        subtitle: {
          ...type.caption,
          color: colors.textMuted,
        },
        rideList: {
          gap: space[3],
        },
        rideCard: {
          backgroundColor: isDark ? colors.surfaceRaised : "#FFFFFF",
          borderRadius: radii.card,
          borderWidth: 2,
          borderColor: "transparent",
          overflow: "hidden",
        },
        rideCardSelected: {
          borderColor: colors.primary,
        },
        vehicleHero: {
          alignItems: "center",
          justifyContent: "center",
          paddingTop: space[5],
          paddingBottom: space[3],
          backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)",
        },
        rideInfo: {
          paddingHorizontal: space[5],
          paddingBottom: space[5],
          gap: space[3],
        },
        rideHeader: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        },
        rideNameGroup: { flex: 1 },
        rideName: {
          ...type.title,
          color: colors.text,
        },
        rideSubtitle: {
          ...type.caption,
          color: colors.textMuted,
          marginTop: 2,
        },
        fareGroup: {
          alignItems: "flex-end",
        },
        fare: {
          ...type.title,
          color: colors.primary,
        },
        fareLabel: {
          ...type.micro,
          color: colors.textMuted,
        },
        statsRow: {
          flexDirection: "row",
          gap: space[3],
        },
        benefitsRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: space[2],
        },
        benefitBadge: {
          paddingHorizontal: space[3],
          paddingVertical: space[1],
          borderRadius: radii.pill,
          backgroundColor: isDark ? "rgba(250, 204, 21, 0.08)" : "rgba(250, 204, 21, 0.06)",
        },
        benefitText: {
          ...type.micro,
          color: colors.primary,
        },
        confirmWrap: {
          paddingTop: space[3],
        },
        selectedIndicator: {
          position: "absolute",
          top: space[3],
          right: space[3],
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
        },
        checkText: {
          ...type.bodyEmphasis,
          color: colors.textOnPrimary,
        },
      }),
    [colors, isDark],
  );

  function getVehicle(type: RideType) {
    switch (type) {
      case "standard":
        return <StandardBike width={180} height={126} />;
      case "express":
        return <ExpressBike width={180} height={126} />;
      case "cargo":
        return <CargoTrike width={200} height={136} />;
    }
  }

  return (
    <OkadaSheet style={{ maxHeight: "60%" }} contentStyle={{ gap: space[4] }}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Choose your ride</Text>
        <Text style={s.subtitle}>3 options available</Text>
      </View>

      {/* Ride Options — Scrollable motorcycle cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: space[3], paddingRight: space[4] }}
        decelerationRate="fast"
        snapToInterval={280}
      >
        {options.map((option) => {
          const isActive = selected === option.id;
          return (
            <Pressable
              key={option.id}
              style={[s.rideCard, isActive && s.rideCardSelected]}
              onPress={() => onSelect(option.id)}
              accessibilityRole="radio"
              accessibilityState={{ checked: isActive }}
            >
              {isActive ? (
                <View style={s.selectedIndicator}>
                  <Text style={s.checkText}>✓</Text>
                </View>
              ) : null}

              {/* Hero: Motorcycle illustration */}
              <View style={s.vehicleHero}>
                {getVehicle(option.id)}
              </View>

              {/* Info section */}
              <View style={s.rideInfo}>
                <View style={s.rideHeader}>
                  <View style={s.rideNameGroup}>
                    <Text style={s.rideName}>{option.label}</Text>
                    <Text style={s.rideSubtitle}>{option.subtitle}</Text>
                  </View>
                  {option.fare ? (
                    <View style={s.fareGroup}>
                      <Text style={s.fare}>{option.fare}</Text>
                      <Text style={s.fareLabel}>estimated</Text>
                    </View>
                  ) : null}
                </View>

                {/* Stats row */}
                <View style={s.statsRow}>
                  {option.eta ? (
                    <StatPill
                      icon={<Clock size={14} color="#4CD964" />}
                      value={option.eta}
                      label="ETA"
                      tint="green"
                      compact
                    />
                  ) : null}
                  <StatPill
                    icon={<Users size={14} color="#0A84FF" />}
                    value={option.capacity}
                    label="Capacity"
                    tint="blue"
                    compact
                  />
                  <StatPill
                    icon={<Star size={14} color="#FFD700" />}
                    value={option.rating}
                    label="Rating"
                    tint="gold"
                    compact
                  />
                </View>

                {/* Benefits */}
                {option.benefits.length > 0 ? (
                  <View style={s.benefitsRow}>
                    {option.benefits.map((b) => (
                      <View key={b} style={s.benefitBadge}>
                        <Text style={s.benefitText}>{b}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Confirm CTA — Thumb zone */}
      <View style={s.confirmWrap}>
        <ThumbButton
          label="Confirm ride"
          onPress={onConfirm}
          loading={loading}
          icon={<Text style={{ fontSize: 18 }}>🏍️</Text>}
        />
      </View>
    </OkadaSheet>
  );
}
