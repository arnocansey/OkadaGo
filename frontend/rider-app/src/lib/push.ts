import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { api } from "@/lib/api";

const DEVICE_ID_KEY = "okadago.rider.deviceId";
const PUSH_ENABLED_KEY = "okadago.rider.pushEnabled";

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
  const next = `rider-${Platform.OS}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem(DEVICE_ID_KEY, next);
  return next;
}

export async function getPushEnabled() {
  const value = await AsyncStorage.getItem(PUSH_ENABLED_KEY);
  return value !== "false";
}

export async function setPushEnabled(enabled: boolean) {
  await AsyncStorage.setItem(PUSH_ENABLED_KEY, enabled ? "true" : "false");
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
      Notifications.setNotificationChannelAsync("ride-alerts", {
        name: "Ride & Delivery Alerts",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 800, 300, 800],
        lightColor: "#FF6A00",
        sound: "ride_request.wav",
        enableVibrate: true,
        enableLights: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
      }).catch(() => undefined);

      Notifications.setNotificationChannelAsync("ride-requests", {
        name: "Incoming Ride Requests",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 800, 300, 800],
        lightColor: "#FF6A00",
        sound: "ride_request.wav",
        enableVibrate: true,
        enableLights: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
      }).catch(() => undefined);

      Notifications.setNotificationChannelAsync("general", {
        name: "General Notifications",
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: "#FF6A00",
        sound: "default",
        enableVibrate: true,
        enableLights: false,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: false,
      }).catch(() => undefined);
    }
  } catch {
    // expo-notifications unavailable in some environments
  }
}

export async function registerPushToken(authToken: string) {
  const enabled = await getPushEnabled();
  if (!enabled) return { ok: false as const, reason: "disabled" as const };

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

export function riderPathForNotificationData(data?: NotificationData | null) {
  if (!data) return "/notifications";
  if (typeof data.rideId === "string" && data.rideId) {
    if (data.type === "ride_assigned" || data.type === "ride_offer" || data.offerId) {
      const offerParam = data.offerId ? `&offerId=${data.offerId}` : "";
      const expiresParam = data.expiresIn ? `&expiresIn=${data.expiresIn}` : "";
      return `/request/${data.rideId}?kind=ride${offerParam}${expiresParam}`;
    }
    return `/trip/${data.rideId}`;
  }
  if (typeof data.deliveryId === "string" && data.deliveryId) {
    if (data.type === "delivery_status" && data.status === "SEARCHING") {
      return `/request/${data.deliveryId}?kind=delivery`;
    }
    return `/trip/${data.deliveryId}`;
  }
  return "/notifications";
}
