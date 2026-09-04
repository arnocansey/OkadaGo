import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Award,
  Check,
  Flame,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { brand } from "@/theme/design-system";

export const DAILY_GOAL_STORAGE_KEY = "@okadago/daily_goal_ghs";
export const DEFAULT_DAILY_GOAL = 250;

type Props = {
  visible: boolean;
  onClose: () => void;
  currentGoal: number;
  onSaveGoal: (newGoal: number) => void;
  todayEarnings: number;
  completedTrips: number;
};

const PRESET_GOALS = [
  { amount: 150, label: "Part-Time", desc: "~6 trips" },
  { amount: 250, label: "Full Day", desc: "~10 trips", popular: true },
  { amount: 350, label: "Hustle", desc: "~14 trips" },
  { amount: 500, label: "Power Rider", desc: "~20 trips" },
];

export function DailyGoalModal({
  visible,
  onClose,
  currentGoal,
  onSaveGoal,
  todayEarnings,
  completedTrips,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [selectedGoal, setSelectedGoal] = useState<number>(currentGoal || DEFAULT_DAILY_GOAL);
  const [customInput, setCustomInput] = useState<string>("");
  const [isCustom, setIsCustom] = useState<boolean>(false);

  useEffect(() => {
    setSelectedGoal(currentGoal || DEFAULT_DAILY_GOAL);
    const isPreset = PRESET_GOALS.some((g) => g.amount === currentGoal);
    if (!isPreset && currentGoal > 0) {
      setIsCustom(true);
      setCustomInput(String(currentGoal));
    } else {
      setIsCustom(false);
      setCustomInput("");
    }
  }, [currentGoal, visible]);

  const effectiveGoal = useMemo(() => {
    if (isCustom) {
      const parsed = parseFloat(customInput);
      return isNaN(parsed) || parsed <= 0 ? DEFAULT_DAILY_GOAL : parsed;
    }
    return selectedGoal;
  }, [isCustom, customInput, selectedGoal]);

  const progressPercent = Math.min(100, Math.round((todayEarnings / effectiveGoal) * 100));
  const remaining = Math.max(0, effectiveGoal - todayEarnings);
  const estimatedTrips = Math.max(1, Math.ceil(effectiveGoal / 25));

  const handleSelectPreset = (amount: number) => {
    setSelectedGoal(amount);
    setIsCustom(false);
    setCustomInput("");
  };

  const handleCustomChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    setCustomInput(cleaned);
    setIsCustom(true);
  };

  const handleSave = async () => {
    const goalToSave = Math.max(50, effectiveGoal);
    try {
      await AsyncStorage.setItem(DAILY_GOAL_STORAGE_KEY, String(goalToSave));
    } catch {
      // Non-blocking storage
    }
    onSaveGoal(goalToSave);
    onClose();
  };

  const s = useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.72)",
          justifyContent: "flex-end",
        },
        sheet: {
          backgroundColor: isDark ? "#111827" : "#FFFFFF",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingHorizontal: 20,
          paddingTop: 18,
          paddingBottom: Math.max(insets.bottom + 16, 24),
          borderTopWidth: 1,
          borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)",
          gap: 16,
        },
        handle: {
          width: 42,
          height: 5,
          borderRadius: 3,
          backgroundColor: isDark ? "rgba(255, 255, 255, 0.2)" : "#D1D5DB",
          alignSelf: "center",
          marginBottom: 4,
        },
        header: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        },
        headerLeft: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        },
        headerIcon: {
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: isDark ? "rgba(250, 204, 21, 0.18)" : "rgba(250, 204, 21, 0.25)",
          alignItems: "center",
          justifyContent: "center",
        },
        title: {
          fontSize: 18,
          fontWeight: "800",
          color: colors.text,
        },
        subtitle: {
          fontSize: 12,
          color: colors.textMuted,
          marginTop: 2,
        },
        closeBtn: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#F3F4F6",
          alignItems: "center",
          justifyContent: "center",
        },
        summaryCard: {
          backgroundColor: isDark ? "#1F2937" : "#F9FAFB",
          borderRadius: 18,
          padding: 16,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#E5E7EB",
          gap: 12,
        },
        summaryRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        },
        summaryLabel: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.textMuted,
        },
        summaryValue: {
          fontSize: 16,
          fontWeight: "800",
          color: colors.text,
        },
        progressBarTrack: {
          height: 8,
          borderRadius: 4,
          backgroundColor: isDark ? "rgba(255, 255, 255, 0.12)" : "#E5E7EB",
          overflow: "hidden",
        },
        progressBarFill: {
          height: 8,
          borderRadius: 4,
          backgroundColor: progressPercent >= 100 ? "#10B981" : brand.primary,
        },
        statsRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        },
        statItem: {
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
        },
        statText: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.textMuted,
        },
        presetsGrid: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
        },
        presetCard: {
          flex: 1,
          minWidth: "46%",
          padding: 14,
          borderRadius: 16,
          borderWidth: 1.5,
          borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E5E7EB",
          backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
          gap: 4,
          position: "relative",
        },
        presetCardActive: {
          borderColor: brand.primary,
          backgroundColor: isDark ? "rgba(250, 204, 21, 0.1)" : "rgba(250, 204, 21, 0.08)",
        },
        popularBadge: {
          position: "absolute",
          top: -8,
          right: 10,
          backgroundColor: brand.primary,
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: 8,
        },
        popularBadgeText: {
          fontSize: 9,
          fontWeight: "800",
          color: "#000000",
          textTransform: "uppercase",
        },
        presetAmount: {
          fontSize: 18,
          fontWeight: "800",
          color: colors.text,
        },
        presetLabel: {
          fontSize: 12,
          fontWeight: "700",
          color: colors.textMuted,
        },
        presetDesc: {
          fontSize: 11,
          color: colors.textMuted,
        },
        customWrap: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          backgroundColor: isDark ? "#1F2937" : "#F9FAFB",
          borderRadius: 16,
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderWidth: 1.5,
          borderColor: isCustom ? brand.primary : isDark ? "rgba(255, 255, 255, 0.08)" : "#E5E7EB",
        },
        customPrefix: {
          fontSize: 15,
          fontWeight: "800",
          color: colors.text,
        },
        customInput: {
          flex: 1,
          fontSize: 15,
          fontWeight: "700",
          color: colors.text,
          padding: 0,
        },
        saveBtn: {
          backgroundColor: brand.primary,
          paddingVertical: 15,
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 4,
        },
        saveBtnText: {
          fontSize: 15,
          fontWeight: "800",
          color: "#000000",
        },
      }),
    [colors, isDark, insets, progressPercent, isCustom],
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={s.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={s.sheet}>
          <View style={s.handle} />

          {/* Header */}
          <View style={s.header}>
            <View style={s.headerLeft}>
              <View style={s.headerIcon}>
                <Target size={20} color="#CA8A04" />
              </View>
              <View>
                <Text style={s.title}>Daily Target</Text>
                <Text style={s.subtitle}>Set your daily income goal</Text>
              </View>
            </View>
            <Pressable style={s.closeBtn} onPress={onClose} accessibilityLabel="Close modal">
              <X size={18} color={colors.text} />
            </Pressable>
          </View>

          {/* Today's Pace Card */}
          <View style={s.summaryCard}>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Today's Earnings Pace</Text>
              <Text style={s.summaryValue}>
                GH₵ {todayEarnings.toFixed(2)} / GH₵ {effectiveGoal}
              </Text>
            </View>

            <View style={s.progressBarTrack}>
              <View style={[s.progressBarFill, { width: `${Math.max(5, progressPercent)}%` }]} />
            </View>

            <View style={s.statsRow}>
              <View style={s.statItem}>
                <Flame size={14} color="#EF4444" />
                <Text style={s.statText}>
                  {progressPercent >= 100
                    ? "Goal Achieved! 🎉"
                    : `GH₵ ${remaining.toFixed(2)} to reach goal`}
                </Text>
              </View>
              <View style={s.statItem}>
                <TrendingUp size={14} color={brand.primary} />
                <Text style={s.statText}>{completedTrips} trips today</Text>
              </View>
            </View>
          </View>

          {/* Presets Grid */}
          <View style={s.presetsGrid}>
            {PRESET_GOALS.map((preset) => {
              const active = !isCustom && selectedGoal === preset.amount;
              return (
                <Pressable
                  key={preset.amount}
                  style={[s.presetCard, active && s.presetCardActive]}
                  onPress={() => handleSelectPreset(preset.amount)}
                >
                  {preset.popular && (
                    <View style={s.popularBadge}>
                      <Text style={s.popularBadgeText}>Popular</Text>
                    </View>
                  )}
                  <Text style={s.presetAmount}>GH₵ {preset.amount}</Text>
                  <Text style={s.presetLabel}>{preset.label}</Text>
                  <Text style={s.presetDesc}>{preset.desc}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Custom Input */}
          <View style={s.customWrap}>
            <Sparkles size={16} color={brand.primary} />
            <Text style={s.customPrefix}>Custom Target: GH₵</Text>
            <TextInput
              style={s.customInput}
              keyboardType="numeric"
              placeholder="e.g. 300"
              placeholderTextColor={colors.textMuted}
              value={customInput}
              onChangeText={handleCustomChange}
              maxLength={4}
            />
          </View>

          {/* Save Button */}
          <Pressable style={s.saveBtn} onPress={handleSave}>
            <Text style={s.saveBtnText}>
              Set Daily Goal ({progressPercent}% Achieved)
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
