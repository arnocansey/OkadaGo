import Constants from "expo-constants";
import { Platform } from "react-native";

const PLACEHOLDER_PATTERNS = [
  /^your-/i,
  /^<.*>$/,
  /will-be-overridden/i,
  /set in \.env/i,
];

export function getGoogleMapsApiKey(): string {
  const directKey =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY ||
    process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

  if (directKey) return directKey;

  if (Platform.OS === "android") {
    return (
      process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY ||
      Constants.expoConfig?.android?.config?.googleMaps?.apiKey ||
      ""
    );
  }

  return (
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY ||
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY ||
    Constants.expoConfig?.ios?.config?.googleMapsApiKey ||
    ""
  );
}

export function isGoogleMapsApiKeyConfigured(key: string): boolean {
  const trimmed = key.trim();
  if (!trimmed) return false;
  return !PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export const GOOGLE_MAPS_SETUP_HINT =
  "Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in .env with your Google Maps API key.";
