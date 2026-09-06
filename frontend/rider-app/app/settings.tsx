import { Stack } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Bell, Globe, Moon, Sun, Volume2, Vibrate, Play } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";
import { requestAlarm } from "@/lib/alarm";
import {
  loadRequestSettings,
  saveRequestSettings,
  type VolumeLevel,
  type RiderRequestSettings,
} from "@/lib/request-settings";
import { radius, spacing } from "@/theme/tokens";

const SETTINGS_KEY = "@okadago_rider_settings";

type RiderSettings = {
  pushNotifications: boolean;
  soundAlerts: boolean;
};

async function loadSettings(): Promise<RiderSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { pushNotifications: true, soundAlerts: true };
}

async function saveSettings(settings: RiderSettings) {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function SettingRow({
  icon,
  label,
  hint,
  value,
  onChange,
  styles,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  value: boolean;
  onChange: (v: boolean) => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>{icon}</View>
      <View style={styles.rowBody}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.hint}>{hint}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: styles.switchTrackTrue.backgroundColor, false: styles.switchTrackFalse.backgroundColor }}
        thumbColor={value ? styles.switchThumbOn.backgroundColor : styles.switchThumbOff.backgroundColor}
      />
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>["colors"], typography: ReturnType<typeof useTheme>["typography"]) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxxl },
    card: { padding: 0, overflow: "hidden" },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.sm,
    },
    sectionTitle: { ...typography.captionMedium, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      gap: spacing.md,
    },
    rowIcon: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    rowBody: { flex: 1 },
    divider: { height: 1, backgroundColor: colors.border, marginLeft: spacing.lg + 36 + spacing.md },
    label: { ...typography.bodySemibold, color: colors.text },
    hint: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
    version: { ...typography.caption, color: colors.textMuted, textAlign: "center" },
    switchTrackTrue: { backgroundColor: colors.primary },
    switchTrackFalse: { backgroundColor: colors.border },
    switchThumbOn: { backgroundColor: colors.primary },
    switchThumbOff: { backgroundColor: colors.surface },
    languageHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.sm,
    },
    languageCard: { padding: 0, overflow: "hidden" },
    volumeRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      gap: spacing.md,
    },
    volumeOptions: {
      flexDirection: "row",
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
    },
    volumeChip: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1.5,
      alignItems: "center",
      justifyContent: "center",
    },
    volumeChipText: {
      fontSize: 13,
      fontWeight: "700",
    },
    testBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderStyle: "dashed",
    },
    testBtnText: {
      fontSize: 14,
      fontWeight: "600",
    },
  });
}

export default function SettingsScreen() {
  const { session } = useApp();
  const [notifications, setNotifications] = useState(true);
  const [sound, setSound] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const { colors, typography, isDark, setTheme, stackHeaderOptions } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);

  // Ride request notification settings
  const [requestSettings, setRequestSettings] = useState<RiderRequestSettings>({
    soundEnabled: true,
    vibrationEnabled: true,
    volume: "high",
  });
  const [testingSound, setTestingSound] = useState(false);

  // Load persisted settings on mount
  useEffect(() => {
    Promise.all([
      loadSettings(),
      loadRequestSettings(),
    ]).then(([generalSettings, reqSettings]) => {
      setNotifications(generalSettings.pushNotifications);
      setSound(generalSettings.soundAlerts);
      setRequestSettings(reqSettings);
      setLoaded(true);
    });
  }, []);

  const updateNotifications = useCallback(async (value: boolean) => {
    setNotifications(value);
    const current = await loadSettings();
    const next = { ...current, pushNotifications: value };
    await saveSettings(next);
    if (session?.token) {
      api("/rider/settings", {
        method: "PATCH",
        token: session.token,
        body: { pushNotifications: value },
      }).catch(() => undefined);
    }
  }, [session?.token]);

  const updateSound = useCallback(async (value: boolean) => {
    setSound(value);
    const current = await loadSettings();
    const next = { ...current, soundAlerts: value };
    await saveSettings(next);
    if (session?.token) {
      api("/rider/settings", {
        method: "PATCH",
        token: session.token,
        body: { soundAlerts: value },
      }).catch(() => undefined);
    }
  }, [session?.token]);

  const updateRequestSetting = useCallback(async (patch: Partial<RiderRequestSettings>) => {
    const next = await saveRequestSettings(patch);
    setRequestSettings(next);
  }, []);

  const handleTestSound = useCallback(async () => {
    if (testingSound) return;
    setTestingSound(true);
    await requestAlarm.testSound(requestSettings.volume);
    setTimeout(() => setTestingSound(false), 3500);
  }, [testingSound, requestSettings.volume]);

  if (!loaded) return null;

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t("settings.title"), ...stackHeaderOptions }} />
      <SafeAreaView style={styles.screen} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* ─── General Settings ────────────────────────────── */}
          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <Bell size={14} color={colors.textMuted} />
              <Text style={styles.sectionTitle}>General</Text>
            </View>
            <SettingRow
              icon={<Bell size={18} color={colors.text} />}
              label={t("settings.pushNotifications")}
              hint={t("settings.pushNotificationsHint")}
              value={notifications}
              onChange={updateNotifications}
              styles={styles}
            />
            <View style={styles.divider} />
            <SettingRow
              icon={<Volume2 size={18} color={colors.text} />}
              label={t("settings.soundAlerts")}
              hint={t("settings.soundAlertsHint")}
              value={sound}
              onChange={updateSound}
              styles={styles}
            />
            <View style={styles.divider} />
            <SettingRow
              icon={isDark ? <Moon size={18} color={colors.text} /> : <Sun size={18} color={colors.primary} />}
              label={isDark ? t("settings.darkMode") : t("settings.lightMode")}
              hint={t("settings.toggleAppearance")}
              value={isDark}
              onChange={(enabled) => setTheme(enabled ? "dark" : "light")}
              styles={styles}
            />
          </Card>

          {/* ─── Ride Request Notifications ─────────────────── */}
          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <Bell size={14} color="#FF6A00" />
              <Text style={[styles.sectionTitle, { color: "#FF6A00" }]}>Ride Requests</Text>
            </View>

            <SettingRow
              icon={<Volume2 size={18} color={colors.text} />}
              label="Ride Request Sound"
              hint="Play a distinctive sound for new ride requests"
              value={requestSettings.soundEnabled}
              onChange={(v) => updateRequestSetting({ soundEnabled: v })}
              styles={styles}
            />

            <View style={styles.divider} />

            <SettingRow
              icon={<Vibrate size={18} color={colors.text} />}
              label="Vibration"
              hint="Vibrate device when a new ride request arrives"
              value={requestSettings.vibrationEnabled}
              onChange={(v) => updateRequestSetting({ vibrationEnabled: v })}
              styles={styles}
            />

            <View style={styles.divider} />

            {/* Volume selector */}
            <View style={styles.volumeRow}>
              <View style={styles.rowIcon}>
                <Volume2 size={18} color={colors.text} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.label}>Sound Volume</Text>
                <Text style={styles.hint}>Adjust the incoming request sound level</Text>
              </View>
            </View>

            <View style={styles.volumeOptions}>
              {(["low", "medium", "high"] as VolumeLevel[]).map((level) => {
                const active = requestSettings.volume === level;
                return (
                  <View
                    key={level}
                    style={[
                      styles.volumeChip,
                      {
                        backgroundColor: active ? colors.primary + "15" : colors.surface,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.volumeChipText,
                        { color: active ? colors.primary : colors.textMuted },
                      ]}
                      onPress={() => updateRequestSetting({ volume: level })}
                    >
                      {level === "low" ? "Low" : level === "medium" ? "Medium" : "High"}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Test Sound */}
            <View
              style={[
                styles.testBtn,
                { borderColor: testingSound ? colors.primary : colors.border },
              ]}
            >
              <Play size={16} color={testingSound ? colors.primary : colors.textMuted} />
              <Text
                style={[
                  styles.testBtnText,
                  { color: testingSound ? colors.primary : colors.textMuted },
                ]}
                onPress={handleTestSound}
              >
                {testingSound ? "Playing..." : "Test Sound"}
              </Text>
            </View>
          </Card>

          <Card style={styles.languageCard}>
            <View style={styles.languageHeader}>
              <Globe size={16} color={colors.primary} />
              <Text style={styles.label}>{t("language.title")}</Text>
            </View>
            <LanguageSwitcher />
          </Card>

          <Text style={styles.version}>OkadaGo Rider v1.0.0</Text>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
