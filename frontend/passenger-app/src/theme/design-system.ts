/**
 * OkadaGo Design System
 *
 * A motorcycle-first, map-dominant mobile UX system for 390×844 viewports.
 * Original identity: asymmetric layouts, bottom-sheet actions, thumb-zone CTAs.
 *
 * Principles:
 * 1. Map is king — always visually dominant
 * 2. Bottom sheets for actions, not full screens
 * 3. One focal point per screen
 * 4. Asymmetric > generic centered cards
 * 5. Thumb zone for primary actions (bottom 25%)
 * 6. Accent color for CTAs and status only
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
  /** Standard horizontal margin for all screens */
  marginHorizontal: 16,
  /** Compact horizontal margin for tight layouts */
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
} as const;

// ─── Typography Scale ──────────────────────────────────────────────────────
/** Asymmetric heading system — large display + compact body */
export const type = {
  /** 32/38 — Hero display, screen titles */
  display: {
    fontSize: 32,
    fontWeight: "800" as const,
    lineHeight: 38,
    letterSpacing: -0.8,
  },
  /** 26/32 — Section headlines */
  headline: {
    fontSize: 26,
    fontWeight: "700" as const,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  /** 20/26 — Card titles, prominent labels */
  title: {
    fontSize: 20,
    fontWeight: "700" as const,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  /** 17/22 — Subtitles, secondary headings */
  subtitle: {
    fontSize: 17,
    fontWeight: "600" as const,
    lineHeight: 22,
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

// ─── Brand Palette ─────────────────────────────────────────────────────────
/**
 * OkadaGo brand identity:
 * - Primary (Gold): CTAs, active states, route indicators
 * - Accent (Orange): Important status, express/priority
 * - Surface: Dark backgrounds for map-dominant UI
 *
 * Usage rules:
 * - Accent color ONLY for CTAs, active states, route lines, status
 * - Primary gold for brand presence and selection states
 * - Surfaces stay neutral to let map content breathe
 */
export const brand = {
  primary: "#facc15",
  primaryMuted: "#b8941a",
  accent: "#ff6b00",
  accentMuted: "#cc5500",
  success: "#4CD964",
  danger: "#FF3B30",
  info: "#0A84FF",
} as const;

// ─── Semantic Colors (Dark Mode) ───────────────────────────────────────────
export const dark = {
  bg: "#070B14",
  surface: "#111827",
  surfaceRaised: "#1A2332",
  surfaceOverlay: "#1F2B3D",
  border: "#1E293B",
  borderStrong: "#334155",
  text: "#F8FAFC",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  textOnPrimary: "#000000",
  overlay: "rgba(0, 0, 0, 0.65)",
  scrim: "rgba(0, 0, 0, 0.4)",
  mapRoute: "#ff6b00",
  mapMarkerPickup: "#facc15",
  mapMarkerDestination: "#FF3B30",
  mapMarkerRider: "#ff6b00",
} as const;

// ─── Semantic Colors (Light Mode) ──────────────────────────────────────────
export const light = {
  bg: "#F8F9FA",
  surface: "#FFFFFF",
  surfaceRaised: "#F1F3F5",
  surfaceOverlay: "#E9ECEF",
  border: "#DEE2E6",
  borderStrong: "#ADB5BD",
  text: "#212529",
  textSecondary: "#495057",
  textMuted: "#868E96",
  textOnPrimary: "#000000",
  overlay: "rgba(0, 0, 0, 0.4)",
  scrim: "rgba(0, 0, 0, 0.2)",
  mapRoute: "#ff6b00",
  mapMarkerPickup: "#facc15",
  mapMarkerDestination: "#FF3B30",
  mapMarkerRider: "#ff6b00",
} as const;
