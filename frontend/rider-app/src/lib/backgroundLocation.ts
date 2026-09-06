import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";

const BACKGROUND_LOCATION_TASK = "okadago-background-location";

/**
 * Define the background location task.
 * This runs even when the app is in background, keeping location
 * streaming active during trips.
 */
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error("[BackgroundLocation] Error:", error.message);
    return;
  }

  const locations = (data as { locations: Location.LocationObject[] })?.locations;
  if (!locations || locations.length === 0) return;

  const location = locations[0];
  if (!location) return;

  // Emit a custom event that the app can listen to
  // The actual WebSocket send happens in the foreground listener
  const event = {
    type: "BACKGROUND_LOCATION_UPDATE" as const,
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    heading: location.coords.heading ?? 0,
    speed: location.coords.speed ?? 0,
    accuracy: location.coords.accuracy ?? 10,
    timestamp: location.timestamp,
  };

  // Broadcast via DeviceEventEmitter
  try {
    const { DeviceEventEmitter } = require("react-native");
    DeviceEventEmitter.emit("backgroundLocationUpdate", event);
  } catch {
    // ignore
  }
});

/**
 * Start background location updates for an active trip.
 */
export async function startBackgroundLocation(): Promise<boolean> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== "granted") return false;

    // Request background permission if not already granted
    const bgStatus = await Location.getBackgroundPermissionsAsync();
    if (bgStatus.status !== "granted") {
      const { status: newBgStatus } = await Location.requestBackgroundPermissionsAsync();
      if (newBgStatus !== "granted") return false;
    }

    const isRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(() => false);
    if (isRunning) return true;

    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.High,
      distanceInterval: 10, // meters
      deferredUpdatesInterval: 5000, // ms
      showsBackgroundLocationIndicator: true, // iOS blue bar
      foregroundService: Platform.OS === "android" ? {
        notificationTitle: "OkadaGo Navigation",
        notificationBody: "Sharing your location during active trip",
        notificationColor: "#FF6A00",
      } : undefined,
    });

    return true;
  } catch (error) {
    console.error("[BackgroundLocation] Failed to start:", error);
    return false;
  }
}

/**
 * Stop background location updates.
 */
export async function stopBackgroundLocation(): Promise<void> {
  try {
    const isRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(() => false);
    if (isRunning) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    }
  } catch {
    // ignore
  }
}

/**
 * Check if background location is currently active.
 */
export async function isBackgroundLocationActive(): Promise<boolean> {
  try {
    return await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  } catch {
    return false;
  }
}
