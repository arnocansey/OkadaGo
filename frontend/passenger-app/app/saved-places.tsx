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
  Briefcase,
  Church,
  GraduationCap,
  Home,
  MapPin,
  Pencil,
  Plus,
  X,
} from "lucide-react-native";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Button } from "@/components/ui/Button";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";

type SavedPlace = {
  id: string;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
  instruction?: string;
  icon: string;
};

const PLACE_TYPES = [
  { key: "home", label: "Home", icon: Home, color: "#3B82F6", bg: "#EFF6FF" },
  { key: "work", label: "Work", icon: Briefcase, color: "#F59E0B", bg: "#FFFBEB" },
  { key: "school", label: "School", icon: GraduationCap, color: "#22C55E", bg: "#F0FDF4" },
  { key: "church", label: "Church", icon: Church, color: "#A855F7", bg: "#FAF5FF" },
  { key: "custom", label: "Custom", icon: MapPin, color: "#6B7280", bg: "#F9FAFB" },
];

function getIcon(key: string) {
  return PLACE_TYPES.find((p) => p.key === key) ?? PLACE_TYPES[4];
}

export default function SavedPlacesScreen() {
  const { session } = useApp();
  const { colors, isDark } = useTheme();
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SavedPlace | null>(null);
  const [editAddress, setEditAddress] = useState("");
  const [editInstruction, setEditInstruction] = useState("");

  const load = useCallback(async () => {
    if (!session?.token) return;
    try {
      const data = await api<SavedPlace[]>("/saved-places", { token: session.token });
      setPlaces(data);
    } catch {
      // Empty state
    } finally {
      setLoading(false);
    }
  }, [session?.token]);

  useEffect(() => {
    load();
  }, [load]);

  async function savePlace() {
    if (!session?.token || !editing) return;
    if (!editAddress.trim()) {
      Alert.alert("Address required", "Please enter an address.");
      return;
    }
    try {
      await api(`/saved-places/${editing.id}`, {
        method: "PATCH",
        token: session.token,
        body: { address: editAddress.trim(), instruction: editInstruction.trim() || null },
      });
      setEditing(null);
      await load();
    } catch (e) {
      Alert.alert("Save failed", e instanceof Error ? e.message : "Could not save place.");
    }
  }

  const s = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        scroll: { flex: 1 },
        content: { padding: 20, paddingBottom: 40 },

        /* ─── Place Card ──────────────────────────────── */
        placeCard: {
          backgroundColor: isDark ? colors.surface : "#FFFFFF",
          borderRadius: 14,
          padding: 16,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
        },
        placeRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        },
        placeIcon: {
          width: 40,
          height: 40,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
        },
        placeInfo: {
          flex: 1,
        },
        placeLabel: {
          fontSize: 15,
          fontWeight: "600",
          color: colors.text,
        },
        placeAddress: {
          fontSize: 13,
          color: colors.textSecondary,
          marginTop: 2,
        },
        placeInstruction: {
          fontSize: 12,
          color: colors.textMuted,
          marginTop: 2,
          fontStyle: "italic",
        },
        editBtn: {
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          alignItems: "center",
          justifyContent: "center",
        },

        /* ─── Edit Modal ──────────────────────────────── */
        modalOverlay: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          padding: 20,
        },
        modalCard: {
          backgroundColor: isDark ? colors.surface : "#FFFFFF",
          borderRadius: 20,
          padding: 24,
        },
        modalTitle: {
          fontSize: 18,
          fontWeight: "700",
          color: colors.text,
          marginBottom: 16,
        },
        modalInput: {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          padding: 12,
          fontSize: 14,
          color: colors.text,
          backgroundColor: isDark ? colors.surfaceOverlay : "#F8F9FA",
          marginBottom: 12,
        },
        modalActions: {
          flexDirection: "row",
          gap: 10,
          marginTop: 8,
        },
      }),
    [colors, isDark],
  );

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Saved Places" onBack={() => router.back()} />

        {places.length === 0 && !loading ? (
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <MapPin size={40} color={colors.primary} />
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: colors.text,
                marginTop: 12,
              }}
            >
              No saved places yet
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: colors.textSecondary,
                marginTop: 4,
                textAlign: "center",
              }}
            >
              Save your favorite destinations for quick access.
            </Text>
          </View>
        ) : (
          places.map((place) => {
            const type = getIcon(place.icon);
            const Icon = type.icon;
            return (
              <View key={place.id} style={s.placeCard}>
                <View style={s.placeRow}>
                  <View style={[s.placeIcon, { backgroundColor: type.bg }]}>
                    <Icon size={18} color={type.color} />
                  </View>
                  <View style={s.placeInfo}>
                    <Text style={s.placeLabel}>{type.label}</Text>
                    <Text style={s.placeAddress} numberOfLines={1}>
                      {place.address || "No address set"}
                    </Text>
                    {place.instruction ? (
                      <Text style={s.placeInstruction} numberOfLines={1}>
                        {place.instruction}
                      </Text>
                    ) : null}
                  </View>
                  <Pressable
                    style={s.editBtn}
                    onPress={() => {
                      setEditing(place);
                      setEditAddress(place.address);
                      setEditInstruction(place.instruction ?? "");
                    }}
                  >
                    <Pencil size={14} color={colors.textSecondary} />
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ─── Edit Modal ──────────────────────────────── */}
      {editing ? (
        <View style={s.modalOverlay}>
          <Pressable style={{ flex: 1 }} onPress={() => setEditing(null)} />
          <View style={s.modalCard}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text style={s.modalTitle}>
                Edit {getIcon(editing.icon).label}
              </Text>
              <Pressable onPress={() => setEditing(null)}>
                <X size={20} color={colors.textMuted} />
              </Pressable>
            </View>
            <TextInput
              style={s.modalInput}
              value={editAddress}
              onChangeText={setEditAddress}
              placeholder="Address"
              placeholderTextColor={colors.textMuted}
            />
            <TextInput
              style={s.modalInput}
              value={editInstruction}
              onChangeText={setEditInstruction}
              placeholder="Pickup instruction (optional)"
              placeholderTextColor={colors.textMuted}
            />
            <View style={s.modalActions}>
              <Button
                label="Cancel"
                variant="outline"
                onPress={() => setEditing(null)}
                style={{ flex: 1 }}
              />
              <Button label="Save" onPress={savePlace} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
