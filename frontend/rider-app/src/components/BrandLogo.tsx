import { Image, type ImageStyle, type StyleProp } from "react-native";
import { useTheme } from "@/context/ThemeContext";

type Props = {
  variant?: "icon" | "wordmark";
  size?: number;
  style?: StyleProp<ImageStyle>;
};

const lockupLight = require("../../assets/branding/okadago-lockup-light.png");
const lockupDark = require("../../assets/branding/okadago-lockup-dark-rider.png");
const iconLight = require("../../assets/branding/okadago-icon-dark.png");
const iconDark = require("../../assets/branding/okadago-icon-yellow.png");

export function BrandLogo({ variant = "icon", size = 40, style }: Props) {
  const { isDark } = useTheme();

  if (variant === "wordmark") {
    const height = size;
    const width = Math.round(size * 1.15);
    return (
      <Image
        source={isDark ? lockupDark : lockupLight}
        style={[{ width, height, resizeMode: "contain" }, style]}
        accessibilityLabel="OkadaGo"
      />
    );
  }

  return (
    <Image
      source={isDark ? iconDark : iconLight}
      style={[{ width: size, height: size, resizeMode: "contain" }, style]}
      accessibilityLabel="OkadaGo"
    />
  );
}
