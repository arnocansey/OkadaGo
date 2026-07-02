import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import { useTheme } from "@/context/ThemeContext";
import { radius, spacing } from "@/theme/tokens";

export default function RestaurantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography, stackHeaderOptions } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        loader: { marginTop: spacing.xxxl },
        notFound: { ...typography.body, color: colors.textMuted, textAlign: "center", marginTop: spacing.xxxl },
        hero: { padding: spacing.xl, borderRadius: radius.lg, margin: spacing.xl, marginBottom: spacing.md, gap: 6 },
        heroTitle: { ...typography.h2, color: colors.textOnPrimary },
        heroSub: { ...typography.caption, color: "rgba(255,255,255,0.85)" },
        heroAddress: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
        heroAddressText: { ...typography.caption, color: "rgba(255,255,255,0.85)", flex: 1 },
        heroMeta: { ...typography.caption, color: "rgba(255,255,255,0.85)" },
        phoneRow: { flexDirection: "row", alignItems: "center", gap: 4 },
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
        itemBody: { flex: 1, gap: 4 },
        itemName: { ...typography.bodySemibold, color: colors.text },
        itemDesc: { ...typography.caption, color: colors.textSecondary },
        itemPrice: { ...typography.captionMedium, color: colors.text, marginTop: 4 },
        qty: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
        qtyBtn: {
          width: 32,
          height: 32,
          borderRadius: 16,
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
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (!restaurant) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={styles.notFound}>Place not found</Text>
      </SafeAreaView>
    );
  }

  const cartItems = restaurant.menu.filter((m) => (cart[m.id] ?? 0) > 0);
  const hasSelection = cartItems.length > 0 || orderNotes.trim().length > 0;
  const deliveryFee = restaurant.deliveryFee;

  function adjust(itemId: string, delta: number) {
    Haptics.selectionAsync();
    setCart((prev) => {
      const next = Math.max(0, (prev[itemId] ?? 0) + delta);
      return { ...prev, [itemId]: next };
    });
  }

  function checkoutCart() {
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
              menuItemId: "custom-order",
              name: "Custom order",
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
                  >
                    <Phone size={14} color="rgba(255,255,255,0.85)" />
                    <Text style={styles.heroAddressText}>{restaurant.phone}</Text>
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.notesBlock}>
                <Text style={styles.notesLabel}>What should we pick up?</Text>
                <TextInput
                  style={styles.notesInput}
                  value={orderNotes}
                  onChangeText={setOrderNotes}
                  placeholder="e.g. 2x jollof, 1x Coke, bread & eggs…"
                  placeholderTextColor={colors.textMuted}
                  multiline
                />
                <Text style={styles.notesHint}>
                  Prices are paid at the store unless you arrange prepayment by phone.
                </Text>
              </View>

              <Text style={styles.sectionTitle}>Order options</Text>
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

        {hasSelection ? (
          <View style={styles.footer}>
            <Text style={styles.total}>Delivery from GHS {deliveryFee.toFixed(2)}</Text>
            <Button label="Go to checkout" onPress={checkoutCart} />
          </View>
        ) : null}
      </SafeAreaView>
    </>
  );
}
