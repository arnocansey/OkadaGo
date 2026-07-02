import Constants from "expo-constants";
import { useEffect } from "react";
import { Platform } from "react-native";
import { api } from "@/lib/api";

async function registerPushToken(authToken: string) {
  const deviceId =
    Constants.installationId ?? Constants.sessionId ?? `passenger-${Platform.OS}-${Date.now()}`;

  let pushToken = deviceId;

  try {
    const Notifications = require("expo-notifications") as {
      getPermissionsAsync: () => Promise<{ status: string }>;
      requestPermissionsAsync: () => Promise<{ status: string }>;
      getExpoPushTokenAsync: () => Promise<{ data: string }>;
    };
    const { status: existing } = await Notifications.getPermissionsAsync();
    const status =
      existing === "granted" ? existing : (await Notifications.requestPermissionsAsync()).status;

    if (status === "granted") {
      const tokenData = await Notifications.getExpoPushTokenAsync();
      pushToken = tokenData.data;
    }
  } catch {
    // Expo push unavailable in dev/simulator — still register device id.
  }

  await api("/devices/push-token", {
    method: "POST",
    token: authToken,
    body: {
      deviceId,
      platform: Platform.OS,
      pushToken,
      appVersion: Constants.expoConfig?.version,
    },
  });
}

export function usePushRegistration(authToken?: string | null) {
  useEffect(() => {
    if (!authToken) return;
    registerPushToken(authToken).catch(() => undefined);
  }, [authToken]);
}
