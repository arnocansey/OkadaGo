import React from "react";
import { StyleSheet, View, Text } from "react-native";
import Svg, { Circle, Path, Rect, G } from "react-native-svg";

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
 * Top-down directional Okada motorcycle SVG for React Native maps.
 * Oriented North (0°) by default so rotation matches GPS bearing directly.
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
  const size = isSelected ? 46 : 36;
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

      {/* Outer Pulse Glow when Moving or Selected */}
      {isSelected && <View style={[styles.radarPulse, { borderColor: pinColor }]} />}

      {/* Rotating Motorcycle Chassis */}
      <View
        style={[
          styles.bikeWrapper,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: isSelected ? "#0F172A" : pinColor,
            borderColor: isSelected ? pinColor : "#000000",
            borderWidth: isSelected ? 2.5 : 2,
            transform: [{ rotate: `${heading}deg` }],
          },
        ]}
      >
        <Svg width={size * 0.7} height={size * 0.7} viewBox="0 0 32 32" fill="none">
          {/* Front Wheel (Pointing North) */}
          <Rect x="14" y="2" width="4" height="7" rx="2" fill="#1E293B" stroke="#000000" strokeWidth="1" />

          {/* Front Fork & Handlebars */}
          <Path d="M9 9H23" stroke="#334155" strokeWidth="2.2" strokeLinecap="round" />
          {/* Side Mirrors */}
          <Circle cx="8" cy="8" r="1.5" fill="#64748B" />
          <Circle cx="24" cy="8" r="1.5" fill="#64748B" />

          {/* Headlight Beam */}
          <Path d="M14 3L11 0M18 3L21 0" stroke={pinColor} strokeWidth="1.2" strokeLinecap="round" />

          {/* Motorcycle Fuel Tank */}
          <Path
            d="M13 10C13 9.4 13.6 9 14.5 9H17.5C18.4 9 19 9.4 19 10L18.5 15H13.5L13 10Z"
            fill={isSelected ? pinColor : "#000000"}
          />

          {/* Rider Helmet (Top-Down Oval) */}
          <Circle cx="16" cy="17" r="4.5" fill="#FACC15" stroke="#000000" strokeWidth="1.5" />
          {/* Helmet Visor */}
          <Path d="M13.5 15.5C14.5 14.5 17.5 14.5 18.5 15.5" stroke="#000000" strokeWidth="1.8" strokeLinecap="round" />

          {/* Motorcycle Seat */}
          <Rect x="13" y="21" width="6" height="5" rx="1.5" fill="#1E293B" />

          {/* Rear Wheel & Tail Fender */}
          <Rect x="14" y="25" width="4" height="6" rx="2" fill="#1E293B" stroke="#000000" strokeWidth="1" />
          <Rect x="14.5" y="24" width="3" height="1.5" rx="0.5" fill="#EF4444" />

          {/* Dual Exhaust Pipes */}
          <Path d="M11 22L10.5 28" stroke="#475569" strokeWidth="1.4" strokeLinecap="round" />
          <Path d="M21 22L21.5 28" stroke="#475569" strokeWidth="1.4" strokeLinecap="round" />

          {/* Moving Exhaust Particles (when active) */}
          {isMoving && (
            <G opacity="0.6">
              <Circle cx="10" cy="30" r="1" fill="#94A3B8" />
              <Circle cx="22" cy="30" r="1" fill="#94A3B8" />
            </G>
          )}
        </Svg>
      </View>
    </View>
  );
}

/**
 * Generates an SVG string representation of the directional Okada motorcycle for Leaflet Web.
 */
export function getMotorcycleSvgString(options: {
  size?: number;
  isSelected?: boolean;
  pinColor?: string;
  isMoving?: boolean;
}): string {
  const size = options.size || (options.isSelected ? 44 : 34);
  const color = options.pinColor || "#FFB800";
  const isSelected = Boolean(options.isSelected);

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Front Wheel -->
      <rect x="14" y="2" width="4" height="7" rx="2" fill="#1E293B" stroke="#000000" stroke-width="1"/>
      
      <!-- Handlebars & Mirrors -->
      <path d="M8 9H24" stroke="#334155" stroke-width="2.2" stroke-linecap="round"/>
      <circle cx="7" cy="8" r="1.5" fill="#64748B"/>
      <circle cx="25" cy="8" r="1.5" fill="#64748B"/>
      
      <!-- Headlight Glow -->
      <path d="M14 2L11 -1M18 2L21 -1" stroke="${color}" stroke-width="1.4" stroke-linecap="round"/>
      
      <!-- Fuel Tank & Chassis -->
      <path d="M13 10C13 9.4 13.6 9 14.5 9H17.5C18.4 9 19 9.4 19 10L18.5 15H13.5L13 10Z" fill="${isSelected ? color : "#000000"}"/>
      
      <!-- Rider Helmet -->
      <circle cx="16" cy="17" r="4.5" fill="#FACC15" stroke="#000000" stroke-width="1.5"/>
      <path d="M13.5 15.5C14.5 14.5 17.5 14.5 18.5 15.5" stroke="#000000" stroke-width="1.8" stroke-linecap="round"/>
      
      <!-- Seat -->
      <rect x="13" y="21" width="6" height="5" rx="1.5" fill="#1E293B"/>
      
      <!-- Rear Wheel & Brake Light -->
      <rect x="14" y="25" width="4" height="6" rx="2" fill="#1E293B" stroke="#000000" stroke-width="1"/>
      <rect x="14.5" y="24" width="3" height="1.5" rx="0.5" fill="#EF4444"/>
      
      <!-- Exhausts -->
      <path d="M11 22L10.5 28" stroke="#475569" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M21 22L21.5 28" stroke="#475569" stroke-width="1.4" stroke-linecap="round"/>
    </svg>
  `;
}

/**
 * Creates Leaflet HTML string with rotation and optional badges.
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
  const size = isSelected ? 44 : 34;
  const pinColor = options.pinColor || "#FFB800";
  const svg = getMotorcycleSvgString({ size: size * 0.72, isSelected, pinColor, isMoving: options.isMoving });

  const badgeHtml = options.etaMinutes
    ? `<div style="position: absolute; top: -26px; white-space: nowrap; background: #0F172A; color: #FFFFFF; font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 999px; border: 1.5px solid ${pinColor}; box-shadow: 0 4px 10px rgba(0,0,0,0.5); display: flex; align-items: center; gap: 4px;">
        <span>~${Math.round(options.etaMinutes)} min</span>
        ${options.speed ? `<span style="color: ${pinColor}; font-weight: 600;">· ${Math.round(options.speed)} km/h</span>` : ""}
      </div>`
    : options.title && options.title !== "Okada" && options.title !== "Rider"
    ? `<div style="position: absolute; top: -22px; white-space: nowrap; background: rgba(15,23,42,0.9); color: #FFFFFF; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2);">
        ${options.title}
      </div>`
    : "";

  return `
    <div class="okada-moto-marker-wrap ${isSelected ? "selected-rider" : ""}" style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; pointer-events: auto;">
      ${badgeHtml}
      ${isSelected ? `<div class="okada-radar-pulse" style="position: absolute; width: ${size + 16}px; height: ${size + 16}px; border-radius: 50%; border: 2px solid ${pinColor}; opacity: 0.8; animation: okadaPulse 1.8s infinite ease-out;"></div>` : ""}
      <div class="okada-moto-rotator" style="width: ${size}px; height: ${size}px; border-radius: 50%; background: ${isSelected ? "#0F172A" : pinColor}; border: ${isSelected ? "2.5px" : "2px"} solid ${isSelected ? pinColor : "#000000"}; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.45); transform: rotate(${heading}deg); will-change: transform; transition: transform 0.2s linear;">
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
  },
  bikeWrapper: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
  },
  radarPulse: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    opacity: 0.6,
  },
  infoBubble: {
    position: "absolute",
    top: -28,
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
