import { Stack } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bell, Globe, Moon, Sun, Volume2 } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTheme } from "@/context/ThemeContext";
import { radius, spacing } from "@/theme/tokens";

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
  const [notifications, setNotifications] = useState(true);
  const [sound, setSound] = useState(true);
  const { colors, typography, isDark, setTheme, stackHeaderOptions } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);

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
              onChange={setNotifications}
              styles={styles}
            />
            <View style={styles.divider} />
            <SettingRow
              icon={<Volume2 size={18} color={colors.text} />}
              label={t("settings.soundAlerts")}
              hint={t("settings.soundAlertsHint")}
              value={sound}
              onChange={setSound}
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
