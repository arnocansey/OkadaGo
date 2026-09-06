import AsyncStorage from "@react-native-async-storage/async-storage";

export const RIDER_REQUEST_SETTINGS_KEY = "@okadago_rider_request_settings";

export type VolumeLevel = "low" | "medium" | "high";

export type RiderRequestSettings = {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  volume: VolumeLevel;
};

export const DEFAULT_REQUEST_SETTINGS: RiderRequestSettings = {
  soundEnabled: true,
  vibrationEnabled: true,
  volume: "high",
};

export const VOLUME_MULTIPLIERS: Record<VolumeLevel, number> = {
  low: 0.35,
  medium: 0.7,
  high: 1.0,
};

export async function loadRequestSettings(): Promise<RiderRequestSettings> {
  try {
    const raw = await AsyncStorage.getItem(RIDER_REQUEST_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        soundEnabled: typeof parsed.soundEnabled === "boolean" ? parsed.soundEnabled : DEFAULT_REQUEST_SETTINGS.soundEnabled,
        vibrationEnabled: typeof parsed.vibrationEnabled === "boolean" ? parsed.vibrationEnabled : DEFAULT_REQUEST_SETTINGS.vibrationEnabled,
        volume: parsed.volume === "low" || parsed.volume === "medium" || parsed.volume === "high" ? parsed.volume : DEFAULT_REQUEST_SETTINGS.volume,
      };
    }
  } catch {
    // fallback to defaults on error
  }
  return { ...DEFAULT_REQUEST_SETTINGS };
}

export async function saveRequestSettings(settings: Partial<RiderRequestSettings>): Promise<RiderRequestSettings> {
  const current = await loadRequestSettings();
  const next: RiderRequestSettings = {
    soundEnabled: typeof settings.soundEnabled === "boolean" ? settings.soundEnabled : current.soundEnabled,
    vibrationEnabled: typeof settings.vibrationEnabled === "boolean" ? settings.vibrationEnabled : current.vibrationEnabled,
    volume: settings.volume ?? current.volume,
  };
  try {
    await AsyncStorage.setItem(RIDER_REQUEST_SETTINGS_KEY, JSON.stringify(next));
  } catch {
    // ignore persistence error
  }
  return next;
}
