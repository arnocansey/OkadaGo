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
 * Top-Down 3D Sports Motorcycle Marker for React Native Maps in Rider App.
 * High-resolution bird's-eye motorcycle asset oriented North (0°).
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
  const width = isSelected ? 42 : 34;
  const height = isSelected ? 101 : 82;
  const showBadge = Boolean(title || etaLabel);
  const rotation = disableRotation ? 0 : heading;

  return (
    <View style={styles.container}>
      {showBadge && (
        <View style={[styles.infoBubble, isSelected && styles.infoBubbleSelected]}>
          <Text style={styles.infoTitle}>{etaLabel || title}</Text>
          {speed !== undefined && speed > 2 && (
            <Text style={styles.infoSpeed}>{Math.round(speed)} km/h</Text>
          )}
        </View>
      )}

      <View
        style={[
          styles.bikeWrapper,
          {
            width,
            height,
            transform: rotation ? [{ rotate: `${rotation}deg` }] : undefined,
          },
        ]}
      >
        {isSelected && (
          <View
            style={[
              styles.selectionGlow,
              {
                width: width * 1.5,
                height: height * 0.9,
                backgroundColor: pinColor,
              },
            ]}
          />
        )}

        <View
          style={[
            styles.groundShadow,
            {
              width: width * 0.72,
              height: height * 0.9,
            },
          ]}
        />

        <Image
          source={motorcycleImage}
          style={{ width, height }}
          resizeMode="contain"
          accessibilityLabel="OkadaGo Motorcycle"
        />

        {isMoving && (
          <View style={[styles.exhaustTrail, { right: width * 0.12, bottom: -2 }]} />
        )}
      </View>
    </View>
  );
}

/**
 * Generates Leaflet HTML string for Rider App Web.
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
  const width = isSelected ? 42 : 34;
  const height = isSelected ? 101 : 82;
  const pinColor = options.pinColor || "#FF6A00";

  return `
    <div class="okada-moto-marker-wrap ${isSelected ? "selected-rider" : ""}" style="position: relative; width: ${width}px; height: ${height}px; display: flex; align-items: center; justify-content: center; pointer-events: auto; background: transparent !important; border: none !important;">
      <div class="okada-moto-rotator" style="width: ${width}px; height: ${height}px; background: transparent; border: none; outline: none; box-shadow: none; display: flex; align-items: center; justify-content: center; transform: rotate(${heading}deg); transform-origin: 50% 50%; will-change: transform; transition: transform 0.2s linear;">
        ${isSelected ? `<div style="position: absolute; width: ${width * 1.5}px; height: ${height * 0.9}px; border-radius: 50%; background: ${pinColor}; opacity: 0.35; filter: blur(4px); pointer-events: none;"></div>` : ""}
        <div style="position: absolute; width: ${width * 0.72}px; height: ${height * 0.9}px; border-radius: 50%; background: rgba(0,0,0,0.35); filter: blur(3px); pointer-events: none;"></div>
        <img src="${MOTORCYCLE_MARKER_BASE64}" width="${width}" height="${height}" alt="OkadaGo" style="display: block; width: ${width}px; height: ${height}px; object-fit: contain; filter: drop-shadow(0 3px 5px rgba(0,0,0,0.4));" />
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
  groundShadow: {
    position: "absolute",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    borderRadius: 999,
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
    top: -32,
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
