import Constants from "expo-constants";
import { Platform } from "react-native";

const PLACEHOLDER_PATTERNS = [
  /^your-/i,
  /^<.*>$/,
  /will-be-overridden/i,
  /set in \.env/i,
];

export function getGoogleMapsApiKey(): string {
  if (Platform.OS === "android") {
    return (
      process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY ||
      Constants.expoConfig?.android?.config?.googleMaps?.apiKey ||
      ""
    );
  }

  return (
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY ||
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
  "Set EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY as an EAS secret (production environment), enable Maps SDK for Android on the key, and add the EAS release SHA-1 in Google Cloud Console.";
