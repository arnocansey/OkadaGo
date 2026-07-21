import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Check, Globe } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { radius, spacing } from "@/theme/tokens";
import type { SupportedLanguage } from "@/i18n";

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const { colors, typography } = useTheme();
  const { language, setLanguage, supportedLanguages } = useLanguage();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        noBorder: { borderBottomWidth: 0 },
        icon: {
          width: 36,
          height: 36,
          borderRadius: radius.md,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.accentLight,
        },
        label: { ...typography.bodySemibold, color: colors.text, flex: 1 },
      }),
    [colors, typography],
  );

  return (
    <View>
      {supportedLanguages.map((code, index) => (
        <Pressable
          key={code}
          style={[styles.row, index === supportedLanguages.length - 1 && styles.noBorder]}
          onPress={() => void setLanguage(code as SupportedLanguage)}
          accessibilityRole="button"
        >
          <View style={styles.icon}>
            <Globe size={16} color={colors.primary} />
          </View>
          <Text style={styles.label}>{t(`language.${code}`)}</Text>
          {language === code ? <Check size={18} color={colors.primary} /> : null}
        </Pressable>
      ))}
    </View>
  );
}
