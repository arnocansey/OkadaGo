import { prisma } from "../../common/prisma.js";

/**
 * Rider notification configuration stored in PlatformSetting table.
 * Keys follow the pattern: rider_request_*
 */
const CONFIG_KEYS = {
  SOUNDS_ENABLED: "rider_request_sounds_enabled",
  VIBRATION_ENABLED: "rider_request_vibration_enabled",
  TIMEOUT_SECONDS: "rider_request_timeout_seconds",
  SOUND_NAME: "rider_request_sound",
  CRITICAL_PRIORITY: "rider_critical_notifications",
} as const;

export type RiderNotificationConfig = {
  soundsEnabled: boolean;
  vibrationEnabled: boolean;
  timeoutSeconds: number;
  soundName: string;
  criticalPriority: boolean;
};

const DEFAULTS: RiderNotificationConfig = {
  soundsEnabled: true,
  vibrationEnabled: true,
  timeoutSeconds: 10,
  soundName: "ride_request",
  criticalPriority: true,
};

/**
 * Fetch rider notification configuration from the database.
 * Falls back to defaults if settings are not configured.
 */
export async function getRiderNotificationConfig(): Promise<RiderNotificationConfig> {
  try {
    const rows = await prisma.platformSetting.findMany({
      where: {
        key: {
          in: Object.values(CONFIG_KEYS),
        },
      },
    });

    const map = new Map(rows.map((r) => [r.key, r.value]));

    return {
      soundsEnabled: parseBool(map.get(CONFIG_KEYS.SOUNDS_ENABLED), DEFAULTS.soundsEnabled),
      vibrationEnabled: parseBool(map.get(CONFIG_KEYS.VIBRATION_ENABLED), DEFAULTS.vibrationEnabled),
      timeoutSeconds: parseNumber(map.get(CONFIG_KEYS.TIMEOUT_SECONDS), DEFAULTS.timeoutSeconds),
      soundName: parseString(map.get(CONFIG_KEYS.SOUND_NAME), DEFAULTS.soundName),
      criticalPriority: parseBool(map.get(CONFIG_KEYS.CRITICAL_PRIORITY), DEFAULTS.criticalPriority),
    };
  } catch {
    return { ...DEFAULTS };
  }
}

function parseBool(val: unknown, fallback: boolean): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") return val === "true";
  return fallback;
}

function parseNumber(val: unknown, fallback: number): number {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const n = parseInt(val, 10);
    if (!isNaN(n) && n > 0 && n <= 60) return n;
  }
  return fallback;
}

function parseString(val: unknown, fallback: string): string {
  if (typeof val === "string" && val.length > 0) return val;
  return fallback;
}
