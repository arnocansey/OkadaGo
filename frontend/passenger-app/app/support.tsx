import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AlertTriangle,
  Car,
  CreditCard,
  HelpCircle,
  MapPin,
  Package,
  Send,
  Shield,
  X,
} from "lucide-react-native";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Button } from "@/components/ui/Button";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { api, compactDate, money } from "@/lib/api";

type Trip = {
  id: string;
  status: string;
  pickupAddress: string;
  destinationAddress?: string;
  dropoffAddress?: string;
  createdAt?: string;
  estimatedFare?: number;
  estimatedFee?: number;
  currency?: string;
};

const CATEGORIES = [
  {
    key: "ride_issue",
    label: "Ride Issue",
    icon: Car,
    color: "#3B82F6",
    bg: "#EFF6FF",
  },
  {
    key: "payment_issue",
    label: "Payment Issue",
    icon: CreditCard,
    color: "#F59E0B",
    bg: "#FFFBEB",
  },
  {
    key: "lost_item",
    label: "Lost Item",
    icon: AlertTriangle,
    color: "#EF4444",
    bg: "#FEF2F2",
  },
  {
    key: "safety",
    label: "Safety",
    icon: Shield,
    color: "#DC2626",
    bg: "#FEF2F2",
  },
  {
    key: "delivery_issue",
    label: "Delivery Issue",
    icon: Package,
    color: "#A855F7",
    bg: "#FAF5FF",
  },
  {
    key: "account_problem",
    label: "Account Problem",
    icon: HelpCircle,
    color: "#6B7280",
    bg: "#F9FAFB",
  },
];

export default function SupportScreen() {
  const { session, rides, deliveries } = useApp();
  const { colors, isDark } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [showTripPicker, setShowTripPicker] = useState(false);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const recentTrips = useMemo(() => {
    const all = [
      ...rides.map((r) => ({
        id: r.id,
        status: r.status,
        address: r.pickupAddress,
        dest: r.destinationAddress,
        date: r.createdAt,
        fare: r.finalFare ?? r.estimatedFare,
        currency: r.currency,
        kind: "ride" as const,
      })),
      ...deliveries.map((d) => ({
        id: d.id,
        status: d.status,
        address: d.pickupAddress,
        dest: d.dropoffAddress,
        date: d.createdAt,
        fare: d.finalFee ?? d.estimatedFee,
        currency: d.currency,
        kind: "delivery" as const,
      })),
    ];
    return all
      .sort((a, b) => Date.parse(b.date ?? "0") - Date.parse(a.date ?? "0"))
      .slice(0, 10);
  }, [rides, deliveries]);

  async function submitTicket() {
    if (!session?.token || !selectedCategory) return;
    if (!description.trim()) {
      Alert.alert("Description required", "Please describe your issue.");
      return;
    }
    setSubmitting(true);
    try {
      await api("/support/tickets", {
        method: "POST",
        token: session.token,
        body: {
          category: selectedCategory,
          tripId: selectedTrip,
          description: description.trim(),
        },
      });
      Alert.alert("Submitted", "Our support team will get back to you shortly.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert("Submission failed", e instanceof Error ? e.message : "Could not submit ticket.");
    } finally {
      setSubmitting(false);
    }
  }

  const s = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        scroll: { flex: 1 },
        content: { padding: 20, paddingBottom: 40 },

        /* ─── Category Grid ──────────────────────────── */
        sectionLabel: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 10,
        },
        categoryGrid: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 24,
        },
        categoryCard: {
          width: "47%",
          backgroundColor: isDark ? colors.surface : "#FFFFFF",
          borderRadius: 14,
          padding: 16,
          borderWidth: 1.5,
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          alignItems: "center",
          gap: 8,
        },
        categoryActive: {
          borderColor: colors.primary,
          backgroundColor: isDark ? "rgba(250,204,21,0.06)" : "rgba(250,204,21,0.04)",
        },
        categoryIcon: {
          width: 44,
          height: 44,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
        },
        categoryLabel: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.text,
          textAlign: "center",
        },

        /* ─── Trip Picker ──────────────────────────────── */
        tripPickerBtn: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          backgroundColor: isDark ? colors.surface : "#FFFFFF",
          borderRadius: 14,
          padding: 14,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          marginBottom: 16,
        },
        tripPickerText: {
          flex: 1,
          fontSize: 14,
          color: colors.textSecondary,
        },
        tripPickerSelected: {
          color: colors.text,
          fontWeight: "500",
        },

        /* ─── Trip Modal ──────────────────────────────── */
        modalOverlay: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "flex-end",
        },
        modalCard: {
          backgroundColor: isDark ? colors.surface : "#FFFFFF",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: "60%",
          paddingTop: 12,
          paddingBottom: 32,
        },
        modalHandle: {
          alignSelf: "center",
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: isDark ? colors.borderStrong : "#D1D5DB",
          marginBottom: 12,
        },
        modalHeader: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 20,
          marginBottom: 12,
        },
        modalTitle: {
          fontSize: 16,
          fontWeight: "700",
          color: colors.text,
        },
        tripItem: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 12,
          gap: 12,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
        },
        tripItemText: {
          flex: 1,
        },
        tripItemAddr: {
          fontSize: 14,
          fontWeight: "500",
          color: colors.text,
        },
        tripItemDate: {
          fontSize: 12,
          color: colors.textMuted,
          marginTop: 2,
        },
        tripItemFare: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.primary,
        },

        /* ─── Description ──────────────────────────────── */
        textArea: {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 14,
          padding: 14,
          fontSize: 14,
          color: colors.text,
          backgroundColor: isDark ? colors.surfaceOverlay : "#F8F9FA",
          minHeight: 120,
          textAlignVertical: "top",
          lineHeight: 20,
          marginBottom: 16,
        },

        /* ─── Submit ────────────────────────────────────── */
        submitBtn: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          height: 52,
          borderRadius: 16,
          backgroundColor: colors.primary,
          opacity: !selectedCategory || !description.trim() ? 0.5 : 1,
        },
        submitText: {
          fontSize: 16,
          fontWeight: "700",
          color: colors.background,
        },
      }),
    [colors, isDark],
  );

  const selectedTripData = recentTrips.find((t) => t.id === selectedTrip);

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Support" onBack={() => router.back()} />

        {/* ─── Categories ───────────────────────────────── */}
        <Text style={s.sectionLabel}>What can we help with?</Text>
        <View style={s.categoryGrid}>
          {CATEGORIES.map(({ key, label, icon: Icon, color, bg }) => {
            const isActive = selectedCategory === key;
            return (
              <Pressable
                key={key}
                style={[s.categoryCard, isActive && s.categoryActive]}
                onPress={() => setSelectedCategory(key)}
              >
                <View style={[s.categoryIcon, { backgroundColor: bg }]}>
                  <Icon size={20} color={color} />
                </View>
                <Text style={s.categoryLabel}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        {selectedCategory ? (
          <>
            {/* ─── Trip Picker ──────────────────────────── */}
            <Text style={s.sectionLabel}>Related trip (optional)</Text>
            <Pressable
              style={s.tripPickerBtn}
              onPress={() => setShowTripPicker(true)}
            >
              <MapPin size={16} color={colors.textMuted} />
              <Text
                style={[
                  s.tripPickerText,
                  selectedTripData && s.tripPickerSelected,
                ]}
                numberOfLines={1}
              >
                {selectedTripData
                  ? `${selectedTripData.address} → ${selectedTripData.dest}`
                  : "Select a recent trip"}
              </Text>
            </Pressable>

            {/* ─── Description ──────────────────────────── */}
            <Text style={s.sectionLabel}>Describe your issue</Text>
            <TextInput
              style={s.textArea}
              value={description}
              onChangeText={setDescription}
              placeholder="Tell us what happened..."
              placeholderTextColor={colors.textMuted}
              multiline
            />

            {/* ─── Submit ──────────────────────────────── */}
            <Pressable
              style={s.submitBtn}
              onPress={submitTicket}
              disabled={!selectedCategory || !description.trim() || submitting}
            >
              <Send size={18} color={colors.background} />
              <Text style={s.submitText}>
                {submitting ? "Submitting…" : "Submit ticket"}
              </Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>

      {/* ─── Trip Picker Modal ──────────────────────── */}
      {showTripPicker ? (
        <View style={s.modalOverlay}>
          <Pressable style={{ flex: 1 }} onPress={() => setShowTripPicker(false)} />
          <View style={s.modalCard}>
            <View style={s.modalHandle} />
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Select a trip</Text>
              <Pressable onPress={() => setShowTripPicker(false)}>
                <X size={20} color={colors.textMuted} />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {recentTrips.length === 0 ? (
                <View style={{ padding: 20, alignItems: "center" }}>
                  <Text style={{ color: colors.textSecondary }}>
                    No recent trips
                  </Text>
                </View>
              ) : (
                recentTrips.map((trip) => (
                  <Pressable
                    key={trip.id}
                    style={s.tripItem}
                    onPress={() => {
                      setSelectedTrip(trip.id);
                      setShowTripPicker(false);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={s.tripItemAddr} numberOfLines={1}>
                        {trip.address} → {trip.dest}
                      </Text>
                      <Text style={s.tripItemDate}>
                        {compactDate(trip.date)}
                      </Text>
                    </View>
                    {trip.fare ? (
                      <Text style={s.tripItemFare}>
                        {money(trip.fare, trip.currency ?? "GHS")}
                      </Text>
                    ) : null}
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
