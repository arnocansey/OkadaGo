const appJson = require("./app.json");

const projectId =
  process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
  process.env.EAS_PROJECT_ID ||
  "94c07182-c892-4106-8b44-3a4ebc25f853";
const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || "https://okadago-backend.onrender.com/v1";
const mapboxAccessToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || "";
const mapboxStyleUrl = process.env.EXPO_PUBLIC_MAPBOX_STYLE_URL || "mapbox://styles/mapbox/streets-v11";
const updatesEnabled = process.env.EXPO_USE_UPDATES === "1";

module.exports = {
  ...appJson.expo,
  runtimeVersion: {
    policy: "appVersion"
  },
  updates: {
    enabled: updatesEnabled,
    checkAutomatically: "ON_LOAD",
    fallbackToCacheTimeout: 0,
    ...(updatesEnabled && projectId ? { url: `https://u.expo.dev/${projectId}` } : {})
  },
  extra: {
    ...(appJson.expo.extra || {}),
    apiBaseUrl,
    mapboxAccessToken,
    mapboxStyleUrl,
    ...(projectId
      ? {
          eas: {
            projectId
          }
        }
      : {})
  }
};
