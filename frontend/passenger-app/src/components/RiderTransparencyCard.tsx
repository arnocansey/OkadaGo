import type { ReactNode } from "react";
import { useMemo } from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { Shield, Star, Clock, MapPin, Award, BadgeCheck, Phone, FileCheck, Users } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { radius, spacing } from "@/theme/tokens";
import { Avatar } from "@/components/ui/Avatar";

export type RiderProfile = {
  name: string;
  avatarUrl?: string | null;
  rating?: number | null;
  completedTrips?: number | null;
  joinedAt?: string | null;
  distanceKm?: number | null;
  vehicle?: {
    make?: string | null;
    model?: string | null;
    plateNumber?: string | null;
    color?: string | null;
  } | null;
  isPhoneVerified?: boolean;
  isApproved?: boolean;
  documentsVerified?: boolean;
  bio?: string | null;
  badges?: string[];
};

type Props = {
  rider: RiderProfile;
  matchReason?: string;
  onCall?: () => void;
  style?: ViewStyle;
};

function formatJoinDuration(joinedAt: string): string {
  const joined = new Date(joinedAt);
  const now = new Date();
  const diffMs = now.getTime() - joined.getTime();
  const totalMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  if (years > 0 && months > 0) return `${years}y ${months}m`;
  if (years > 0) return `${years} year${years > 1 ? "s" : ""}`;
  if (months > 0) return `${months} month${months > 1 ? "s" : ""}`;
  return "New rider";
}

function computeBadges(rider: RiderProfile): string[] {
  const badges: string[] = [];
  if (rider.rating && rider.rating >= 4.9) badges.push("Top Rated");
  if (rider.completedTrips && rider.completedTrips >= 500) badges.push("500+ Trips");
  if (rider.completedTrips && rider.completedTrips >= 1000) badges.push("Road Veteran");
  if (rider.isApproved) badges.push("Verified");
  if (rider.documentsVerified) badges.push("Docs Verified");
  return badges;
}

export function RiderTransparencyCard({ rider, matchReason, onCall, style }: Props) {
  const { colors, typography } = useTheme();

  const joinDuration = rider.joinedAt ? formatJoinDuration(rider.joinedAt) : null;
  const allBadges = rider.badges?.length ? rider.badges : computeBadges(rider);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          overflow: "hidden",
        },
        heroSection: {
          alignItems: "center",
          paddingTop: spacing.xl,
          paddingBottom: spacing.lg,
          backgroundColor: colors.primaryLight,
        },
        avatarWrap: {
          marginBottom: spacing.md,
        },
        name: {
          ...typography.h2,
          color: colors.text,
        },
        matchReasonText: {
          ...typography.caption,
          color: colors.textSecondary,
          marginTop: 4,
          textAlign: "center",
          paddingHorizontal: spacing.xl,
        },
        statsGrid: {
          flexDirection: "row",
          flexWrap: "wrap",
          padding: spacing.lg,
          gap: spacing.md,
        },
        statCard: {
          width: "47%",
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          padding: spacing.md,
          borderRadius: radius.md,
          backgroundColor: colors.surfaceElevated,
        },
        statIcon: {
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
        },
        statContent: {
          flex: 1,
          gap: 2,
        },
        statValue: {
          ...typography.bodySemibold,
          color: colors.text,
        },
        statLabel: {
          ...typography.tiny,
          color: colors.textMuted,
        },
        verifiedSection: {
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.lg,
        },
        verifiedTitle: {
          ...typography.captionMedium,
          color: colors.textMuted,
          marginBottom: spacing.sm,
        },
        verifiedRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: spacing.sm,
        },
        verifiedBadge: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.full,
          backgroundColor: "rgba(76, 217, 100, 0.1)",
        },
        verifiedBadgeText: {
          ...typography.captionMedium,
          color: colors.success,
        },
        pendingBadge: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.full,
          backgroundColor: "rgba(255, 204, 0, 0.1)",
        },
        pendingBadgeText: {
          ...typography.captionMedium,
          color: colors.warning,
        },
        badgesSection: {
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.lg,
        },
        badgesTitle: {
          ...typography.captionMedium,
          color: colors.textMuted,
          marginBottom: spacing.sm,
        },
        badgesRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: spacing.sm,
        },
        badgeChip: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.full,
          backgroundColor: "rgba(250, 204, 21, 0.1)",
        },
        badgeText: {
          ...typography.captionMedium,
          color: colors.primary,
        },
        bioSection: {
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.lg,
        },
        bioText: {
          ...typography.body,
          color: colors.textSecondary,
          fontStyle: "italic",
        },
        divider: {
          height: StyleSheet.hairlineWidth,
          backgroundColor: colors.border,
          marginHorizontal: spacing.lg,
        },
        callSection: {
          padding: spacing.lg,
        },
        callBtn: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
          paddingVertical: spacing.md,
          borderRadius: radius.md,
          borderWidth: 1.5,
          borderColor: colors.primary,
        },
        callBtnText: {
          ...typography.bodySemibold,
          color: colors.primary,
        },
      }),
    [colors, typography],
  );

  return (
    <View style={[styles.card, style]}>
      {/* Hero: Avatar + Name */}
      <View style={styles.heroSection}>
        <View style={styles.avatarWrap}>
          <Avatar name={rider.name} size={72} imageUri={rider.avatarUrl ?? undefined} />
        </View>
        <Text style={styles.name}>{rider.name}</Text>
        {matchReason ? (
          <Text style={styles.matchReasonText}>{matchReason}</Text>
        ) : null}
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {rider.rating != null ? (
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "rgba(255, 215, 0, 0.15)" }]}>
              <Star size={18} color="#FFD700" fill="#FFD700" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>
                {typeof rider.rating === "number" && Number.isFinite(rider.rating) ? rider.rating.toFixed(1) : "5.0"}
              </Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        ) : null}

        {rider.completedTrips != null ? (
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "rgba(10, 132, 255, 0.12)" }]}>
              <Users size={18} color="#0A84FF" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{rider.completedTrips.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Trips completed</Text>
            </View>
          </View>
        ) : null}

        {joinDuration ? (
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "rgba(76, 217, 100, 0.12)" }]}>
              <Clock size={18} color="#4CD964" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{joinDuration}</Text>
              <Text style={styles.statLabel}>On OkadaGo</Text>
            </View>
          </View>
        ) : null}

        {rider.distanceKm != null ? (
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "rgba(255, 107, 0, 0.12)" }]}>
              <MapPin size={18} color="#FF6B00" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>
                {typeof rider.distanceKm === "number" && Number.isFinite(rider.distanceKm)
                  ? rider.distanceKm < 1
                    ? `${Math.round(rider.distanceKm * 1000)}m`
                    : `${rider.distanceKm.toFixed(1)} km`
                  : "—"}
              </Text>
              <Text style={styles.statLabel}>Away from you</Text>
            </View>
          </View>
        ) : null}
      </View>

      {/* Safety Verification */}
      <View style={styles.verifiedSection}>
        <Text style={styles.verifiedTitle}>Safety & Verification</Text>
        <View style={styles.verifiedRow}>
          {rider.isApproved ? (
            <View style={styles.verifiedBadge}>
              <BadgeCheck size={14} color={colors.success} />
              <Text style={styles.verifiedBadgeText}>Identity verified</Text>
            </View>
          ) : (
            <View style={styles.pendingBadge}>
              <Shield size={14} color={colors.warning} />
              <Text style={styles.pendingBadgeText}>Pending verification</Text>
            </View>
          )}

          {rider.isPhoneVerified ? (
            <View style={styles.verifiedBadge}>
              <Phone size={14} color={colors.success} />
              <Text style={styles.verifiedBadgeText}>Phone verified</Text>
            </View>
          ) : null}

          {rider.documentsVerified ? (
            <View style={styles.verifiedBadge}>
              <FileCheck size={14} color={colors.success} />
              <Text style={styles.verifiedBadgeText}>Documents verified</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Badges */}
      {allBadges.length > 0 ? (
        <View style={styles.badgesSection}>
          <Text style={styles.badgesTitle}>Achievements</Text>
          <View style={styles.badgesRow}>
            {allBadges.map((badge) => (
              <View key={badge} style={styles.badgeChip}>
                <Award size={14} color={colors.primary} />
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* Bio */}
      {rider.bio ? (
        <View style={styles.bioSection}>
          <Text style={styles.bioText}>"{rider.bio}"</Text>
        </View>
      ) : null}

      {/* Vehicle Info */}
      {rider.vehicle?.plateNumber ? (
        <>
          <View style={styles.divider} />
          <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
            <Text style={styles.statLabel}>Vehicle</Text>
            <Text style={styles.statValue}>
              {[rider.vehicle.color, rider.vehicle.make, rider.vehicle.model].filter(Boolean).join(" ")}
            </Text>
            <Text style={[styles.statValue, { color: colors.primary, marginTop: 2 }]}>
              {rider.vehicle.plateNumber}
            </Text>
          </View>
        </>
      ) : null}

      {/* Call Button */}
      {onCall ? (
        <>
          <View style={styles.divider} />
          <View style={styles.callSection}>
            <View style={styles.callBtn}>
              <Phone size={18} color={colors.primary} />
              <Text style={styles.callBtnText}>Call rider</Text>
            </View>
          </View>
        </>
      ) : null}
    </View>
  );
}
