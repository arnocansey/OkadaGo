/**
 * OkadaGo Rider Design System
 *
 * A professional work tool for motorcycle riders in Ghana.
 * Original identity: hexagonal motifs, bold earnings displays, high-contrast status.
 *
 * Design principles:
 * 1. Fast, bold, highly readable — glanceable at 2 meters
 * 2. Low distraction — minimal text, maximum contrast
 * 3. One-handed use — large touch targets (min 48px)
 * 4. Map always visible — bottom sheets for actions
 * 5. Professional work tool — not a consumer toy
 * 6. Hexagonal signature — OkadaGo's unique visual identity
 */

import { Platform, Dimensions } from "react-native";

// ─── Viewport ───────────────────────────────────────────────────────────────
export const VIEWPORT = {
  width: 390,
  height: 844,
} as const;

export const SCREEN = Dimensions.get("window");

// ─── Safe Areas (iPhone 14 Pro / standard notch) ───────────────────────────
export const SAFE_AREA = {
  top: Platform.OS === "ios" ? 59 : 44,
  bottom: Platform.OS === "ios" ? 34 : 20,
} as const;

// ─── Spacing (8px grid) ────────────────────────────────────────────────────
export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
} as const;

// ─── Layout ────────────────────────────────────────────────────────────────
export const layout = {
  /** Standard horizontal margin */
  marginHorizontal: 16,
  /** Compact horizontal margin */
  marginHorizontalCompact: 12,
  /** Bottom sheet horizontal padding */
  sheetPadding: 20,
  /** Thumb zone threshold — primary CTAs live below this Y */
  thumbZoneY: VIEWPORT.height * 0.75,
  /** Top action zone — status/nav lives above this Y */
  topZoneY: SAFE_AREA.top + 44,
  /** Map dominant ratio — map should fill this portion of screen */
  mapRatio: 0.62,
  /** Bottom sheet peek height (collapsed) */
  sheetPeek: 180,
  /** Bottom sheet expanded height */
  sheetExpanded: VIEWPORT.height - SAFE_AREA.top - 44,
} as const;

// ─── Border Radius ─────────────────────────────────────────────────────────
export const radii = {
  none: 0,
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
  /** Bottom sheet top corners */
  sheet: 24,
  /** Card corners */
  card: 18,
  /** Pill / chip */
  pill: 999,
  /** Circular avatar / button */
  circle: 999,
  /** OkadaGo hexagonal signature */
  hex: 12,
} as const;

// ─── Typography Scale ──────────────────────────────────────────────────────
/** Rider typography — large, bold, glanceable */
export const type = {
  /** 36/42 — Earnings hero display */
  display: {
    fontSize: 36,
    fontWeight: "800" as const,
    lineHeight: 42,
    letterSpacing: -1,
  },
  /** 28/34 — Status headlines */
  headline: {
    fontSize: 28,
    fontWeight: "700" as const,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  /** 22/28 — Section titles */
  title: {
    fontSize: 22,
    fontWeight: "700" as const,
    lineHeight: 28,
  },
  /** 18/24 — Subtitles, prominent labels */
  subtitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    lineHeight: 24,
  },
  /** 16/22 — Body text */
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 22,
  },
  /** 16/22 — Emphasized body */
  bodyEmphasis: {
    fontSize: 16,
    fontWeight: "600" as const,
    lineHeight: 22,
  },
  /** 14/18 — Captions, metadata */
  caption: {
    fontSize: 14,
    fontWeight: "400" as const,
    lineHeight: 18,
  },
  /** 14/18 — Emphasized caption */
  captionEmphasis: {
    fontSize: 14,
    fontWeight: "600" as const,
    lineHeight: 18,
  },
  /** 12/16 — Labels, badges, tiny text */
  label: {
    fontSize: 12,
    fontWeight: "600" as const,
    lineHeight: 16,
    letterSpacing: 0.3,
  },
  /** 11/14 — Micro text */
  micro: {
    fontSize: 11,
    fontWeight: "500" as const,
    lineHeight: 14,
  },
} as const;

// ─── Elevation / Shadows ───────────────────────────────────────────────────
export function elevation(isDark: boolean) {
  const o = isDark ? 0.35 : 0.08;
  return {
    none: { shadowOpacity: 0, elevation: 0 },
    xs: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: o * 0.5,
      shadowRadius: 2,
      elevation: 1,
    },
    sm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: o * 0.7,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: o,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: o * 1.2,
      shadowRadius: 16,
      elevation: 8,
    },
    sheet: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -6 },
      shadowOpacity: o * 1.4,
      shadowRadius: 24,
      elevation: 12,
    },
  } as const;
}

// ─── Animation Timing ──────────────────────────────────────────────────────
export const timing = {
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 500,
  sheet: 350,
} as const;

// ─── Z-Index Layers ────────────────────────────────────────────────────────
export const layers = {
  map: 0,
  mapOverlay: 10,
  sheet: 50,
  sheetHandle: 51,
  floatingAction: 60,
  header: 100,
  modal: 200,
  toast: 300,
  splash: 999,
} as const;

// ─── Rider Brand Palette ───────────────────────────────────────────────────
/**
 * OkadaGo Rider identity:
 * - Primary (Gold): Active state, earnings, confirmations
 * - Accent (Orange): Urgent actions, trip requests
 * - Online (Green): Online status, success
 * - Offline (Slate): Offline status, inactive
 * - Danger (Red): SOS, cancellations, warnings
 *
 * Usage rules:
 * - Green ONLY for online status and success
 * - Gold for earnings and active states
 * - Orange for trip requests and urgent actions
 * - High contrast for outdoor visibility
 */
export const brand = {
  primary: "#facc15",
  primaryMuted: "#b8941a",
  accent: "#ff6b00",
  accentMuted: "#cc5500",
  online: "#22C55E",
  onlineMuted: "#15803D",
  offline: "#64748B",
  offlineMuted: "#475569",
  danger: "#EF4444",
  dangerMuted: "#B91C1C",
  warning: "#F59E0B",
  info: "#3B82F6",
} as const;

// ─── Semantic Colors (Dark Mode - Rider) ───────────────────────────────────
export const dark = {
  bg: "#0A0E17",
  surface: "#111827",
  surfaceRaised: "#1A2332",
  surfaceOverlay: "#1F2B3D",
  border: "#1E293B",
  borderStrong: "#334155",
  text: "#F8FAFC",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  textOnPrimary: "#000000",
  textOnDanger: "#FFFFFF",
  overlay: "rgba(0, 0, 0, 0.65)",
  scrim: "rgba(0, 0, 0, 0.4)",
  online: "#22C55E",
  onlineLight: "#052E16",
  offline: "#64748B",
  offlineLight: "#1E293B",
  danger: "#EF4444",
  dangerLight: "#450A0A",
  primary: "#facc15",
  primaryLight: "#422006",
  accent: "#ff6b00",
  accentLight: "#431407",
  mapRoute: "#ff6b00",
  mapMarkerPickup: "#facc15",
  mapMarkerDestination: "#EF4444",
  mapMarkerRider: "#22C55E",
} as const;

// ─── Semantic Colors (Light Mode - Rider) ──────────────────────────────────
export const light = {
  bg: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceRaised: "#F1F5F9",
  surfaceOverlay: "#E2E8F0",
  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  text: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
  textOnPrimary: "#000000",
  textOnDanger: "#FFFFFF",
  overlay: "rgba(0, 0, 0, 0.4)",
  scrim: "rgba(0, 0, 0, 0.2)",
  online: "#16A34A",
  onlineLight: "#DCFCE7",
  offline: "#64748B",
  offlineLight: "#F1F5F9",
  danger: "#DC2626",
  dangerLight: "#FEE2E2",
  primary: "#EAB308",
  primaryLight: "#FEF9C3",
  accent: "#EA580C",
  accentLight: "#FFF7ED",
  mapRoute: "#ff6b00",
  mapMarkerPickup: "#EAB308",
  mapMarkerDestination: "#DC2626",
  mapMarkerRider: "#16A34A",
} as const;

// ─── Theme Colors Type ─────────────────────────────────────────────────────
export type ThemeColors = typeof dark;

// ─── Typography Factory ────────────────────────────────────────────────────
export function getTypography(colors: ThemeColors) {
  return {
    h1: { fontSize: 32, fontWeight: "700" as const, color: colors.text },
    h2: { fontSize: 24, fontWeight: "700" as const, color: colors.text },
    h3: { fontSize: 20, fontWeight: "600" as const, color: colors.text },
    body: { fontSize: 16, fontWeight: "400" as const, color: colors.text },
    bodyMedium: { fontSize: 16, fontWeight: "500" as const, color: colors.text },
    bodySemibold: { fontSize: 16, fontWeight: "600" as const, color: colors.text },
    caption: { fontSize: 14, fontWeight: "400" as const, color: colors.textSecondary },
    captionMedium: { fontSize: 14, fontWeight: "500" as const, color: colors.textSecondary },
    label: { fontSize: 12, fontWeight: "600" as const, color: colors.textMuted },
    small: { fontSize: 12, fontWeight: "400" as const, color: colors.textMuted },
  };
}

// ─── Stack Header Options ──────────────────────────────────────────────────
export function getStackHeaderOptions(colors: ThemeColors) {
  return {
    headerStyle: {
      backgroundColor: colors.surface,
    },
    headerTintColor: colors.text,
    headerTitleStyle: {
      fontWeight: "600" as const,
    },
  };
}
