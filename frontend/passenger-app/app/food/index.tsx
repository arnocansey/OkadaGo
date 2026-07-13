import { Stack, router } from "expo-router";
import { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MapPin, Star } from "lucide-react-native";
import { FOOD_CATEGORIES } from "@/data/foodCatalog";
import { useNearbyRestaurants } from "@/hooks/useNearbyRestaurants";
import { useTheme } from "@/context/ThemeContext";
import { SkeletonList } from "@/components/ui/Skeleton";
import { photoUrl } from "@/services/googlePlaces";
import { formatDistanceKm } from "@/lib/geo";
import { radius, spacing } from "@/theme/tokens";

export default function FoodHomeScreen() {
  const { colors, typography, stackHeaderOptions } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
        sectionHeader: { paddingTop: spacing.lg, paddingBottom: spacing.md, gap: 2 },
        sectionTitle: { ...typography.h3, color: colors.text },
        sectionSub: { ...typography.caption, color: colors.textMuted },
        categories: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: spacing.sm,
          paddingBottom: spacing.lg,
        },
        category: {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.full,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        },
        categoryActive: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
        categoryActiveRing: {
          borderWidth: 2,
          borderColor: colors.primary,
        },
        categoryEmoji: { fontSize: 14 },
        categoryLabel: { ...typography.captionMedium, color: colors.text },
        categoryLabelActive: { color: colors.text },
        errorBanner: {
          backgroundColor: colors.dangerLight,
          borderRadius: radius.md,
          padding: spacing.lg,
          marginBottom: spacing.md,
          gap: spacing.sm,
          borderWidth: 1,
          borderColor: colors.danger,
        },
        errorTitle: { ...typography.bodySemibold, color: colors.danger },
        errorText: { ...typography.caption, color: colors.danger },
        retryButton: {
          alignSelf: "flex-start",
          marginTop: spacing.xs,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.full,
          backgroundColor: colors.danger,
        },
        retryButtonText: { ...typography.captionMedium, color: colors.textOnPrimary },
        empty: { alignItems: "center", paddingVertical: spacing.xxxl, gap: spacing.sm },
        emptyTitle: { ...typography.bodySemibold, color: colors.text },
        emptySub: { ...typography.caption, color: colors.textMuted, textAlign: "center" },
        card: {
          flexDirection: "row",
          gap: spacing.lg,
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: spacing.md,
        },
        thumb: { width: 64, height: 64, borderRadius: radius.md, overflow: "hidden", alignItems: "center", justifyContent: "center" },
        thumbImg: { width: 64, height: 64, borderRadius: radius.md },
        thumbFallback: { width: 64, height: 64, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
        thumbText: { ...typography.h2, color: colors.text },
        cardBody: { flex: 1, gap: 2 },
        name: { ...typography.bodySemibold, color: colors.text },
        cuisine: { ...typography.caption, color: colors.textSecondary },
        meta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: spacing.sm, flexWrap: "wrap" },
        metaText: { ...typography.caption, color: colors.textMuted },
        distanceRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
        distanceText: { ...typography.caption, color: colors.textMuted },
      }),
    [colors, typography],
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { restaurants, loading, error, refresh } = useNearbyRestaurants({
    categoryId: selectedCategory,
  });
  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Food & groceries", ...stackHeaderOptions }} />
      <SafeAreaView style={styles.screen} edges={["bottom"]}>
        <FlatList
          data={restaurants}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListHeaderComponent={
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Near you</Text>
                <Text style={styles.sectionSub}>Sorted by distance from your location</Text>
              </View>

              <View style={styles.categories}>
                <Pressable
                  style={[styles.category, !selectedCategory && styles.categoryActive]}
                  onPress={() => setSelectedCategory(null)}
                >
                  <Text style={[styles.categoryLabel, !selectedCategory && styles.categoryLabelActive]}>
                    All
                  </Text>
                </Pressable>
                {FOOD_CATEGORIES.map((cat) => {
                  const active = selectedCategory === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      style={[styles.category, { backgroundColor: cat.color }, active && styles.categoryActiveRing]}
                      onPress={() => setSelectedCategory(active ? null : cat.id)}
                    >
                      <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                      <Text style={styles.categoryLabel}>{cat.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {loading ? (
                <SkeletonList count={4} />
              ) : null}

              {error ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorTitle}>Could not load places</Text>
                  <Text style={styles.errorText}>{error}</Text>
                  <Pressable style={styles.retryButton} onPress={() => refresh()}>
                    <Text style={styles.retryButtonText}>Try again</Text>
                  </Pressable>
                </View>
              ) : null}
            </>
          }
          ListEmptyComponent={
            !loading && !error ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No places nearby</Text>
                <Text style={styles.emptySub}>
                  {selectedCategory
                    ? "Try another category or pull down to refresh."
                    : "Pull down to refresh your location."}
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => router.push(`/food/${item.id}`)}>
              {item.photoReference ? (
                <View style={styles.thumb}>
                  <Image source={{ uri: photoUrl(item.photoReference, 200) }} style={styles.thumbImg} />
                </View>
              ) : (
                <View style={[styles.thumbFallback, { backgroundColor: item.color }]}>
                  <Text style={styles.thumbText}>{item.name[0]}</Text>
                </View>
              )}
              <View style={styles.cardBody}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.cuisine}>{item.cuisine}</Text>
                <View style={styles.meta}>
                  {item.rating > 0 ? (
                    <>
                      <Star size={14} color={colors.accent} fill={colors.accent} />
                      <Text style={styles.metaText}>{item.rating.toFixed(1)}</Text>
                      <Text style={styles.metaText}>· </Text>
                    </>
                  ) : null}
                  <Text style={styles.metaText}>{item.etaMin} min</Text>
                  <Text style={styles.metaText}>· ~GHS {item.deliveryFee} delivery</Text>
                </View>
                <View style={styles.distanceRow}>
                  <MapPin size={12} color={colors.textMuted} />
                  <Text style={styles.distanceText} numberOfLines={1}>
                    {item.address ? `${item.address} · ` : ""}
                    {formatDistanceKm(item.distanceKm)} away
                  </Text>
                </View>
              </View>
            </Pressable>
          )}
        />
      </SafeAreaView>
    </>
  );
}
