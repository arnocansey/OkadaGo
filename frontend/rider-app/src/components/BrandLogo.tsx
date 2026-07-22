import { Image, type ImageStyle, type StyleProp } from "react-native";
import { useTheme } from "@/context/ThemeContext";

type Props = {
  variant?: "icon" | "wordmark";
  size?: number;
  style?: StyleProp<ImageStyle>;
};

const iconYellow = require("../../assets/branding/okadago-icon-yellow.png");
const wordmarkDark = require("../../assets/branding/okadago-wordmark-dark.png");
const wordmarkLight = require("../../assets/branding/okadago-wordmark-light.png");

export function BrandLogo({ variant = "icon", size = 40, style }: Props) {
  const { isDark } = useTheme();

  if (variant === "wordmark") {
    const height = size;
    const width = Math.round(size * 4.2);
    return (
      <Image
        source={isDark ? wordmarkLight : wordmarkDark}
        style={[{ width, height, resizeMode: "contain" }, style]}
        accessibilityLabel="OkadaGo"
      />
    );
  }

  return (
    <Image
      source={iconYellow}
      style={[{ width: size, height: size, resizeMode: "contain" }, style]}
      accessibilityLabel="OkadaGo"
    />
  );
}
