import React from "react";
import { StyleSheet, View, Text, Image } from "react-native";
import { MOTORCYCLE_MARKER_BASE64 } from "./motorcycleMarkerAsset";

export interface MotorcycleMarkerProps {
  heading?: number;
  isSelected?: boolean;
  isMoving?: boolean;
  pinColor?: string;
  title?: string;
  speed?: number;
  etaLabel?: string;
  disableRotation?: boolean;
}

const motorcycleImage = require("../../assets/map/motorcycle-marker.png");

/**
 * Top-Down 3D Sports Motorcycle Marker for React Native Maps.
 * Uses high-resolution bird's-eye motorcycle asset.
 * Oriented North (0°) by default so rotation directly matches GPS heading.
 */
export function MotorcycleMarker({
  heading = 0,
  isSelected = false,
  isMoving = false,
  pinColor = "#FF6A00",
  title,
  speed,
  etaLabel,
  disableRotation = false,
}: MotorcycleMarkerProps) {
  const size = isSelected ? 54 : 44;
  const showBadge = Boolean(title || etaLabel);
  const rotation = disableRotation ? 0 : heading;

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
            width: size,
            height: size,
            transform: rotation ? [{ rotate: `${rotation}deg` }] : undefined,
          },
        ]}
      >
        {/* Selection Road Glow */}
        {isSelected && (
          <View
            style={[
              styles.selectionGlow,
              {
                width: size * 0.9,
                height: size * 0.9,
                backgroundColor: pinColor,
              },
            ]}
          />
        )}

        {/* High-Res Top-Down OkadaGo Motorcycle - Full unclipped original picture */}
        <Image
          source={motorcycleImage}
          style={{ width: size, height: size }}
          resizeMode="contain"
          accessibilityLabel="OkadaGo Motorcycle"
        />

        {/* Moving Exhaust Distortion */}
        {isMoving && (
          <View style={[styles.exhaustTrail, { right: size * 0.38, bottom: size * 0.08 }]} />
        )}
      </View>
    </View>
  );
}

/**
 * Generates an SVG string representation of the true top-down Okada motorcycle for Leaflet Web.
 */
export function getMotorcycleSvgString(options: {
  size?: number;
  isSelected?: boolean;
  pinColor?: string;
  isMoving?: boolean;
}): string {
  const isSelected = Boolean(options.isSelected);
  const size = options.size ? options.size : isSelected ? 54 : 44;
  const color = options.pinColor || "#FF6A00";

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; overflow: visible;">
      <defs>
        <filter id="bikeGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000000" flood-opacity="0.4"/>
        </filter>
      </defs>
      ${isSelected ? `<circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.45}" fill="${color}" fill-opacity="0.3"/>` : ""}
      <image href="${MOTORCYCLE_MARKER_BASE64}" width="${size}" height="${size}" x="0" y="0" preserveAspectRatio="xMidYMid meet" filter="url(#bikeGlow)" />
    </svg>
  `;
}

/**
 * Creates Leaflet HTML string with rotation and floating badges.
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
  const size = isSelected ? 54 : 44;
  const pinColor = options.pinColor || "#FF6A00";

  const badgeHtml = options.etaMinutes
    ? `<div style="position: absolute; top: -28px; white-space: nowrap; background: #0F172A; color: #FFFFFF; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 999px; border: 1.5px solid ${pinColor}; box-shadow: 0 4px 12px rgba(0,0,0,0.6); display: flex; align-items: center; gap: 4px; pointer-events: none; z-index: 10;">
        <span>~${Math.round(options.etaMinutes)} min</span>
        ${options.speed ? `<span style="color: ${pinColor}; font-weight: 600;">· ${Math.round(options.speed)} km/h</span>` : ""}
      </div>`
    : options.title && options.title !== "Okada" && options.title !== "Rider"
    ? `<div style="position: absolute; top: -24px; white-space: nowrap; background: rgba(15,23,42,0.92); color: #FFFFFF; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.25); box-shadow: 0 4px 10px rgba(0,0,0,0.5); pointer-events: none; z-index: 10;">
        ${options.title}
      </div>`
    : "";

  return `
    <div class="okada-moto-marker-wrap ${isSelected ? "selected-rider" : ""}" style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; pointer-events: auto; background: transparent !important; border: none !important;">
      ${badgeHtml}
      <div class="okada-moto-rotator" style="width: ${size}px; height: ${size}px; background: transparent; border: none; outline: none; box-shadow: none; display: flex; align-items: center; justify-content: center; transform: rotate(${heading}deg); transform-origin: 50% 50%; will-change: transform; transition: transform 0.2s linear;">
        ${isSelected ? `<div style="position: absolute; width: ${size * 0.9}px; height: ${size * 0.9}px; border-radius: 50%; background: ${pinColor}; opacity: 0.35; filter: blur(4px); pointer-events: none;"></div>` : ""}
        <img src="${MOTORCYCLE_MARKER_BASE64}" width="${size}" height="${size}" alt="OkadaGo" style="display: block; width: ${size}px; height: ${size}px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.45));" />
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
    position: "relative",
    backgroundColor: "transparent",
  },
  selectionGlow: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.35,
  },
  exhaustTrail: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
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
    borderColor: "#FF6A00",
    borderWidth: 1.5,
  },
  infoTitle: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  infoSpeed: {
    color: "#FF6A00",
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 4,
  },
});
