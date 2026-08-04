import { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Check, ChevronDown, Globe } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { LANGUAGE_LABELS, type SupportedLanguage } from "@/i18n";
import { radius, shadows, spacing } from "@/theme/tokens";

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const { colors, typography } = useTheme();
  const { language, setLanguage, supportedLanguages } = useLanguage();
  const [open, setOpen] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        trigger: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
        },
        icon: {
          width: 36,
          height: 36,
          borderRadius: radius.md,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.accentLight,
        },
        copy: { flex: 1, gap: 2 },
        label: { ...typography.caption, color: colors.textMuted },
        value: { ...typography.bodySemibold, color: colors.text },
        backdrop: {
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.45)",
          justifyContent: "flex-end",
        },
        sheet: {
          backgroundColor: colors.surface,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          paddingBottom: spacing.xxl,
          maxHeight: "70%",
          ...shadows.lg,
        },
        sheetHeader: {
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.lg,
          paddingBottom: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        sheetTitle: { ...typography.h3, color: colors.text },
        sheetSub: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
        option: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.xl,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        optionLabel: { ...typography.bodySemibold, color: colors.text, flex: 1 },
        optionActive: { backgroundColor: colors.primaryLight },
      }),
    [colors, typography],
  );

  return (
    <>
      <Pressable
        style={styles.trigger}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t("language.select")}
      >
        <View style={styles.icon}>
          <Globe size={16} color={colors.primary} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.label}>{t("language.select")}</Text>
          <Text style={styles.value}>{LANGUAGE_LABELS[language]}</Text>
        </View>
        <ChevronDown size={18} color={colors.textMuted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{t("language.title")}</Text>
              <Text style={styles.sheetSub}>{t("language.subtitle")}</Text>
            </View>
            {supportedLanguages.map((code) => {
              const active = language === code;
              return (
                <Pressable
                  key={code}
                  style={[styles.option, active && styles.optionActive]}
                  onPress={() => {
                    void setLanguage(code as SupportedLanguage);
                    setOpen(false);
                  }}
                  accessibilityRole="button"
                >
                  <Text style={styles.optionLabel}>{LANGUAGE_LABELS[code as SupportedLanguage]}</Text>
                  {active ? <Check size={18} color={colors.primary} /> : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
