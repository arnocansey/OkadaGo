import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { api } from "@/lib/api";

const DEVICE_ID_KEY = "okadago.passenger.deviceId";

export type NotificationData = {
  type?: string;
  rideId?: string;
  deliveryId?: string;
  status?: string;
  [key: string]: unknown;
};

function getExpoProjectId() {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId ??
    undefined
  );
}

async function getStableDeviceId() {
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const next = `passenger-${Platform.OS}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem(DEVICE_ID_KEY, next);
  return next;
}

export function configureNotificationHandler() {
  try {
    const Notifications = require("expo-notifications");
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "OkadaGo Updates",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#EAB308",
        sound: "default",
        enableVibrate: true,
        enableLights: true,
      }).catch(() => undefined);
    }
  } catch {
    // expo-notifications unavailable in some environments
  }
}

export async function registerPushToken(authToken: string) {
  const deviceId = await getStableDeviceId();
  let pushToken: string | null = null;

  try {
    const Notifications = require("expo-notifications") as {
      getPermissionsAsync: () => Promise<{ status: string }>;
      requestPermissionsAsync: () => Promise<{ status: string }>;
      getExpoPushTokenAsync: (options?: { projectId?: string }) => Promise<{ data: string }>;
    };
    const { status: existing } = await Notifications.getPermissionsAsync();
    const status =
      existing === "granted" ? existing : (await Notifications.requestPermissionsAsync()).status;

    if (status === "granted") {
      const projectId = getExpoProjectId();
      const tokenData = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined,
      );
      if (tokenData.data?.startsWith("ExponentPushToken")) {
        pushToken = tokenData.data;
      }
    }
  } catch {
    // Expo push unavailable in dev/simulator
  }

  if (!pushToken) return { ok: false as const, reason: "no_expo_token" as const };

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

  return { ok: true as const };
}

export function passengerPathForNotificationData(data?: NotificationData | null) {
  if (!data) return "/notifications";
  if (typeof data.rideId === "string" && data.rideId) {
    return `/ride/track/${data.rideId}`;
  }
  if (typeof data.deliveryId === "string" && data.deliveryId) {
    return "/(main)/trips";
  }
  return "/notifications";
}
