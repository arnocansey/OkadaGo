export type ThemeColors = {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  accent: string;
  accentDark: string;
  accentLight: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textOnPrimary: string;
  danger: string;
  dangerLight: string;
  warning: string;
  warningLight: string;
  info: string;
  infoLight: string;
  success: string;
  successLight: string;
  overlay: string;
  mapTint: string;
  mapRoute: string;
  mapMarkerPickup: string;
  mapMarkerDestination: string;
  mapMarkerRider: string;
};

export const darkColors: ThemeColors = {
  primary: "#FFC107",
  primaryDark: "#FFB800",
  primaryLight: "#3D3200",
  accent: "#FFC107",
  accentDark: "#FFB800",
  accentLight: "#2A2400",
  background: "#000000",
  surface: "#1C1C1E",
  surfaceElevated: "#1C1C1E",
  border: "#2C2C2E",
  borderStrong: "#3A3A3C",
  text: "#FFFFFF",
  textSecondary: "#8E8E93",
  textMuted: "#8E8E93",
  textOnPrimary: "#000000",
  danger: "#FF3B30",
  dangerLight: "#3D1512",
  warning: "#FFC107",
  warningLight: "#3D3200",
  info: "#0A84FF",
  infoLight: "#0A2540",
  success: "#4CD964",
  successLight: "#1A3D22",
  overlay: "rgba(0, 0, 0, 0.6)",
  mapTint: "#FFC107",
  mapRoute: "#FFC107",
  mapMarkerPickup: "#FFC107",
  mapMarkerDestination: "#FF3B30",
  mapMarkerRider: "#FFC107",
};

export const lightColors: ThemeColors = {
  primary: "#FFC107",
  primaryDark: "#E6AD00",
  primaryLight: "#FFF8E1",
  accent: "#FFC107",
  accentDark: "#E6AD00",
  accentLight: "#FFF8E1",
  background: "#FFFFFF",
  surface: "#F2F2F7",
  surfaceElevated: "#FFFFFF",
  border: "#E5E5EA",
  borderStrong: "#C7C7CC",
  text: "#000000",
  textSecondary: "#636366",
  textMuted: "#8E8E93",
  textOnPrimary: "#000000",
  danger: "#FF3B30",
  dangerLight: "#FFE5E3",
  warning: "#FFC107",
  warningLight: "#FFF8E1",
  info: "#007AFF",
  infoLight: "#E5F1FF",
  success: "#34C759",
  successLight: "#E8F8EC",
  overlay: "rgba(0, 0, 0, 0.4)",
  mapTint: "#FFC107",
  mapRoute: "#FFC107",
  mapMarkerPickup: "#FFC107",
  mapMarkerDestination: "#FF3B30",
  mapMarkerRider: "#FFC107",
};

/** Default static palette (dark). Prefer `useTheme().colors` in components. */
export const colors = darkColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
} as const;

export function getTypography(palette: ThemeColors) {
  return {
    hero: { fontSize: 32, fontWeight: "700" as const, lineHeight: 38, letterSpacing: -0.5, color: palette.text },
    h1: { fontSize: 28, fontWeight: "700" as const, lineHeight: 34, letterSpacing: -0.3, color: palette.text },
    h2: { fontSize: 22, fontWeight: "700" as const, lineHeight: 28, color: palette.text },
    h3: { fontSize: 18, fontWeight: "600" as const, lineHeight: 24, color: palette.text },
    body: { fontSize: 16, fontWeight: "400" as const, lineHeight: 22, color: palette.text },
    bodyMedium: { fontSize: 16, fontWeight: "500" as const, lineHeight: 22, color: palette.text },
    bodySemibold: { fontSize: 16, fontWeight: "600" as const, lineHeight: 22, color: palette.text },
    caption: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18, color: palette.text },
    captionMedium: { fontSize: 13, fontWeight: "500" as const, lineHeight: 18, color: palette.text },
    label: { fontSize: 12, fontWeight: "600" as const, lineHeight: 16, letterSpacing: 0.4, color: palette.text },
    tiny: { fontSize: 11, fontWeight: "500" as const, lineHeight: 14, color: palette.text },
  };
}

export const typography = getTypography(darkColors);

export function getStackHeaderOptions(palette: ThemeColors) {
  return {
    headerStyle: { backgroundColor: palette.background },
    headerTintColor: palette.primary,
    headerTitleStyle: getTypography(palette).h3,
    headerBackTitle: "Back" as const,
  };
}

export const stackHeaderOptions = getStackHeaderOptions(darkColors);

export const shadows = {
  sm: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8,
  },
  sheet: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
} as const;

export const ACCRA_REGION = {
  latitude: 5.6037,
  longitude: -0.187,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};
