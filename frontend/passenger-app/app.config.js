const appJson = require("./app.json");

const projectId =
  process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
  process.env.EAS_PROJECT_ID ||
  "94c07182-c892-4106-8b44-3a4ebc25f853";
const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || "https://okadago-backend.onrender.com/v1";
const updatesEnabled = process.env.EXPO_USE_UPDATES === "1";

module.exports = {
  ...appJson.expo,
  android: {
    ...appJson.expo.android,
    config: {
      ...(appJson.expo.android?.config || {}),
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY || "",
      },
    },
  },
  ios: {
    ...appJson.expo.ios,
    config: {
      ...(appJson.expo.ios?.config || {}),
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY || "",
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
