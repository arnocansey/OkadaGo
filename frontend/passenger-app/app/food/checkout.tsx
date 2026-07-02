import { Stack, router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { useResolvedLocationAddress } from "@/hooks/useResolvedLocationAddress";
import { useNearbyRestaurants } from "@/hooks/useNearbyRestaurants";
import { formatDistanceKm } from "@/lib/geo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { spacing } from "@/theme/tokens";
import type { CartItem } from "@/types";

export default function FoodCheckoutScreen() {
  const { restaurantId, cart: cartJson, orderNotes } = useLocalSearchParams<{
    restaurantId: string;
    cart: string;
    orderNotes?: string;
  }>();
  const { session, zones, refresh } = useApp();
  const { colors, typography, stackHeaderOptions } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        loader: { marginTop: spacing.xxxl },
        content: { padding: spacing.xl, gap: spacing.lg },
        addressInput: { minHeight: 64, paddingTop: spacing.md },
        title: { ...typography.h2, color: colors.text },
        subtitle: { ...typography.caption, color: colors.textMuted, marginTop: -spacing.sm },
        row: { flexDirection: "row", justifyContent: "space-between" },
        rowLabel: { ...typography.body, color: colors.textSecondary },
        rowVal: { ...typography.bodyMedium, color: colors.text },
        totalRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.lg, marginTop: spacing.sm },
        totalLabel: { ...typography.h3, color: colors.text },
        totalVal: { ...typography.h3, color: colors.primary },
        error: { ...typography.caption, color: colors.danger },
        notesBox: { gap: spacing.xs },
        notesLabel: { ...typography.captionMedium, color: colors.textSecondary },
        notesText: { ...typography.body, color: colors.text },
      }),
    [colors, typography],
  );
  const {
    address: dropoff,
    submitAddress: dropoffSubmitAddress,
    setAddress: setDropoff,
    coords: { latitude: dropoffLatitude, longitude: dropoffLongitude },
    hint: dropoffHint,
  } = useResolvedLocationAddress();
  const { getRestaurant, loading: restaurantLoading } = useNearbyRestaurants();
  const restaurant = getRestaurant(restaurantId ?? "");
  const cart: CartItem[] = cartJson ? JSON.parse(cartJson) : [];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryFee = restaurant?.deliveryFee ?? 10;
  const total = subtotal + deliveryFee;
  const notes = typeof orderNotes === "string" ? orderNotes.trim() : "";
  const orderSummary = cart.map((i) => `${i.quantity}x ${i.name}`).join(", ");
  const orderDescription = [orderSummary, notes ? `Notes: ${notes}` : ""].filter(Boolean).join(" · ");

  async function submit() {
    if (!restaurant) return;
    setError("");
    setLoading(true);
    try {
      await api("/deliveries/request", {
        method: "POST",
        token: session!.token,
        body: {
          serviceZoneId: zones[0]?.id,
          pickupAddress: restaurant.address,
          pickupLatitude: restaurant.latitude,
          pickupLongitude: restaurant.longitude,
          dropoffAddress: dropoffSubmitAddress.trim() || dropoff.trim() || "Delivery address",
          dropoffLatitude,
          dropoffLongitude,
          recipientName: session!.user.fullName,
          recipientPhoneE164: session!.user.phoneE164,
          packageType: "food",
          packageDescription: `Food order from ${restaurant.name}: ${orderDescription || "Custom pickup"} · Delivery GHS ${deliveryFee.toFixed(2)}`,
        },
      });
      await refresh();
      router.replace("/(main)/trips");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed.");
    } finally {
      setLoading(false);
    }
  }

  if (restaurantLoading && !restaurant) {
    return (
      <SafeAreaView style={styles.screen}>
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Checkout", ...stackHeaderOptions }} />
      <SafeAreaView style={styles.screen} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{restaurant?.name ?? "Order"}</Text>
          {restaurant ? (
            <Text style={styles.subtitle}>
              Pickup {formatDistanceKm(restaurant.distanceKm)} away · ~{restaurant.etaMin} min
            </Text>
          ) : null}
          {cart.map((item) => (
            <View key={item.menuItemId} style={styles.row}>
              <Text style={styles.rowLabel}>{item.quantity}x {item.name}</Text>
              <Text style={styles.rowVal}>
                {item.price > 0 ? `GHS ${(item.price * item.quantity).toFixed(2)}` : "At store"}
              </Text>
            </View>
          ))}
          {notes ? (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>Order notes</Text>
              <Text style={styles.notesText}>{notes}</Text>
            </View>
          ) : null}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Delivery fee</Text>
            <Text style={styles.rowVal}>GHS {deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalVal}>GHS {total.toFixed(2)}</Text>
          </View>

          <Input
            label="Delivery address"
            value={dropoff}
            onChangeText={setDropoff}
            placeholder="Where should we deliver?"
            hint={dropoffHint ?? undefined}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
            style={styles.addressInput}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button label="Place order" loading={loading} disabled={!restaurant} onPress={submit} fullWidth />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
