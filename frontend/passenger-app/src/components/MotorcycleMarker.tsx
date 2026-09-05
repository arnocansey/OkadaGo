import React from "react";
import { StyleSheet, View, Text } from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Path,
  Rect,
  Circle,
  Ellipse,
  G,
  Polygon
} from "react-native-svg";

export interface MotorcycleMarkerProps {
  heading?: number;
  isSelected?: boolean;
  isMoving?: boolean;
  pinColor?: string;
  title?: string;
  speed?: number;
  etaLabel?: string;
}

/**
 * Realistic Top-Down 3D Motorcycle SVG for React Native Maps.
 * Direct road projection without any circular wrapper or circular border.
 * Oriented North (0°) by default so rotation directly matches GPS heading.
 */
export function MotorcycleMarker({
  heading = 0,
  isSelected = false,
  isMoving = false,
  pinColor = "#FFB800",
  title,
  speed,
  etaLabel,
}: MotorcycleMarkerProps) {
  // Proportional 3D motorcycle sizing (width: 40, height: 64)
  const width = isSelected ? 44 : 36;
  const height = isSelected ? 70 : 58;
  const showBadge = Boolean(title || etaLabel);

  return (
    <View style={styles.container}>
      {/* Floating Info Tag for Selected Rider */}
      {showBadge && (
        <View style={[styles.infoBubble, isSelected && styles.infoBubbleSelected]}>
          <Text style={styles.infoTitle}>{etaLabel || title}</Text>
          {speed !== undefined && speed > 2 && (
            <Text style={styles.infoSpeed}>{Math.round(speed)} km/h</Text>
          )}
        </View>
      )}

      {/* Rotating 3D Motorcycle Chassis directly on the map */}
      <View
        style={[
          styles.bikeWrapper,
          {
            width,
            height,
            transform: [{ rotate: `${heading}deg` }],
          },
        ]}
      >
        <Svg width={width} height={height} viewBox="0 0 44 70" fill="none">
          <Defs>
            {/* Ground Shadow Gradient */}
            <RadialGradient id="groundShadow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#000000" stopOpacity="0.45" />
              <Stop offset="60%" stopColor="#000000" stopOpacity="0.25" />
              <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </RadialGradient>

            {/* Selection Ambient Road Glow */}
            <RadialGradient id="selectionGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={pinColor} stopOpacity="0.55" />
              <Stop offset="70%" stopColor={pinColor} stopOpacity="0.18" />
              <Stop offset="100%" stopColor={pinColor} stopOpacity="0" />
            </RadialGradient>

            {/* Front & Rear Tire Tread Gradient */}
            <LinearGradient id="tireGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#0F172A" />
              <Stop offset="30%" stopColor="#334155" />
              <Stop offset="70%" stopColor="#1E293B" />
              <Stop offset="100%" stopColor="#020617" />
            </LinearGradient>

            {/* Chrome Telescopic Fork / Metallic Gradient */}
            <LinearGradient id="chromeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#94A3B8" />
              <Stop offset="50%" stopColor="#F8FAFC" />
              <Stop offset="100%" stopColor="#64748B" />
            </LinearGradient>

            {/* 3D Fuel Tank Metallic Gradient */}
            <LinearGradient id="tankGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#1E293B" />
              <Stop offset="25%" stopColor="#475569" />
              <Stop offset="65%" stopColor="#1E293B" />
              <Stop offset="100%" stopColor="#0F172A" />
            </LinearGradient>

            {/* 3D Helmet Specular Spherical Highlight */}
            <RadialGradient id="helmetGrad" cx="35%" cy="30%" r="65%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
              <Stop offset="25%" stopColor={pinColor} />
              <Stop offset="75%" stopColor="#D97706" />
              <Stop offset="100%" stopColor="#92400E" />
            </RadialGradient>

            {/* Visor Gradient */}
            <LinearGradient id="visorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#38BDF8" stopOpacity="0.9" />
              <Stop offset="50%" stopColor="#0F172A" stopOpacity="0.95" />
              <Stop offset="100%" stopColor="#020617" />
            </LinearGradient>

            {/* Headlight Forward Cone */}
            <LinearGradient id="headlightCone" x1="50%" y1="100%" x2="50%" y2="0%">
              <Stop offset="0%" stopColor="#FEF08A" stopOpacity="0.6" />
              <Stop offset="60%" stopColor="#FEF08A" stopOpacity="0.2" />
              <Stop offset="100%" stopColor="#FEF08A" stopOpacity="0" />
            </LinearGradient>
          </Defs>

          {/* 1. SELECTION AMBIENT ROAD ILLUMINATION (NO CIRCLE BORDER) */}
          {isSelected && (
            <Ellipse cx="22" cy="35" rx="21" ry="32" fill="url(#selectionGlow)" />
          )}

          {/* 2. REALISTIC 3D GROUND DROP SHADOW */}
          <Ellipse cx="24" cy="38" rx="14" ry="29" fill="url(#groundShadow)" />

          {/* 3. HEADLIGHT BEAM CASTING FORWARD ON ROAD */}
          <Polygon points="19,14 25,14 34,0 10,0" fill="url(#headlightCone)" />

          {/* 4. FRONT WHEEL & TIRE WITH 3D TREAD */}
          <Rect x="19.5" y="4" width="5" height="14" rx="2.5" fill="url(#tireGrad)" />
          {/* Tread grooves */}
          <Path d="M20 7L24 8.5M20 10.5L24 12M20 14L24 15.5" stroke="#475569" strokeWidth="0.75" />

          {/* 5. FRONT FORKS & SUSPENSION */}
          <Rect x="17.5" y="14" width="2" height="11" rx="1" fill="url(#chromeGrad)" />
          <Rect x="24.5" y="14" width="2" height="11" rx="1" fill="url(#chromeGrad)" />
          {/* Front Mudguard */}
          <Path d="M19 12 C19 10, 25 10, 25 12 L24.5 17 L19.5 17 Z" fill="#0F172A" />

          {/* 6. ENGINE BLOCK & COOLING FINS */}
          <Rect x="15" y="27" width="14" height="10" rx="2" fill="#334155" />
          <Path d="M14 29H16M14 31H16M14 33H16M28 29H30M28 31H30M28 33H30" stroke="#94A3B8" strokeWidth="1.2" />

          {/* 7. CHROME EXHAUST SYSTEM (RIGHT SIDE) */}
          <Path
            d="M26.5 33 C28.5 36, 29 45, 28.5 55 L26 55 C26.5 45, 26 36, 24.5 33 Z"
            fill="url(#chromeGrad)"
          />
          {/* Exhaust Tip */}
          <Ellipse cx="27.2" cy="55" rx="1.3" ry="0.8" fill="#0F172A" />

          {/* 8. REAR WHEEL & TIRE */}
          <Rect x="19" y="48" width="6" height="16" rx="3" fill="url(#tireGrad)" />
          <Path d="M19.5 51L24.5 53M19.5 55L24.5 57M19.5 59L24.5 61" stroke="#475569" strokeWidth="0.85" />

          {/* 9. MOTORCYCLE SEAT & SUBFRAME */}
          {/* Pillion & Main Seat */}
          <Path
            d="M17.5 38 C16.5 44, 16.5 48, 18 53 L26 53 C27.5 48, 27.5 44, 26.5 38 Z"
            fill="#0F172A"
          />
          {/* Seat Stitching Depth lines */}
          <Path d="M18.5 43H25.5M19 47H25" stroke="#1E293B" strokeWidth="1" strokeLinecap="round" />

          {/* 10. FUEL TANK & 3D CHASSIS */}
          <Path
            d="M16.5 23 C14.5 25, 14.5 33, 17 37 L27 37 C29.5 33, 29.5 25, 27.5 23 Z"
            fill="url(#tankGrad)"
          />
          {/* Racing Stripe / Brand Accent on Tank */}
          <Path d="M21 23H23L23.5 36.5H20.5Z" fill={pinColor} />
          {/* Chrome Gas Cap */}
          <Circle cx="22" cy="26" r="1.6" fill="url(#chromeGrad)" />

          {/* 11. 3D RIDER ANATOMY (SHOULDERS, ARMS & JACKET) */}
          {/* Rider Jacket Shoulders */}
          <Path
            d="M12.5 33 C14 26, 17 23, 20 22 L24 22 C27 23, 30 26, 31.5 33 C30 38, 26 40, 22 40 C18 40, 14 38, 12.5 33 Z"
            fill="#1E293B"
          />
          {/* Hi-Vis Shoulder Epaulets */}
          <Path d="M13.5 30L17.5 25" stroke={pinColor} strokeWidth="1.8" strokeLinecap="round" />
          <Path d="M30.5 30L26.5 25" stroke={pinColor} strokeWidth="1.8" strokeLinecap="round" />

          {/* Arms Reaching to Handlebars */}
          <Path d="M15 28L11.5 22" stroke="#1E293B" strokeWidth="2.6" strokeLinecap="round" />
          <Path d="M29 28L32.5 22" stroke="#1E293B" strokeWidth="2.6" strokeLinecap="round" />

          {/* 12. WIDE HANDLEBARS & SIDE MIRRORS */}
          {/* Handlebar Tube */}
          <Path d="M10 21.5 C16 20.5, 28 20.5, 34 21.5" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" />
          {/* Left/Right Rubber Grips */}
          <Rect x="8.5" y="20" width="4" height="3" rx="1" fill="#0F172A" />
          <Rect x="31.5" y="20" width="4" height="3" rx="1" fill="#0F172A" />
          {/* Brake Levers */}
          <Path d="M8.5 20.5L6 19.5M35.5 20.5L38 19.5" stroke="#CBD5E1" strokeWidth="1.2" strokeLinecap="round" />
          {/* Aerodynamic Mirrors with Glass Reflection */}
          <Ellipse cx="5.5" cy="18" rx="2" ry="3.5" fill="#38BDF8" />
          <Ellipse cx="5.2" cy="17.5" rx="1.2" ry="2.2" fill="#E0F2FE" />
          <Ellipse cx="38.5" cy="18" rx="2" ry="3.5" fill="#38BDF8" />
          <Ellipse cx="38.2" cy="17.5" rx="1.2" ry="2.2" fill="#E0F2FE" />
          {/* Digital Dash Instrument */}
          <Rect x="19.5" y="19.5" width="5" height="3" rx="0.8" fill="#0F172A" stroke="#38BDF8" strokeWidth="0.6" />

          {/* 13. 3D RIDER HELMET WITH VISOR & SPECULAR REFLECTION */}
          {/* Helmet Base Shadow */}
          <Ellipse cx="22" cy="34" rx="5.8" ry="6.8" fill="#0F172A" />
          {/* 3D Spherical Contoured Helmet */}
          <Ellipse cx="22" cy="33.5" rx="5.2" ry="6.2" fill="url(#helmetGrad)" />
          {/* Helmet Crown Ridge */}
          <Path d="M22 28L22 36" stroke="#FFFFFF" strokeWidth="0.8" opacity="0.4" />
          {/* Tinted Aerodynamic Visor */}
          <Path d="M18 31 C19.5 29, 24.5 29, 26 31 L25.5 33.5 C24 32, 20 32, 18.5 33.5 Z" fill="url(#visorGrad)" />
          {/* Visor Glare Reflex Stripe */}
          <Path d="M19 30.5 C20.5 29.5, 23 29.5, 24.5 30.5" stroke="#FFFFFF" strokeWidth="0.8" strokeLinecap="round" opacity="0.8" />

          {/* 14. BRIGHT LED TAIL / BRAKE LIGHT (RED GLOW) */}
          <Rect x="20" y="52" width="4" height="2" rx="1" fill="#EF4444" />
          <Ellipse cx="22" cy="53" rx="3.5" ry="1.5" fill="#EF4444" opacity="0.6" />

          {/* 15. MOVING EXHAUST AIR DISTORTION (WHEN ACTIVE) */}
          {isMoving && (
            <G opacity="0.5">
              <Circle cx="27" cy="59" r="1.5" fill="#94A3B8" />
              <Circle cx="27.5" cy="63" r="2.2" fill="#CBD5E1" opacity="0.3" />
            </G>
          )}
        </Svg>
      </View>
    </View>
  );
}

/**
 * Generates an SVG string representation of the true 3D Okada motorcycle for Leaflet Web.
 * No circular background, no circular border, true 3D motorcycle anatomy with directional shadow.
 */
export function getMotorcycleSvgString(options: {
  size?: number;
  isSelected?: boolean;
  pinColor?: string;
  isMoving?: boolean;
}): string {
  const isSelected = Boolean(options.isSelected);
  const width = options.size ? Math.round(options.size * 0.7) : isSelected ? 44 : 36;
  const height = options.size ? options.size : isSelected ? 70 : 58;
  const color = options.pinColor || "#FFB800";
  const idSuffix = Math.random().toString(36).substring(2, 7);

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 44 70" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; overflow: visible;">
      <defs>
        <!-- Ground Drop Shadow -->
        <radialGradient id="gs_${idSuffix}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#000000" stop-opacity="0.45"/>
          <stop offset="60%" stop-color="#000000" stop-opacity="0.22"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>

        <!-- Selection Glow -->
        <radialGradient id="sg_${idSuffix}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.55"/>
          <stop offset="70%" stop-color="${color}" stop-opacity="0.16"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
        </radialGradient>

        <!-- Tire Tread Gradient -->
        <linearGradient id="tg_${idSuffix}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#0F172A"/>
          <stop offset="30%" stop-color="#334155"/>
          <stop offset="70%" stop-color="#1E293B"/>
          <stop offset="100%" stop-color="#020617"/>
        </linearGradient>

        <!-- Chrome Forks & Exhaust -->
        <linearGradient id="cg_${idSuffix}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#94A3B8"/>
          <stop offset="50%" stop-color="#F8FAFC"/>
          <stop offset="100%" stop-color="#64748B"/>
        </linearGradient>

        <!-- 3D Fuel Tank -->
        <linearGradient id="tkg_${idSuffix}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#1E293B"/>
          <stop offset="25%" stop-color="#475569"/>
          <stop offset="65%" stop-color="#1E293B"/>
          <stop offset="100%" stop-color="#0F172A"/>
        </linearGradient>

        <!-- 3D Helmet Specular Spherical Highlight -->
        <radialGradient id="hg_${idSuffix}" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.8"/>
          <stop offset="25%" stop-color="${color}"/>
          <stop offset="75%" stop-color="#D97706"/>
          <stop offset="100%" stop-color="#92400E"/>
        </radialGradient>

        <!-- Visor Gradient -->
        <linearGradient id="vg_${idSuffix}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.9"/>
          <stop offset="50%" stop-color="#0F172A" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="#020617"/>
        </linearGradient>

        <!-- Headlight Beam -->
        <linearGradient id="hl_${idSuffix}" x1="50%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stop-color="#FEF08A" stop-opacity="0.6"/>
          <stop offset="60%" stop-color="#FEF08A" stop-opacity="0.2"/>
          <stop offset="100%" stop-color="#FEF08A" stop-opacity="0"/>
        </linearGradient>
      </defs>

      <!-- Selection Ambient Road Illumination (NO CIRCLE BORDER) -->
      ${isSelected ? `<ellipse cx="22" cy="35" rx="21" ry="32" fill="url(#sg_${idSuffix})"/>` : ""}

      <!-- Projected 3D Ground Drop Shadow -->
      <ellipse cx="24" cy="38" rx="14" ry="29" fill="url(#gs_${idSuffix})"/>

      <!-- Headlight Beam -->
      <polygon points="19,14 25,14 34,0 10,0" fill="url(#hl_${idSuffix})"/>

      <!-- Front Wheel & Tire -->
      <rect x="19.5" y="4" width="5" height="14" rx="2.5" fill="url(#tg_${idSuffix})"/>
      <path d="M20 7L24 8.5M20 10.5L24 12M20 14L24 15.5" stroke="#475569" stroke-width="0.75"/>

      <!-- Front Forks & Suspension -->
      <rect x="17.5" y="14" width="2" height="11" rx="1" fill="url(#cg_${idSuffix})"/>
      <rect x="24.5" y="14" width="2" height="11" rx="1" fill="url(#cg_${idSuffix})"/>
      <path d="M19 12 C19 10, 25 10, 25 12 L24.5 17 L19.5 17 Z" fill="#0F172A"/>

      <!-- Engine Block -->
      <rect x="15" y="27" width="14" height="10" rx="2" fill="#334155"/>
      <path d="M14 29H16M14 31H16M14 33H16M28 29H30M28 31H30M28 33H30" stroke="#94A3B8" stroke-width="1.2"/>

      <!-- Chrome Exhaust System -->
      <path d="M26.5 33 C28.5 36, 29 45, 28.5 55 L26 55 C26.5 45, 26 36, 24.5 33 Z" fill="url(#cg_${idSuffix})"/>
      <ellipse cx="27.2" cy="55" rx="1.3" ry="0.8" fill="#0F172A"/>

      <!-- Rear Wheel & Tire -->
      <rect x="19" y="48" width="6" height="16" rx="3" fill="url(#tg_${idSuffix})"/>
      <path d="M19.5 51L24.5 53M19.5 55L24.5 57M19.5 59L24.5 61" stroke="#475569" stroke-width="0.85"/>

      <!-- Motorcycle Seat -->
      <path d="M17.5 38 C16.5 44, 16.5 48, 18 53 L26 53 C27.5 48, 27.5 44, 26.5 38 Z" fill="#0F172A"/>
      <path d="M18.5 43H25.5M19 47H25" stroke="#1E293B" stroke-width="1" stroke-linecap="round"/>

      <!-- 3D Fuel Tank -->
      <path d="M16.5 23 C14.5 25, 14.5 33, 17 37 L27 37 C29.5 33, 29.5 25, 27.5 23 Z" fill="url(#tkg_${idSuffix})"/>
      <path d="M21 23H23L23.5 36.5H20.5Z" fill="${color}"/>
      <circle cx="22" cy="26" r="1.6" fill="url(#cg_${idSuffix})"/>

      <!-- 3D Rider Anatomy (Shoulders & Jacket) -->
      <path d="M12.5 33 C14 26, 17 23, 20 22 L24 22 C27 23, 30 26, 31.5 33 C30 38, 26 40, 22 40 C18 40, 14 38, 12.5 33 Z" fill="#1E293B"/>
      <path d="M13.5 30L17.5 25" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M30.5 30L26.5 25" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M15 28L11.5 22" stroke="#1E293B" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M29 28L32.5 22" stroke="#1E293B" stroke-width="2.6" stroke-linecap="round"/>

      <!-- Handlebars & Mirrors -->
      <path d="M10 21.5 C16 20.5, 28 20.5, 34 21.5" stroke="#64748B" stroke-width="2.2" stroke-linecap="round"/>
      <rect x="8.5" y="20" width="4" height="3" rx="1" fill="#0F172A"/>
      <rect x="31.5" y="20" width="4" height="3" rx="1" fill="#0F172A"/>
      <path d="M8.5 20.5L6 19.5M35.5 20.5L38 19.5" stroke="#CBD5E1" stroke-width="1.2" stroke-linecap="round"/>
      <ellipse cx="5.5" cy="18" rx="2" ry="3.5" fill="#38BDF8"/>
      <ellipse cx="5.2" cy="17.5" rx="1.2" ry="2.2" fill="#E0F2FE"/>
      <ellipse cx="38.5" cy="18" rx="2" ry="3.5" fill="#38BDF8"/>
      <ellipse cx="38.2" cy="17.5" rx="1.2" ry="2.2" fill="#E0F2FE"/>
      <rect x="19.5" y="19.5" width="5" height="3" rx="0.8" fill="#0F172A" stroke="#38BDF8" stroke-width="0.6"/>

      <!-- 3D Rider Helmet & Specular Visor -->
      <ellipse cx="22" cy="34" rx="5.8" ry="6.8" fill="#0F172A"/>
      <ellipse cx="22" cy="33.5" rx="5.2" ry="6.2" fill="url(#hg_${idSuffix})"/>
      <path d="M22 28L22 36" stroke="#FFFFFF" stroke-width="0.8" opacity="0.4"/>
      <path d="M18 31 C19.5 29, 24.5 29, 26 31 L25.5 33.5 C24 32, 20 32, 18.5 33.5 Z" fill="url(#vg_${idSuffix})"/>
      <path d="M19 30.5 C20.5 29.5, 23 29.5, 24.5 30.5" stroke="#FFFFFF" stroke-width="0.8" stroke-linecap="round" opacity="0.8"/>

      <!-- Bright LED Tail / Brake Light -->
      <rect x="20" y="52" width="4" height="2" rx="1" fill="#EF4444"/>
      <ellipse cx="22" cy="53" rx="3.5" ry="1.5" fill="#EF4444" opacity="0.6"/>

      <!-- Moving Particles -->
      ${
        options.isMoving
          ? `<circle cx="27" cy="59" r="1.5" fill="#94A3B8" opacity="0.5"/>
             <circle cx="27.5" cy="63" r="2.2" fill="#CBD5E1" opacity="0.3"/>`
          : ""
      }
    </svg>
  `;
}

/**
 * Creates Leaflet HTML string with rotation and floating badges.
 * ZERO circular borders or circular backgrounds. Only the 3D motorcycle and ground shadow.
 */
export function createMotorcycleMarkerHtml(options: {
  heading?: number;
  isSelected?: boolean;
  pinColor?: string;
  title?: string;
  speed?: number;
  etaMinutes?: number;
  isMoving?: boolean;
}): string {
  const heading = options.heading ?? 0;
  const isSelected = Boolean(options.isSelected);
  const width = isSelected ? 44 : 36;
  const height = isSelected ? 70 : 58;
  const pinColor = options.pinColor || "#FFB800";
  const svg = getMotorcycleSvgString({
    size: height,
    isSelected,
    pinColor,
    isMoving: options.isMoving,
  });

  const badgeHtml = options.etaMinutes
    ? `<div style="position: absolute; top: -30px; white-space: nowrap; background: #0F172A; color: #FFFFFF; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 999px; border: 1.5px solid ${pinColor}; box-shadow: 0 4px 12px rgba(0,0,0,0.6); display: flex; align-items: center; gap: 4px; pointer-events: none; z-index: 10;">
        <span>~${Math.round(options.etaMinutes)} min</span>
        ${options.speed ? `<span style="color: ${pinColor}; font-weight: 600;">· ${Math.round(options.speed)} km/h</span>` : ""}
      </div>`
    : options.title && options.title !== "Okada" && options.title !== "Rider"
    ? `<div style="position: absolute; top: -26px; white-space: nowrap; background: rgba(15,23,42,0.92); color: #FFFFFF; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.25); box-shadow: 0 4px 10px rgba(0,0,0,0.5); pointer-events: none; z-index: 10;">
        ${options.title}
      </div>`
    : "";

  return `
    <div class="okada-moto-marker-wrap ${isSelected ? "selected-rider" : ""}" style="position: relative; width: ${width}px; height: ${height}px; display: flex; align-items: center; justify-content: center; pointer-events: auto; background: transparent !important; border: none !important;">
      ${badgeHtml}
      <div class="okada-moto-rotator" style="width: ${width}px; height: ${height}px; background: transparent; border: none; outline: none; box-shadow: none; display: flex; align-items: center; justify-content: center; transform: rotate(${heading}deg); transform-origin: 50% 50%; will-change: transform; transition: transform 0.2s linear;">
        ${svg}
      </div>
    </div>
  `;
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    backgroundColor: "transparent",
  },
  bikeWrapper: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 0,
    shadowColor: "transparent",
    elevation: 0,
  },
  infoBubble: {
    position: "absolute",
    top: -30,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F172A",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 10,
  },
  infoBubbleSelected: {
    borderColor: "#FFB800",
    borderWidth: 1.5,
  },
  infoTitle: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  infoSpeed: {
    color: "#FFB800",
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 4,
  },
});

