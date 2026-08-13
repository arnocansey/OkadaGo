import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowRight,
  Calendar,
  CalendarDays,
  Edit3,
  Target,
  Trophy,
  X,
  Zap,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { brand, layers } from "@/theme/design-system";

type GoalPeriod = "daily" | "weekly";

type Props = {
  currentEarnings: number;
  goalAmount?: number;
  goalPeriod?: GoalPeriod;
  onSetGoal?: (amount: number, period: GoalPeriod) => void;
  currency?: string;
};

/**
 * EarningsGoal — Rider earnings goal tracker.
 *
 * Visual progress toward daily/weekly target.
 * Editable goal with remaining amount calculated.
 *
 * Layout — Goal Set:
 * ┌─────────────────────────────────┐
 *  🎯 Earnings Goal                 
 *  ─────────────────────────────    
 *  ┌─────────────────────────────┐  
 *  │  ████████████░░░░░░░░░░░░░  │  ← Progress bar
 *  │  GH₵ 458 / GH₵ 600         │  
 *  └─────────────────────────────┘  
 *  GH₵ 142 remaining               
 *  ─────────────────────────────    
 *  [Daily] [Weekly]                ← Period toggle
 *  ─────────────────────────────    
 *  ┌─────────────────────────────┐  
 *  │  🏆 76% there!              │  
 *  │  Keep going!                │  
 *  └─────────────────────────────┘  
 *  ─────────────────────────────    
 *  ✏️ Edit Goal                    
 * └─────────────────────────────────┘
 *
 * Layout — Edit Mode:
 * ┌─────────────────────────────────┐
 *  🎯 Set Earnings Goal             
 *  ─────────────────────────────    
 *  [Daily] [Weekly]                
 *  ─────────────────────────────    
 *  ┌─────────────────────────────┐  
 *  │  GH₵                       │  
 *  │  ┌─────────────────────────┐│  
 *  │  │  600                    ││  ← Amount input
 *  │  └─────────────────────────┘│  
 *  └─────────────────────────────┘  
 *  ─────────────────────────────    
 *  Quick amounts:                  
 *  [GH₵ 300] [GH₵ 500] [GH₵ 800] ← Quick select
 *  ─────────────────────────────    
 *  [Cancel] [Save Goal]           
 * └─────────────────────────────────┘
 *
 * Layout — Goal Reached:
 * ┌─────────────────────────────────┐
 *  🎉 Goal Reached!                 
 *  ─────────────────────────────    
 *  ┌─────────────────────────────┐  
 *  │  ██████████████████████████ │  ← Full bar
 *  │  GH₵ 620 / GH₵ 600         │  
 *  └─────────────────────────────┘  
 *  GH₵ 20 over goal! 🎉            
 *  ─────────────────────────────    
 *  ┌─────────────────────────────┐  
 *  │  🏆 Congratulations!        │  
 *  │  You've hit your target!    │  
 *  └─────────────────────────────┘  
 *  ─────────────────────────────    
 *  [Set New Goal]                  
 * └─────────────────────────────────┘
 */
export function EarningsGoal({
  currentEarnings,
  goalAmount = 600,
  goalPeriod = "daily",
  onSetGoal,
  currency = "GH₵",
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [editing, setEditing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<GoalPeriod>(goalPeriod);
  const [inputAmount, setInputAmount] = useState(goalAmount.toString());

  const safeEarnings = typeof currentEarnings === "number" && Number.isFinite(currentEarnings) ? currentEarnings : 0;
  const safeGoal = typeof goalAmount === "number" && Number.isFinite(goalAmount) && goalAmount > 0 ? goalAmount : 600;
  const progress = Math.min((safeEarnings / safeGoal) * 100, 100);
  const remaining = Math.max(safeGoal - safeEarnings, 0);
  const isReached = safeEarnings >= safeGoal;
  const overAmount = Math.max(safeEarnings - safeGoal, 0);

  const quickAmounts = useMemo(() => {
    if (selectedPeriod === "daily") {
      return [300, 500, 800, 1000];
    }
    return [2000, 3000, 5000, 7000];
  }, [selectedPeriod]);

  function handleSave() {
    const amount = parseInt(inputAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid amount", "Please enter a valid goal amount.");
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSetGoal?.(amount, selectedPeriod);
    setEditing(false);
  }

  function handleQuickSelect(amount: number) {
    setInputAmount(amount.toString());
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  const s = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
          borderRadius: 20,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          padding: 20,
        },

        /* ─── Header ─────────────────────────────────────────── */
        header: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        },
        headerLeft: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        },
        headerIcon: {
          width: 28,
          height: 28,
          borderRadius: 8,
          backgroundColor: isReached ? "#22C55E20" : brand.primary + "20",
          alignItems: "center",
          justifyContent: "center",
        },
        headerTitle: {
          fontSize: 15,
          fontWeight: "700",
          color: isReached ? "#22C55E" : colors.text,
        },
        editBtn: {
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: colors.surfaceOverlay,
          alignItems: "center",
          justifyContent: "center",
        },

        /* ─── Progress Bar ───────────────────────────────────── */
        progressCard: {
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#FFFFFF",
          borderRadius: 12,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          padding: 16,
          marginBottom: 12,
        },
        progressHeader: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        },
        progressCurrent: {
          fontSize: 24,
          fontWeight: "700",
          color: colors.text,
        },
        progressGoal: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.textMuted,
        },
        progressBarBg: {
          height: 12,
          borderRadius: 6,
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
          overflow: "hidden",
          marginBottom: 8,
        },
        progressBarFill: {
          height: "100%",
          borderRadius: 6,
          backgroundColor: isReached ? "#22C55E" : brand.primary,
        },
        progressLabels: {
          flexDirection: "row",
          justifyContent: "space-between",
        },
        progressLabel: {
          fontSize: 12,
          fontWeight: "500",
          color: colors.textMuted,
        },

        /* ─── Remaining ──────────────────────────────────────── */
        remainingRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          marginBottom: 16,
        },
        remainingText: {
          fontSize: 14,
          fontWeight: "600",
          color: isReached ? "#22C55E" : colors.textSecondary,
        },
        remainingAmount: {
          fontSize: 14,
          fontWeight: "700",
          color: isReached ? "#22C55E" : brand.primary,
        },

        /* ─── Period Toggle ──────────────────────────────────── */
        periodToggle: {
          flexDirection: "row",
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
          borderRadius: 10,
          padding: 3,
          marginBottom: 16,
        },
        periodBtn: {
          flex: 1,
          height: 36,
          borderRadius: 8,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        },
        periodBtnActive: {
          backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#FFFFFF",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0.3 : 0.06,
          shadowRadius: 2,
          elevation: 1,
        },
        periodBtnText: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.textMuted,
        },
        periodBtnTextActive: {
          color: colors.text,
        },

        /* ─── Motivation Card ────────────────────────────────── */
        motivationCard: {
          backgroundColor: isReached ? "#22C55E10" : brand.primary + "10",
          borderRadius: 12,
          borderWidth: 1,
          borderColor: isReached ? "#22C55E20" : brand.primary + "20",
          padding: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        },
        motivationIcon: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: isReached ? "#22C55E20" : brand.primary + "20",
          alignItems: "center",
          justifyContent: "center",
        },
        motivationText: {
          flex: 1,
        },
        motivationTitle: {
          fontSize: 14,
          fontWeight: "700",
          color: isReached ? "#22C55E" : brand.primary,
          marginBottom: 2,
        },
        motivationSubtitle: {
          fontSize: 13,
          fontWeight: "500",
          color: colors.textSecondary,
        },

        /* ─── Edit Mode ──────────────────────────────────────── */
        editSection: {
          marginTop: 16,
          paddingTop: 16,
          borderTopWidth: 1,
          borderTopColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
        },
        editTitle: {
          fontSize: 14,
          fontWeight: "700",
          color: colors.text,
          marginBottom: 12,
        },
        inputContainer: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
          borderRadius: 12,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
          paddingHorizontal: 16,
          height: 56,
          marginBottom: 12,
        },
        inputCurrency: {
          fontSize: 18,
          fontWeight: "700",
          color: colors.textMuted,
          marginRight: 8,
        },
        input: {
          flex: 1,
          fontSize: 24,
          fontWeight: "700",
          color: colors.text,
        },

        /* ─── Quick Amounts ──────────────────────────────────── */
        quickLabel: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.textMuted,
          marginBottom: 8,
        },
        quickRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 16,
        },
        quickBtn: {
          paddingHorizontal: 16,
          height: 40,
          borderRadius: 10,
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
          alignItems: "center",
          justifyContent: "center",
        },
        quickBtnActive: {
          backgroundColor: brand.primary + "20",
          borderColor: brand.primary,
        },
        quickBtnText: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.textSecondary,
        },
        quickBtnTextActive: {
          color: brand.primary,
        },

        /* ─── Action Buttons ─────────────────────────────────── */
        actionRow: {
          flexDirection: "row",
          gap: 12,
        },
        cancelBtn: {
          flex: 1,
          height: 48,
          borderRadius: 12,
          backgroundColor: colors.surfaceOverlay,
          alignItems: "center",
          justifyContent: "center",
        },
        cancelText: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.textSecondary,
        },
        saveBtn: {
          flex: 2,
          height: 48,
          borderRadius: 12,
          backgroundColor: brand.primary,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        },
        saveText: {
          fontSize: 14,
          fontWeight: "700",
          color: "#000000",
        },

        /* ─── Set New Goal Button ────────────────────────────── */
        setGoalBtn: {
          height: 48,
          borderRadius: 12,
          backgroundColor: colors.surfaceOverlay,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          marginTop: 16,
        },
        setGoalText: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.textSecondary,
        },
      }),
    [colors, isDark, isReached, brand],
  );

  // Edit mode
  if (editing) {
    return (
      <View style={s.card}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <View style={s.headerIcon}>
              <Target size={14} color={brand.primary} />
            </View>
            <Text style={s.headerTitle}>Set Earnings Goal</Text>
          </View>
          <Pressable
            style={s.editBtn}
            onPress={() => setEditing(false)}
            accessibilityLabel="Cancel editing"
          >
            <X size={16} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Period Toggle */}
        <View style={s.periodToggle}>
          <Pressable
            style={[s.periodBtn, selectedPeriod === "daily" && s.periodBtnActive]}
            onPress={() => {
              setSelectedPeriod("daily");
              setInputAmount("600");
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Calendar size={14} color={selectedPeriod === "daily" ? colors.text : colors.textMuted} />
            <Text
              style={[
                s.periodBtnText,
                selectedPeriod === "daily" && s.periodBtnTextActive,
              ]}
            >
              Daily
            </Text>
          </Pressable>
          <Pressable
            style={[s.periodBtn, selectedPeriod === "weekly" && s.periodBtnActive]}
            onPress={() => {
              setSelectedPeriod("weekly");
              setInputAmount("3000");
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <CalendarDays size={14} color={selectedPeriod === "weekly" ? colors.text : colors.textMuted} />
            <Text
              style={[
                s.periodBtnText,
                selectedPeriod === "weekly" && s.periodBtnTextActive,
              ]}
            >
              Weekly
            </Text>
          </Pressable>
        </View>

        {/* Amount Input */}
        <View style={s.inputContainer}>
          <Text style={s.inputCurrency}>{currency}</Text>
          <TextInput
            style={s.input}
            value={inputAmount}
            onChangeText={setInputAmount}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="Goal amount"
          />
        </View>

        {/* Quick Amounts */}
        <Text style={s.quickLabel}>Quick amounts</Text>
        <View style={s.quickRow}>
          {quickAmounts.map((amount) => (
            <Pressable
              key={amount}
              style={[
                s.quickBtn,
                inputAmount === amount.toString() && s.quickBtnActive,
              ]}
              onPress={() => handleQuickSelect(amount)}
            >
              <Text
                style={[
                  s.quickBtnText,
                  inputAmount === amount.toString() && s.quickBtnTextActive,
                ]}
              >
                {currency} {amount.toLocaleString()}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Actions */}
        <View style={s.actionRow}>
          <Pressable
            style={s.cancelBtn}
            onPress={() => setEditing(false)}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={s.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={s.saveBtn}
            onPress={handleSave}
            accessibilityRole="button"
            accessibilityLabel="Save goal"
          >
            <Target size={16} color="#000000" />
            <Text style={s.saveText}>Save Goal</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // View mode
  return (
    <View style={s.card}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.headerIcon}>
            {isReached ? (
              <Trophy size={14} color="#22C55E" />
            ) : (
              <Target size={14} color={brand.primary} />
            )}
          </View>
          <Text style={s.headerTitle}>
            {isReached ? "Goal Reached!" : "Earnings Goal"}
          </Text>
        </View>
        <Pressable
          style={s.editBtn}
          onPress={() => setEditing(true)}
          accessibilityLabel="Edit goal"
        >
          <Edit3 size={14} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* Progress Card */}
      <View style={s.progressCard}>
        <View style={s.progressHeader}>
          <Text style={s.progressCurrent}>
            {currency} {safeEarnings.toFixed(0)}
          </Text>
          <Text style={s.progressGoal}>
            / {currency} {safeGoal.toLocaleString()}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={s.progressBarBg}>
          <View
            style={[
              s.progressBarFill,
              { width: `${progress}%` },
            ]}
          />
        </View>

        <View style={s.progressLabels}>
          <Text style={s.progressLabel}>{progress.toFixed(0)}% complete</Text>
          <Text style={s.progressLabel}>
            {selectedPeriod === "daily" ? "Today" : "This Week"}
          </Text>
        </View>
      </View>

      {/* Remaining / Over */}
      <View style={s.remainingRow}>
        {isReached ? (
          <>
            <Zap size={14} color="#22C55E" />
            <Text style={s.remainingText}>
              {currency} {overAmount.toFixed(0)} over goal!
            </Text>
          </>
        ) : (
          <>
            <ArrowRight size={14} color={brand.primary} />
            <Text style={s.remainingText}>Remaining:</Text>
            <Text style={s.remainingAmount}>
              {currency} {remaining.toFixed(0)}
            </Text>
          </>
        )}
      </View>

      {/* Period Toggle */}
      <View style={s.periodToggle}>
        <Pressable
          style={[s.periodBtn, selectedPeriod === "daily" && s.periodBtnActive]}
          onPress={() => {
            setSelectedPeriod("daily");
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Calendar size={14} color={selectedPeriod === "daily" ? colors.text : colors.textMuted} />
          <Text
            style={[
              s.periodBtnText,
              selectedPeriod === "daily" && s.periodBtnTextActive,
            ]}
          >
            Daily
          </Text>
        </Pressable>
        <Pressable
          style={[s.periodBtn, selectedPeriod === "weekly" && s.periodBtnActive]}
          onPress={() => {
            setSelectedPeriod("weekly");
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <CalendarDays size={14} color={selectedPeriod === "weekly" ? colors.text : colors.textMuted} />
          <Text
            style={[
              s.periodBtnText,
              selectedPeriod === "weekly" && s.periodBtnTextActive,
            ]}
          >
            Weekly
          </Text>
        </Pressable>
      </View>

      {/* Motivation */}
      <View style={s.motivationCard}>
        <View style={s.motivationIcon}>
          {isReached ? (
            <Trophy size={20} color="#22C55E" />
          ) : progress >= 75 ? (
            <Zap size={20} color={brand.primary} />
          ) : (
            <Target size={20} color={brand.primary} />
          )}
        </View>
        <View style={s.motivationText}>
          <Text style={s.motivationTitle}>
            {isReached
              ? "Congratulations!"
              : progress >= 75
                ? "Almost there!"
                : progress >= 50
                  ? "Great progress!"
                  : "Keep going!"}
          </Text>
          <Text style={s.motivationSubtitle}>
            {isReached
              ? "You've hit your target!"
              : progress >= 75
                ? `Just ${currency} ${remaining.toFixed(0)} more to go!`
                : progress >= 50
                  ? `You're ${progress.toFixed(0)}% of the way there.`
                  : `Earn ${currency} ${remaining.toFixed(0)} more to reach your goal.`}
          </Text>
        </View>
      </View>

      {/* Set New Goal (when reached) */}
      {isReached && (
        <Pressable
          style={s.setGoalBtn}
          onPress={() => setEditing(true)}
          accessibilityRole="button"
          accessibilityLabel="Set new goal"
        >
          <Target size={16} color={colors.textSecondary} />
          <Text style={s.setGoalText}>Set New Goal</Text>
        </Pressable>
      )}
    </View>
  );
}
