/** Dark map style matching the mobile app (`frontend/passenger-app/src/theme/mapStyle.ts`). */
export const mapDarkStyle = [
  { elementType: "geometry", stylers: [{ color: "#1C1C1E" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8E8E93" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#000000" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#3A3A3C" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#2C2C2E" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1A2E1A" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2C2C2E" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1C1C1E" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3A3A3C" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#2C2C2E" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2C2C2E" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0A0A0A" }] }
];
