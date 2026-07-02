import { Image, StyleSheet, Text, View } from "react-native";
import { colors, typography } from "@/theme/tokens";

type Props = {
  name: string;
  size?: number;
  imageUri?: string;
};

export function Avatar({ name, size = 48, imageUri }: Props) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }]}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initials}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.accentLight,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  initials: { ...typography.bodySemibold, color: colors.primary },
});
