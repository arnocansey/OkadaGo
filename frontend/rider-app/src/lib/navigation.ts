import { Linking, Platform } from "react-native";

export function openGoogleMapsNavigation(latitude: number, longitude: number, label?: string) {
  const destination = `${latitude},${longitude}`;
  const query = label ? encodeURIComponent(label) : destination;
  const url =
    Platform.OS === "ios"
      ? `comgooglemaps://?daddr=${destination}&directionsmode=driving`
      : `google.navigation:q=${destination}`;
  const fallback = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving&destination_place_id=${query}`;

  Linking.canOpenURL(url)
    .then((supported) => Linking.openURL(supported ? url : fallback))
    .catch(() => Linking.openURL(fallback));
}

export function openWazeNavigation(latitude: number, longitude: number) {
  const url = `waze://?ll=${latitude},${longitude}&navigate=yes`;
  const fallback = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;

  Linking.canOpenURL(url)
    .then((supported) => Linking.openURL(supported ? url : fallback))
    .catch(() => Linking.openURL(fallback));
}
