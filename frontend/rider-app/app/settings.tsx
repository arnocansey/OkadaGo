import { Stack } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Bell, Globe, Moon, Sun, Volume2 } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";
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

  // Load persisted settings on mount
  useEffect(() => {
    loadSettings().then((settings) => {
      setNotifications(settings.pushNotifications);
      setSound(settings.soundAlerts);
      setLoaded(true);
    });
  }, []);

  const updateNotifications = useCallback(async (value: boolean) => {
    setNotifications(value);
    const current = await loadSettings();
    const next = { ...current, pushNotifications: value };
    await saveSettings(next);
    // Persist to backend
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
    // Persist to backend
    if (session?.token) {
      api("/rider/settings", {
        method: "PATCH",
        token: session.token,
        body: { soundAlerts: value },
      }).catch(() => undefined);
    }
  }, [session?.token]);

  if (!loaded) return null;

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t("settings.title"), ...stackHeaderOptions }} />
      <SafeAreaView style={styles.screen} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Card style={styles.card}>
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
