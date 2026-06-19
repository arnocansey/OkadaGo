import { View, StyleSheet } from "react-native";
import { palette } from "./ui";

export function SkeletonCard() {
  return (
    <View style={styles.skeleton}>
      <View style={styles.skeletonLine} />
      <View style={[styles.skeletonLine, { width: "80%", marginTop: 8 }]} />
      <View style={[styles.skeletonLine, { width: "60%", marginTop: 6 }]} />
    </View>
  );
}

export function SkeletonText() {
  return (
    <View style={[styles.skeletonLine, { width: "100%", height: 16, marginTop: 8 }]} />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: palette.panel,
    borderWidth: 1,
    borderColor: palette.stroke,
    gap: 8,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: palette.panelRaised,
  },
});
