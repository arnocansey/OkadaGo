import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Clock, MapPin, Phone, Plus, Minus } from "lucide-react-native";
import { useNearbyRestaurants } from "@/hooks/useNearbyRestaurants";
import { formatDistanceKm } from "@/lib/geo";
import { fetchPlaceDetails } from "@/services/googlePlaces";
import type { NearbyRestaurant } from "@/services/nearbyPlaces";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useTheme } from "@/context/ThemeContext";
import { radius, spacing } from "@/theme/tokens";

export default function RestaurantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography, stackHeaderOptions } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        loadingPad: { padding: spacing.xl, marginTop: spacing.xxl },
        notFoundPad: { padding: spacing.xl, marginTop: spacing.xxl },
        hero: { padding: spacing.xl, borderRadius: radius.lg, margin: spacing.xl, marginBottom: spacing.md, gap: spacing.sm },
        heroTitle: { ...typography.h2, color: colors.textOnPrimary },
        heroSub: { ...typography.caption, color: "rgba(255,255,255,0.85)" },
        heroAddress: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.xs },
        heroAddressText: { ...typography.caption, color: "rgba(255,255,255,0.85)", flex: 1 },
        heroMeta: { ...typography.caption, color: "rgba(255,255,255,0.85)" },
        phoneRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
        notesBlock: { paddingHorizontal: spacing.xl, gap: spacing.sm, marginBottom: spacing.lg },
        notesLabel: { ...typography.bodySemibold, color: colors.text },
        notesInput: {
          ...typography.body,
          color: colors.text,
          minHeight: 88,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.md,
          padding: spacing.md,
          backgroundColor: colors.surface,
          textAlignVertical: "top",
        },
        notesHint: { ...typography.caption, color: colors.textMuted },
        sectionTitle: { ...typography.bodySemibold, color: colors.text, paddingHorizontal: spacing.xl, marginBottom: spacing.sm },
        list: { paddingHorizontal: spacing.xl, paddingBottom: 120 },
        item: {
          flexDirection: "row",
          gap: spacing.lg,
          paddingVertical: spacing.lg,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        itemBody: { flex: 1, gap: spacing.xs },
        itemName: { ...typography.bodySemibold, color: colors.text },
        itemDesc: { ...typography.caption, color: colors.textSecondary },
        itemPrice: { ...typography.captionMedium, color: colors.text, marginTop: spacing.xs },
        qty: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
        qtyBtn: {
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.surface,
          alignItems: "center",
          justifyContent: "center",
        },
        qtyVal: { ...typography.bodySemibold, color: colors.text, minWidth: 20, textAlign: "center" },
        deliveryNote: {
          flexDirection: "row",
          gap: spacing.sm,
          paddingVertical: spacing.lg,
          alignItems: "flex-start",
        },
        deliveryNoteText: { ...typography.caption, color: colors.textMuted, flex: 1 },
        footer: {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: spacing.xl,
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        total: { ...typography.h3, color: colors.text },
      }),
    [colors, typography],
  );
  const { getRestaurant, loadRestaurant, loading } = useNearbyRestaurants();
  const [restaurant, setRestaurant] = useState<NearbyRestaurant | undefined>(() =>
    getRestaurant(id ?? ""),
  );
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [orderNotes, setOrderNotes] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function resolveRestaurant() {
      const fromList = getRestaurant(id ?? "");
      if (fromList) {
        setRestaurant(fromList);
        return;
      }

      setDetailsLoading(true);
      try {
        const loaded = await loadRestaurant(id ?? "");
        if (!cancelled) setRestaurant(loaded);
      } finally {
        if (!cancelled) setDetailsLoading(false);
      }
    }

    resolveRestaurant();
    return () => {
      cancelled = true;
    };
  }, [getRestaurant, id, loadRestaurant]);

  useEffect(() => {
    if (!restaurant?.id) return;
    let cancelled = false;

    fetchPlaceDetails(restaurant.id)
      .then((details) => {
        if (cancelled) return;
        setRestaurant((prev) =>
          prev
            ? {
                ...prev,
                address: details.address || prev.address,
                rating: details.rating || prev.rating,
                phone: details.phone,
                openNow: details.openNow,
                photoReference: details.photoReference ?? prev.photoReference,
              }
            : prev,
        );
      })
      .catch(() => {
        /* list data is enough */
      });

    return () => {
      cancelled = true;
    };
  }, [restaurant?.id]);

  if ((loading || detailsLoading) && !restaurant) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loadingPad}>
          <SkeletonList count={5} />
        </View>
      </SafeAreaView>
    );
  }

  if (!restaurant) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.notFoundPad}>
          <EmptyState title="Place not found" message="This restaurant may be unavailable. Go back and try another." />
        </View>
      </SafeAreaView>
    );
  }

  const cartItems = restaurant.menu.filter((m) => (cart[m.id] ?? 0) > 0);
  const notesReady = orderNotes.trim().length >= 4;
  const hasSelection = notesReady;
  const deliveryFee = restaurant.deliveryFee;

  function adjust(itemId: string, delta: number) {
    Haptics.selectionAsync();
    setCart((prev) => {
      const next = Math.max(0, (prev[itemId] ?? 0) + delta);
      return { ...prev, [itemId]: next };
    });
  }

  function checkoutCart() {
    if (!notesReady) return;
    const items =
      cartItems.length > 0
        ? cartItems.map((m) => ({
            menuItemId: m.id,
            name: m.name,
            price: m.price,
            quantity: cart[m.id] ?? 0,
          }))
        : [
            {
              menuItemId: "pickup-order",
              name: "Pickup order",
              price: 0,
              quantity: 1,
            },
          ];

    router.push({
      pathname: "/food/checkout",
      params: {
        restaurantId: restaurant!.id,
        cart: JSON.stringify(items),
        orderNotes: orderNotes.trim(),
      },
    });
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: restaurant.name, ...stackHeaderOptions }} />
      <SafeAreaView style={styles.screen} edges={["bottom"]}>
        <FlatList
          ListHeaderComponent={
            <>
              <View style={[styles.hero, { backgroundColor: restaurant.color }]}>
                <Text style={styles.heroTitle}>{restaurant.name}</Text>
                <Text style={styles.heroSub}>Courier pickup · not in-app menu ordering</Text>
                <Text style={styles.heroSub}>
                  {restaurant.cuisine}
                  {restaurant.rating > 0 ? ` · ★ ${restaurant.rating.toFixed(1)}` : ""}
                  {` · ${restaurant.etaMin} min · ${formatDistanceKm(restaurant.distanceKm)} away`}
                </Text>
                <View style={styles.heroAddress}>
                  <MapPin size={14} color="rgba(255,255,255,0.85)" />
                  <Text style={styles.heroAddressText}>{restaurant.address}</Text>
                </View>
                {restaurant.openNow != null ? (
                  <Text style={styles.heroMeta}>
                    {restaurant.openNow ? "Open now" : "Closed now"}
                  </Text>
                ) : null}
                {restaurant.phone ? (
                  <Pressable
                    style={styles.phoneRow}
                    onPress={() => Linking.openURL(`tel:${restaurant.phone}`)}
                    accessibilityLabel={`Call ${restaurant.name}`}
                    accessibilityRole="button"
                  >
                    <Phone size={14} color="rgba(255,255,255,0.85)" />
                    <Text style={styles.heroAddressText}>{restaurant.phone}</Text>
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.notesBlock}>
                <Text style={styles.notesLabel}>Pickup instructions for your courier</Text>
                <TextInput
                  style={styles.notesInput}
                  value={orderNotes}
                  onChangeText={setOrderNotes}
                  placeholder="e.g. 2x jollof, 1x Coke — ask for Ama at the counter"
                  placeholderTextColor={colors.textMuted}
                  multiline
                />
                <Text style={styles.notesHint}>
                  Required — tell the courier exactly what to collect. Pay food at the store; only the courier fee is charged in-app.
                </Text>
              </View>

              <Text style={styles.sectionTitle}>How should we collect it?</Text>
            </>
          }
          data={restaurant.menu}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <View style={styles.itemBody}>
                <Text style={styles.itemName}>
                  {item.name}
                  {item.popular ? " · Popular" : ""}
                </Text>
                <Text style={styles.itemDesc}>{item.description}</Text>
                <Text style={styles.itemPrice}>
                  {item.price > 0 ? `GHS ${item.price.toFixed(2)}` : "Price at store"}
                </Text>
              </View>
              <View style={styles.qty}>
                <Pressable style={styles.qtyBtn} onPress={() => adjust(item.id, -1)}>
                  <Minus size={16} color={colors.text} />
                </Pressable>
                <Text style={styles.qtyVal}>{cart[item.id] ?? 0}</Text>
                <Pressable style={styles.qtyBtn} onPress={() => adjust(item.id, 1)}>
                  <Plus size={16} color={colors.text} />
                </Pressable>
              </View>
            </View>
          )}
          ListFooterComponent={
            <View style={styles.deliveryNote}>
              <Clock size={14} color={colors.textMuted} />
              <Text style={styles.deliveryNoteText}>
                Delivery fee estimate GHS {deliveryFee} — rider picks up from this place and delivers to you.
              </Text>
            </View>
          }
        />

        <View style={styles.footer}>
          <Text style={styles.total}>
            {notesReady
              ? `Courier fee from GHS ${deliveryFee.toFixed(2)}`
              : "Add pickup instructions to continue"}
          </Text>
          <Button label="Go to checkout" onPress={checkoutCart} disabled={!hasSelection} />
        </View>
      </SafeAreaView>
    </>
  );
}
