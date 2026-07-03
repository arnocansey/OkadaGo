const appJson = require("./app.json");

const projectId =
  process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
  process.env.EAS_PROJECT_ID ||
  "ae3d1d1a-2ce9-40ec-b4a4-97510377682e";
const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || "https://okadago-backend.onrender.com/v1";
const updatesEnabled = process.env.EXPO_USE_UPDATES === "1";

const PLACEHOLDER_PATTERNS = [/^your-/i, /^<.*>$/, /will-be-overridden/i, /set in \.env/i];

function resolveMapsKey(envName) {
  const value = (process.env[envName] || "").trim();
  const isPlaceholder = !value || PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value));

  if (isPlaceholder && process.env.EAS_BUILD === "true") {
    console.warn(
      `[app.config] ${envName} is missing or a placeholder. Google Maps will be blank in this build. ` +
        "Set the key as an EAS secret for the production environment, or provide a real value in .env.",
    );
  }

  return isPlaceholder ? "" : value;
}

const androidMapsApiKey = resolveMapsKey("EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY");
const iosMapsApiKey = resolveMapsKey("EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY");

module.exports = {
  ...appJson.expo,
  android: {
    ...appJson.expo.android,
    config: {
      ...(appJson.expo.android?.config || {}),
      googleMaps: {
        apiKey: androidMapsApiKey,
      },
    },
  },
  ios: {
    ...appJson.expo.ios,
    config: {
      ...(appJson.expo.ios?.config || {}),
      googleMapsApiKey: iosMapsApiKey,
    },
  },
  runtimeVersion: {
    policy: "appVersion",
  },
  updates: {
    enabled: updatesEnabled,
    checkAutomatically: "ON_LOAD",
    fallbackToCacheTimeout: 0,
    url: `https://u.expo.dev/${projectId}`,
  },
  extra: {
    ...(appJson.expo.extra || {}),
    apiBaseUrl,
    ...(projectId
      ? {
          eas: {
            projectId,
          },
        }
      : {}),
  },
};
