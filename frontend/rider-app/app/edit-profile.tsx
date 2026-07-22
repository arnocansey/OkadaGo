import { Stack, router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";
import { radius, spacing } from "@/theme/tokens";
import type { SessionUser } from "@/types";

type VehicleTypeOption = "okada" | "tricycle" | "bicycle";

const VEHICLE_TYPE_OPTIONS: Array<{ id: VehicleTypeOption; label: string }> = [
  { id: "okada", label: "Okada" },
  { id: "tricycle", label: "Tricycle" },
  { id: "bicycle", label: "Bicycle" },
];

type RiderVehicle = {
  make: string;
  model: string;
  plateNumber: string;
  color: string | null;
  year: number | null;
  insuranceNumber: string | null;
  vehicleType: VehicleTypeOption;
};

type RiderSettings = {
  fullName: string;
  email: string | null;
  phoneE164: string;
  preferredCurrency: string;
  city: string | null;
  displayCode: string | null;
  approvalStatus: string | null;
  vehicle: RiderVehicle | null;
};

type SettingsUpdateResponse = {
  user: SessionUser;
};

export default function EditProfileScreen() {
  const { session, refreshSession } = useApp();
  const { colors, typography, stackHeaderOptions } = useTheme();
  const user = session!.user;
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email ?? "");
  const [city, setCity] = useState("");
  const [phoneE164, setPhoneE164] = useState(user.phoneE164);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [hasVehicle, setHasVehicle] = useState(false);
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [vehicleInsurance, setVehicleInsurance] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleTypeOption>("okada");
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [vehicleError, setVehicleError] = useState("");

  useEffect(() => {
    if (!session?.token) return;
    api<RiderSettings>("/auth/rider/settings", { token: session.token })
      .then((data) => {
        setFullName(data.fullName);
        setEmail(data.email ?? "");
        setCity(data.city ?? "");
        setPhoneE164(data.phoneE164);
        if (data.vehicle) {
          setHasVehicle(true);
          setVehicleMake(data.vehicle.make);
          setVehicleModel(data.vehicle.model);
          setVehiclePlate(data.vehicle.plateNumber);
          setVehicleColor(data.vehicle.color ?? "");
          setVehicleInsurance(data.vehicle.insuranceNumber ?? "");
          setVehicleType(data.vehicle.vehicleType);
        }
      })
      .catch(() => undefined);
  }, [session?.token]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxxl },
        sectionHint: { ...typography.caption, color: colors.textMuted },
        readOnlyField: {
          ...typography.body,
          color: colors.textSecondary,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.md,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        },
        error: { ...typography.caption, color: colors.danger },
        fieldLabel: { ...typography.captionMedium, color: colors.textSecondary },
        chipRow: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
      }),
    [colors, typography],
  );

  async function saveProfile() {
    if (!session?.token || !fullName.trim()) return;
    setSaving(true);
    setError("");
    try {
      await api<SettingsUpdateResponse>("/auth/rider/settings", {
        method: "PATCH",
        token: session.token,
        body: {
          fullName: fullName.trim(),
          email: email.trim() || null,
          city: city.trim() || null,
        },
      });
      await refreshSession();
      Alert.alert("Profile updated", "Your rider profile was saved.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  async function saveVehicle() {
    if (!session?.token || !vehicleMake.trim() || !vehicleModel.trim() || !vehiclePlate.trim()) return;
    setSavingVehicle(true);
    setVehicleError("");
    try {
      await api<{ vehicle: unknown }>("/auth/rider/vehicle", {
        method: "PATCH",
        token: session.token,
        body: {
          make: vehicleMake.trim(),
          model: vehicleModel.trim(),
          plateNumber: vehiclePlate.trim().toUpperCase(),
          color: vehicleColor.trim() || null,
          insuranceNumber: vehicleInsurance.trim() || null,
          vehicleType,
        },
      });
      Alert.alert("Vehicle updated", "Your vehicle details were saved.");
    } catch (e) {
      setVehicleError(e instanceof Error ? e.message : "Could not save vehicle.");
    } finally {
      setSavingVehicle(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Edit Profile", ...stackHeaderOptions }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
      >
        <SafeAreaView style={styles.screen} edges={["bottom"]}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Card stacked>
            <Input label="Full name" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="name@example.com"
            />
            <View style={{ gap: spacing.sm }}>
              <Text style={styles.sectionHint}>Phone (verified via OTP)</Text>
              <Text style={styles.readOnlyField}>{phoneE164}</Text>
            </View>
            <Input label="Service city" value={city} onChangeText={setCity} placeholder="Accra" />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button label="Save profile" loading={saving} onPress={() => void saveProfile()} fullWidth />
          </Card>

          {hasVehicle ? (
            <Card stacked>
              <Text style={styles.sectionHint}>Vehicle details</Text>
              <View style={{ gap: spacing.sm }}>
                <Text style={styles.fieldLabel}>Vehicle type</Text>
                <View style={styles.chipRow}>
                  {VEHICLE_TYPE_OPTIONS.map((option) => (
                    <Chip
                      key={option.id}
                      label={option.label}
                      selected={vehicleType === option.id}
                      onPress={() => setVehicleType(option.id)}
                    />
                  ))}
                </View>
              </View>
              <Input label="Make" value={vehicleMake} onChangeText={setVehicleMake} placeholder="Honda" />
              <Input label="Model" value={vehicleModel} onChangeText={setVehicleModel} placeholder="Ace 125" />
              <Input label="Plate number" value={vehiclePlate} onChangeText={setVehiclePlate} autoCapitalize="characters" placeholder="GR-1234-24" />
              <Input label="Color (optional)" value={vehicleColor} onChangeText={setVehicleColor} placeholder="Black" />
              <Input
                label="Insurance number (optional)"
                value={vehicleInsurance}
                onChangeText={setVehicleInsurance}
                placeholder="INS-2026-000123"
                autoCapitalize="characters"
              />
              {vehicleError ? <Text style={styles.error}>{vehicleError}</Text> : null}
              <Button label="Save vehicle" loading={savingVehicle} onPress={() => void saveVehicle()} fullWidth />
            </Card>
          ) : null}
        </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </>
  );
}
