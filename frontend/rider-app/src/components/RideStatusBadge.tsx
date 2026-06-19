import { View, Text, StyleSheet } from "react-native";
import { palette } from "./ui";

type RideStatus = "completed" | "in_progress" | "pending" | "cancelled";

export function RideStatusBadge({ status }: { status: RideStatus }) {
  const statusConfig: Record<RideStatus, { bg: string; text: string; label: string }> = {
    completed: { bg: "#1A3A1A", text: palette.green, label: "Completed" },
    in_progress: { bg: "#1A2A4A", text: "#3B82F6", label: "In Progress" },
    pending: { bg: "#3A2A1A", text: palette.yellow, label: "Pending" },
    cancelled: { bg: "#3D1712", text: palette.red, label: "Cancelled" },
  };

  const config = statusConfig[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <View style={[styles.dot, { backgroundColor: config.text }]} />
      <Text style={[styles.text, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "capitalize",
  },
});
