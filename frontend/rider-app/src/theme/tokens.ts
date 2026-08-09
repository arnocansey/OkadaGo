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
  /** Deep background (rider-specific) */
  bg: string;
  /** Overlay surface for elevated elements */
  surfaceOverlay: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textOnPrimary: string;
  textOnDanger: string;
  danger: string;
  dangerLight: string;
  warning: string;
  warningLight: string;
  info: string;
  infoLight: string;
  success: string;
  successLight: string;
  overlay: string;
  online: string;
  offline: string;
  mapTint: string;
  mapRoute: string;
  mapMarkerPickup: string;
  mapMarkerDestination: string;
  mapMarkerRider: string;
};

export const darkColors: ThemeColors = {
  primary: "#facc15",
  primaryDark: "#f7c600",
  primaryLight: "#3D3200",
  accent: "#ff6b00",
  accentDark: "#e05e00",
  accentLight: "#2A2400",
  background: "#0B0F19",
  surface: "#151C2C",
  surfaceElevated: "#1C2538",
  bg: "#0A0E17",
  surfaceOverlay: "rgba(255,255,255,0.06)",
  border: "#252D39",
  borderStrong: "#344052",
  text: "#FFFFFF",
  textSecondary: "#A1A1AA",
  textMuted: "#71717A",
  textOnPrimary: "#000000",
  textOnDanger: "#FFFFFF",
  danger: "#FF3B30",
  dangerLight: "#3D1512",
  warning: "#facc15",
  warningLight: "#3D3200",
  info: "#0A84FF",
  infoLight: "#0A2540",
  success: "#4CD964",
  successLight: "#1A3D22",
  overlay: "rgba(0, 0, 0, 0.6)",
  online: "#4CD964",
  offline: "#8E8E93",
  mapTint: "#facc15",
  mapRoute: "#ff6b00",
  mapMarkerPickup: "#facc15",
  mapMarkerDestination: "#FF3B30",
  mapMarkerRider: "#ff6b00",
};

export const lightColors: ThemeColors = {
  primary: "#facc15",
  primaryDark: "#f7c600",
  primaryLight: "#FFF8E1",
  accent: "#ff6b00",
  accentDark: "#e05e00",
  accentLight: "#FFF8E1",
  background: "#FFFFFF",
  surface: "#F2F2F7",
  surfaceElevated: "#FFFFFF",
  bg: "#F8FAFC",
  surfaceOverlay: "rgba(0,0,0,0.04)",
  border: "#E5E5EA",
  borderStrong: "#C7C7CC",
  text: "#000000",
  textSecondary: "#636366",
  textMuted: "#8E8E93",
  textOnPrimary: "#000000",
  textOnDanger: "#FFFFFF",
  danger: "#FF3B30",
  dangerLight: "#FFE5E3",
  warning: "#facc15",
  warningLight: "#FFF8E1",
  info: "#007AFF",
  infoLight: "#E5F1FF",
  success: "#34C759",
  successLight: "#E8F8EC",
  overlay: "rgba(0, 0, 0, 0.4)",
  online: "#34C759",
  offline: "#8E8E93",
  mapTint: "#facc15",
  mapRoute: "#ff6b00",
  mapMarkerPickup: "#facc15",
  mapMarkerDestination: "#FF3B30",
  mapMarkerRider: "#ff6b00",
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

export function getShadows(isDark: boolean) {
  const opacity = isDark
    ? { sm: 0.3, md: 0.35, lg: 0.4, sheet: 0.35 }
    : { sm: 0.08, md: 0.12, lg: 0.16, sheet: 0.14 };
  return {
    sm: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: opacity.sm,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: opacity.md,
      shadowRadius: 12,
      elevation: 4,
    },
    lg: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: opacity.lg,
      shadowRadius: 24,
      elevation: 8,
    },
    sheet: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: opacity.sheet,
      shadowRadius: 16,
      elevation: 12,
    },
  } as const;
}

/** @deprecated Prefer getShadows(isDark) from theme. */
export const shadows = getShadows(true);

export const ACCRA_REGION = {
  latitude: 5.6037,
  longitude: -0.187,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};
