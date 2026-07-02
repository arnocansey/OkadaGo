import { Stack, router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Home, Pencil, Trash2, Briefcase } from "lucide-react-native";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { useUserLocation } from "@/hooks/useUserLocation";
import { api } from "@/lib/api";
import { spacing } from "@/theme/tokens";
import type { LocationResult, SavedPlace } from "@/types";

const LABEL_PRESETS = [
  { id: "Home", icon: Home },
  { id: "Work", icon: Briefcase },
] as const;

export default function SavedPlacesScreen() {
  const { session } = useApp();
  const { colors, typography, stackHeaderOptions } = useTheme();
  const { latitude, longitude } = useUserLocation();
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState("Home");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxxl },
        row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
        body: { flex: 1 },
        title: { ...typography.bodySemibold, color: colors.text },
        meta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
        presetRow: { flexDirection: "row", gap: spacing.sm },
        preset: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.xs,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
        },
        presetActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
      }),
    [colors, typography],
  );

  const load = useCallback(async () => {
    if (!session?.token) return;
    setLoading(true);
    try {
      setPlaces(await api<SavedPlace[]>("/places/saved", { token: session.token }));
    } catch {
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }, [session?.token]);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setEditingId(null);
    setLabel("Home");
    setAddress("");
    setNotes("");
  }

  function startEdit(place: SavedPlace) {
    setEditingId(place.id);
    setLabel(place.label);
    setAddress(place.address);
    setNotes(place.notes ?? "");
  }

  async function resolveCoords() {
    if (!session?.token || !address.trim()) {
      return { latitude, longitude };
    }
    try {
      const result = await api<LocationResult>(
        `/bootstrap/forward-geocode?q=${encodeURIComponent(address.trim())}`,
        { token: session.token },
      );
      return { latitude: result.latitude, longitude: result.longitude };
    } catch {
      return { latitude, longitude };
    }
  }

  async function savePlace() {
    if (!session?.token || !label.trim() || !address.trim()) return;
    setSaving(true);
    try {
      const coords = await resolveCoords();
      const body = {
        label: label.trim(),
        address: address.trim(),
        latitude: coords.latitude,
        longitude: coords.longitude,
        notes: notes.trim() || undefined,
      };
      if (editingId) {
        await api(`/places/saved/${editingId}`, { method: "PATCH", token: session.token, body });
      } else {
        await api("/places/saved", { method: "POST", token: session.token, body });
      }
      resetForm();
      await load();
    } catch (e) {
      Alert.alert("Save failed", e instanceof Error ? e.message : "Could not save place.");
    } finally {
      setSaving(false);
    }
  }

  async function removePlace(placeId: string) {
    if (!session?.token) return;
    Alert.alert("Delete place", "Remove this saved place?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void api(`/places/saved/${placeId}`, { method: "DELETE", token: session.token })
            .then(load)
            .catch((e) => Alert.alert("Delete failed", e instanceof Error ? e.message : "Could not delete place."));
        },
      },
    ]);
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Saved places", ...stackHeaderOptions }} />
      <SafeAreaView style={styles.screen} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.content}>
          <Card stacked>
            <Text style={styles.title}>{editingId ? "Edit place" : "Add place"}</Text>
            <View style={[styles.presetRow, { marginBottom: spacing.sm }]}>
              {LABEL_PRESETS.map(({ id, icon: Icon }) => (
                <Pressable
                  key={id}
                  style={[styles.preset, label === id && styles.presetActive]}
                  onPress={() => setLabel(id)}
                >
                  <Icon size={14} color={label === id ? colors.primary : colors.textMuted} />
                  <Text style={styles.meta}>{id}</Text>
                </Pressable>
              ))}
            </View>
            <Input label="Label" value={label} onChangeText={setLabel} placeholder="Home" />
            <Input label="Address" value={address} onChangeText={setAddress} placeholder="Ring Road, Accra" multiline />
            <Input label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional" />
            <Button label={editingId ? "Update place" : "Save place"} loading={saving} onPress={() => void savePlace()} fullWidth />
            {editingId ? <Button label="Cancel edit" variant="ghost" onPress={resetForm} fullWidth /> : null}
          </Card>

          {loading ? (
            <Text style={styles.meta}>Loading places…</Text>
          ) : places.length === 0 ? (
            <Text style={styles.meta}>No saved places yet.</Text>
          ) : (
            places.map((place) => (
              <Card key={place.id} stacked>
                <View style={styles.row}>
                  <View style={styles.body}>
                    <Text style={styles.title}>{place.label}</Text>
                    <Text style={styles.meta}>{place.address}</Text>
                  </View>
                  <Pressable onPress={() => startEdit(place)}>
                    <Pencil size={18} color={colors.primary} />
                  </Pressable>
                  <Pressable onPress={() => void removePlace(place.id)}>
                    <Trash2 size={18} color={colors.danger} />
                  </Pressable>
                </View>
              </Card>
            ))
          )}

          <Button label="Back to profile" variant="outline" onPress={() => router.back()} fullWidth />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
