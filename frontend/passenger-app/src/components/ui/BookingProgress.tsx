import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { radius, spacing } from "@/theme/tokens";

type Props = {
  currentStep: number;
  totalSteps: number;
  labels: string[];
};

/**
 * BookingProgress — A horizontal step indicator for multi-stage booking.
 *
 * Renders numbered dots connected by progress bars. Completed steps
 * are filled with the primary colour, the active step pulses, and
 * upcoming steps are muted.
 */
export function BookingProgress({ currentStep, totalSteps, labels }: Props) {
  const { colors, typography } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          gap: spacing.xs,
        },
        stepsRow: {
          flexDirection: "row",
          alignItems: "center",
        },
        step: {
          width: 28,
          height: 28,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
        },
        stepCompleted: {
          backgroundColor: colors.primary,
        },
        stepActive: {
          backgroundColor: colors.primary,
          borderWidth: 3,
          borderColor: colors.primaryLight,
        },
        stepUpcoming: {
          backgroundColor: colors.surface,
          borderWidth: 2,
          borderColor: colors.border,
        },
        stepNumber: {
          fontSize: 12,
          fontWeight: "700",
        },
        stepNumberActive: {
          color: colors.textOnPrimary,
        },
        stepNumberUpcoming: {
          color: colors.textMuted,
        },
        connector: {
          flex: 1,
          height: 3,
          borderRadius: 1.5,
          marginHorizontal: 4,
        },
        connectorCompleted: {
          backgroundColor: colors.primary,
        },
        connectorUpcoming: {
          backgroundColor: colors.border,
        },
        labelsRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          paddingHorizontal: 2,
        },
        label: {
          ...typography.caption,
          textAlign: "center",
          width: 60,
        },
        labelActive: {
          color: colors.primary,
          fontWeight: "700",
        },
        labelMuted: {
          color: colors.textMuted,
        },
      }),
    [colors, typography],
  );

  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel={`Step ${currentStep} of ${totalSteps}`}>
      <View style={styles.stepsRow}>
        {Array.from({ length: totalSteps }).map((_, i) => {
          const stepIdx = i + 1;
          const isCompleted = stepIdx < currentStep;
          const isActive = stepIdx === currentStep;

          return (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", flex: i < totalSteps - 1 ? 1 : undefined }}>
              <View
                style={[
                  styles.step,
                  isCompleted && styles.stepCompleted,
                  isActive && styles.stepActive,
                  !isCompleted && !isActive && styles.stepUpcoming,
                ]}
              >
                <Text
                  style={[
                    styles.stepNumber,
                    isCompleted || isActive ? styles.stepNumberActive : styles.stepNumberUpcoming,
                  ]}
                >
                  {isCompleted ? "✓" : stepIdx}
                </Text>
              </View>
              {i < totalSteps - 1 && (
                <View
                  style={[
                    styles.connector,
                    isCompleted ? styles.connectorCompleted : styles.connectorUpcoming,
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>
      <View style={styles.labelsRow}>
        {labels.map((label, i) => (
          <Text
            key={label}
            style={[
              styles.label,
              i + 1 === currentStep ? styles.labelActive : styles.labelMuted,
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}
