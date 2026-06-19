import { View, Text, StyleSheet } from "react-native";
import { palette } from "./ui";

export interface TimelineStep {
  status: string;
  icon?: string;
  timestamp?: string;
  isCompleted: boolean;
  isActive: boolean;
}

export function TripTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <View style={styles.timeline}>
      {steps.map((step, index) => (
        <View key={index} style={styles.timelineItem}>
          <View style={styles.timelineTrack}>
            <View
              style={[
                styles.timelineDot,
                step.isCompleted && styles.timelineDotCompleted,
                step.isActive && styles.timelineDotActive,
              ]}
            />
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.timelineLine,
                  step.isCompleted && styles.timelineLineCompleted,
                ]}
              />
            )}
          </View>
          <View style={styles.timelineContent}>
            <Text
              style={[
                styles.timelineStatus,
                step.isCompleted && styles.timelineStatusCompleted,
              ]}
            >
              {step.status}
            </Text>
            {step.timestamp && (
              <Text style={styles.timelineTime}>{step.timestamp}</Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  timeline: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 12,
  },
  timelineTrack: {
    alignItems: "center",
    width: 24,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: palette.panelRaised,
    borderWidth: 2,
    borderColor: palette.muted,
    zIndex: 1,
  },
  timelineDotActive: {
    backgroundColor: palette.yellow,
    borderColor: palette.yellow,
  },
  timelineDotCompleted: {
    backgroundColor: palette.green,
    borderColor: palette.green,
  },
  timelineLine: {
    position: "absolute",
    top: 12,
    left: 5,
    width: 2,
    height: 44,
    backgroundColor: palette.panelRaised,
  },
  timelineLineCompleted: {
    backgroundColor: palette.green,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 2,
    gap: 3,
  },
  timelineStatus: {
    color: palette.muted,
    fontSize: 14,
    fontWeight: "700",
  },
  timelineStatusCompleted: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
  timelineTime: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: "700",
  },
});
