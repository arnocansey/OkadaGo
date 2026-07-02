import { useMemo } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/context/ThemeContext";

type Props = {
  name: string;
  size?: number;
  imageUri?: string;
};

export function Avatar({ name, size = 48, imageUri }: Props) {
  const { colors, typography } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          backgroundColor: colors.primaryLight,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        },
        initials: { ...typography.bodySemibold, color: colors.primary },
      }),
    [colors, typography],
  );

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
