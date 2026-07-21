import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { Check, Circle, ChevronDown, ChevronUp } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { spacing } from "@/theme/tokens";

type Step = { key: string; label: string };

export type StepDetail = {
  subLabel?: string;
  etaText?: string;
  timestamp?: string;
  expandContent?: React.ReactNode;
};

type Props = {
  steps: Step[];
  currentIndex: number;
  stepDetails?: StepDetail[];
  onStepPress?: (index: number) => void;
};

function AnimatedDot({
  done,
  active,
  colors,
  styles,
}: {
  done: boolean;
  active: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
  styles: Record<string, any>;
}) {
  const scale = useRef(new Animated.Value(0.3)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 60,
      delay: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (active) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseScale, { toValue: 1.5, duration: 900, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            Animated.timing(pulseOpacity, { toValue: 0, duration: 900, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(pulseScale, { toValue: 1, duration: 0, useNativeDriver: true }),
            Animated.timing(pulseOpacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
          ]),
        ]),
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseScale.setValue(1);
      pulseOpacity.setValue(0);
    }
  }, [active]);

  return (
    <View style={{ alignItems: "center", justifyContent: "center", width: 24, height: 24 }}>
      {active ? (
        <Animated.View
          style={{
            position: "absolute",
            width: 22,
            height: 22,
            borderRadius: 11,
            borderWidth: 2,
            borderColor: colors.primary,
            backgroundColor: "transparent",
            transform: [{ scale: pulseScale }],
            opacity: pulseOpacity,
          }}
        />
      ) : null}
      <Animated.View
        style={[
          styles.dot,
          done && styles.dotDone,
          active && styles.dotActive,
          { transform: [{ scale }] },
        ]}
      >
        {done ? (
          <Check size={12} color={colors.textOnPrimary} strokeWidth={3} />
        ) : active ? (
          <Circle size={8} color={colors.textOnPrimary} fill={colors.textOnPrimary} />
        ) : null}
      </Animated.View>
    </View>
  );
}

function AnimatedLine({ done, styles }: { done: boolean; styles: Record<string, any> }) {
  const scaleY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(scaleY, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.line,
        done && styles.lineDone,
        { transform: [{ scaleY }], overflow: "hidden" },
      ]}
    />
  );
}

export function TripTimeline({ steps, currentIndex, stepDetails = [], onStepPress }: Props) {
  const { colors, typography } = useTheme();
  const entryAnims = useRef(steps.map(() => new Animated.Value(0))).current;
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
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
        subRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 },
        subLabel: { ...typography.caption, color: colors.textMuted, flex: 1 },
        etaBadge: {
          ...typography.caption,
          color: colors.primary,
          backgroundColor: colors.primaryLight,
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: 10,
          overflow: "hidden",
          marginLeft: spacing.sm,
        },
        timestamp: { ...typography.tiny, color: colors.textMuted, marginTop: 2 },
        expandBtn: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          marginTop: 4,
        },
        expandText: { ...typography.caption, color: colors.primary },
        expandContent: {
          marginTop: spacing.sm,
          padding: spacing.md,
          backgroundColor: colors.surface,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: colors.border,
        },
      }),
    [colors, typography],
  );

  useEffect(() => {
    const animations = entryAnims.map((anim, i) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: i * 100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    );
    Animated.stagger(0, animations).start();
  }, [steps.length]);

  function handleToggleExpand(index: number) {
    setExpandedIndex(expandedIndex === index ? null : index);
    onStepPress?.(index);
  }

  return (
    <View style={styles.wrap}>
      {steps.map((step, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        const isLast = index === steps.length - 1;
        const detail = stepDetails[index];
        const isExpanded = expandedIndex === index;
        const hasExpandable = Boolean(detail?.expandContent);
        const entryAnim = entryAnims[index];

        return (
          <Animated.View
            key={step.key}
            style={[
              styles.row,
              {
                opacity: entryAnim,
                transform: [
                  {
                    translateX: entryAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.rail}>
              <AnimatedDot
                done={done}
                active={active}
                colors={colors}
                styles={styles}
              />
              {!isLast ? (
                <AnimatedLine done={done} styles={styles} />
              ) : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, active && styles.labelActive, done && styles.labelDone]}>
                {step.label}
              </Text>

              {(detail?.subLabel || detail?.etaText) && (done || active) ? (
                <View style={styles.subRow}>
                  {detail?.subLabel ? (
                    <Text style={styles.subLabel}>{detail.subLabel}</Text>
                  ) : null}
                  {detail?.etaText && active ? (
                    <Text style={styles.etaBadge}>{detail.etaText}</Text>
                  ) : null}
                </View>
              ) : null}

              {detail?.timestamp && done ? (
                <Text style={styles.timestamp}>{detail.timestamp}</Text>
              ) : null}

              {hasExpandable && (done || active) ? (
                <Pressable style={styles.expandBtn} onPress={() => handleToggleExpand(index)}>
                  <Text style={styles.expandText}>
                    {isExpanded ? "Hide details" : "Show details"}
                  </Text>
                  {isExpanded ? (
                    <ChevronUp size={14} color={colors.primary} />
                  ) : (
                    <ChevronDown size={14} color={colors.primary} />
                  )}
                </Pressable>
              ) : null}

              {isExpanded && detail?.expandContent ? (
                <View style={styles.expandContent}>
                  {detail.expandContent}
                </View>
              ) : null}
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

export const RIDE_STEPS = [
  { key: "scheduled", label: "Scheduled" },
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
