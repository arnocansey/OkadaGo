import { Stack, router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { useResolvedLocationAddress } from "@/hooks/useResolvedLocationAddress";
import { useNearbyRestaurants } from "@/hooks/useNearbyRestaurants";
import { formatDistanceKm } from "@/lib/geo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SkeletonList } from "@/components/ui/Skeleton";
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
        loadingPad: { padding: spacing.xl, marginTop: spacing.xxl },
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

  const storeSubtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryFee = restaurant?.deliveryFee ?? 10;
  const dueInApp = deliveryFee;
  const notes = typeof orderNotes === "string" ? orderNotes.trim() : "";
  const orderSummary = cart.map((i) => `${i.quantity}x ${i.name}`).join(", ");
  const orderDescription = [orderSummary, notes ? `Notes: ${notes}` : ""].filter(Boolean).join(" · ");

  async function submit() {
    if (!restaurant) return;
    if (notes.length < 4) {
      setError("Add pickup instructions so the courier knows what to collect.");
      return;
    }
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
          packageDescription: `Courier pickup from ${restaurant.name}: ${orderDescription || "Pickup order"} · Courier fee GHS ${deliveryFee.toFixed(2)} (store items paid separately)`,
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
        <View style={styles.loadingPad}>
          <SkeletonList count={4} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Checkout", ...stackHeaderOptions }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
      >
        <SafeAreaView style={styles.screen} edges={["bottom"]}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{restaurant?.name ?? "Pickup"}</Text>
          {restaurant ? (
            <Text style={styles.subtitle}>
              Courier pickup {formatDistanceKm(restaurant.distanceKm)} away · ~{restaurant.etaMin} min · food paid at store
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
              <Text style={styles.notesLabel}>Pickup instructions</Text>
              <Text style={styles.notesText}>{notes}</Text>
            </View>
          ) : (
            <Text style={styles.error}>Pickup instructions are required.</Text>
          )}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Store items</Text>
            <Text style={styles.rowVal}>
              {storeSubtotal > 0 ? `~GHS ${storeSubtotal.toFixed(2)} at store` : "Pay at store"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Courier fee</Text>
            <Text style={styles.rowVal}>GHS {deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>Due in app</Text>
            <Text style={styles.totalVal}>GHS {dueInApp.toFixed(2)}</Text>
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
          <Button label="Request courier" loading={loading} disabled={!restaurant} onPress={submit} fullWidth />
        </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </>
  );
}
