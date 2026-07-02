import { StyleSheet, Text, View } from "react-native";
import { Check, Circle } from "lucide-react-native";
import { colors, spacing, typography } from "@/theme/tokens";

type Step = { key: string; label: string };

type Props = {
  steps: Step[];
  currentIndex: number;
};

export function TripTimeline({ steps, currentIndex }: Props) {
  return (
    <View style={styles.wrap}>
      {steps.map((step, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        return (
          <View key={step.key} style={styles.row}>
            <View style={styles.rail}>
              <View
                style={[
                  styles.dot,
                  done && styles.dotDone,
                  active && styles.dotActive,
                ]}
              >
                {done ? <Check size={12} color={colors.textOnPrimary} strokeWidth={3} /> : active ? <Circle size={8} color={colors.textOnPrimary} fill={colors.textOnPrimary} /> : null}
              </View>
              {index < steps.length - 1 ? (
                <View style={[styles.line, done && styles.lineDone]} />
              ) : null}
            </View>
            <Text style={[styles.label, active && styles.labelActive, done && styles.labelDone]}>{step.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

export const RIDE_STEPS = [
  { key: "searching", label: "Finding rider" },
  { key: "assigned", label: "Rider assigned" },
  { key: "arriving", label: "Rider arriving" },
  { key: "started", label: "On trip" },
  { key: "completed", label: "Completed" },
];

export const DELIVERY_STEPS = [
  { key: "searching", label: "Finding courier" },
  { key: "assigned", label: "Courier assigned" },
  { key: "picked_up", label: "Picked up" },
  { key: "in_transit", label: "On the way" },
  { key: "delivered", label: "Delivered" },
];

export function stepIndexForStatus(status: string, kind: "ride" | "delivery") {
  const steps = kind === "ride" ? RIDE_STEPS : DELIVERY_STEPS;
  const normalized = status.toLowerCase();
  const map: Record<string, number> = Object.fromEntries(steps.map((s, i) => [s.key, i]));
  if (normalized === "arrived") return map.started ?? 3;
  return map[normalized] ?? 0;
}

const styles = StyleSheet.create({
  wrap: { gap: 0 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, minHeight: 44 },
  rail: { alignItems: "center", width: 24 },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  dotActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  dotDone: { borderColor: colors.primary, backgroundColor: colors.primary },
  line: { width: 2, flex: 1, minHeight: 20, backgroundColor: colors.border },
  lineDone: { backgroundColor: colors.primary },
  label: { ...typography.body, color: colors.textMuted, flex: 1, paddingTop: 1 },
  labelActive: { ...typography.bodySemibold, color: colors.text },
  labelDone: { color: colors.textSecondary },
});
