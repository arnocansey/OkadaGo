import { Pressable, StyleSheet, View } from "react-native";
import { palette } from "./ui";

export interface FloatingActionButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  label: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}

export function FloatingActionButton({
  icon,
  onPress,
  label,
  position = "bottom-right",
}: FloatingActionButtonProps) {
  const positionStyles = {
    "bottom-right": { bottom: 100, right: 16 },
    "bottom-left": { bottom: 100, left: 16 },
    "top-right": { top: 80, right: 16 },
    "top-left": { top: 80, left: 16 },
  };

  return (
    <Pressable
      style={[styles.fab, positionStyles[position]]}
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.fabContent}>{icon}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.orange,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: palette.orange,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 50,
  },
  fabContent: {
    justifyContent: "center",
    alignItems: "center",
  },
});
