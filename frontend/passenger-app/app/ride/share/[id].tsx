import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, MapPin, Navigation, ShieldCheck, Star, User } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { API_BASE_URL } from "@/lib/api";

const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

type SharedTrip = {
  id: string;
  status: string;
  pickupAddress: string;
  destinationAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  destinationLatitude: number;
  destinationLongitude: number;
  estimatedFare: number;
  estimatedDurationMinutes: number;
  rider: {
    id: string;
    ratingAverage: number;
    user: {
      fullName: string;
      avatarUrl?: string;
    };
  } | null;
  shareableUrl: string;
};

export default function ShareTripScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, typography } = useTheme();
  const [trip, setTrip] = useState<SharedTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`${API_BASE_URL}/rides/${id}/share`)
      .then((res) => {
        if (!res.ok) throw new Error("Trip not found");
        return res.json();
      })
      .then((data) => setTrip(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: spacing.md,
    },
    title: { ...typography.h3, color: colors.text },
    content: { padding: spacing.lg, gap: spacing.lg },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.md,
    },
    badge: {
      alignSelf: "flex-start",
      backgroundColor: colors.primary + "20",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: 12,
    },
    badgeText: {
      ...typography.caption,
      color: colors.primary,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    addrText: { ...typography.body, color: colors.text, flex: 1 },
    divider: { height: 1, backgroundColor: colors.border },
    driverInfo: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    driverName: { ...typography.h3, color: colors.text },
    ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    ratingText: { ...typography.caption, color: colors.textMuted },
  });

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error || !trip) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ ...typography.body, color: colors.danger }}>{error ?? "Trip not found"}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Live Trip Tracking</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{trip.status.replace("_", " ")}</Text>
            </View>
            <View style={styles.row}>
              <ShieldCheck size={16} color={colors.primary} />
              <Text style={{ ...typography.caption, color: colors.textMuted }}>Live Encrypted</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <MapPin size={20} color={colors.primary} />
            <Text style={styles.addrText}>{trip.pickupAddress}</Text>
          </View>
          <View style={styles.row}>
            <Navigation size={20} color={colors.accent} />
            <Text style={styles.addrText}>{trip.destinationAddress}</Text>
          </View>
        </View>

        {trip.rider && (
          <View style={styles.card}>
            <Text style={{ ...typography.caption, color: colors.textMuted }}>DRIVER DETAILS</Text>
            <View style={styles.driverInfo}>
              <View style={styles.avatar}>
                <User size={24} color={colors.textOnPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.driverName}>{trip.rider.user.fullName}</Text>
                <View style={styles.ratingRow}>
                  <Star size={14} color="#F59E0B" fill="#F59E0B" />
                  <Text style={styles.ratingText}>{trip.rider.ratingAverage.toFixed(1)} Rating</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
