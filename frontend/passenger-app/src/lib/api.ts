import { Platform } from "react-native";
import Constants from "expo-constants";

export function getApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  // 1. Explicit remote production URL (e.g. Render, Railway, custom domain)
  if (envUrl && envUrl.startsWith("https://")) {
    return envUrl;
  }

  // 2. Web browser: dynamically use the current browser hostname
  if (Platform.OS === "web" && typeof window !== "undefined" && window.location?.hostname) {
    const hostname = window.location.hostname || "localhost";
    return `http://${hostname}:4000/v1`;
  }

  // 3. Expo Go on physical device: auto-detect computer LAN IP from Metro host URI
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as unknown as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost;
  if (hostUri) {
    const hostIp = hostUri.split(":")[0];
    if (hostIp) {
      return `http://${hostIp}:4000/v1`;
    }
  }

  // 4. Android emulator fallback
  if (Platform.OS === "android") {
    return "http://10.0.2.2:4000/v1";
  }

  return envUrl ?? "http://localhost:4000/v1";
}

export const API_BASE_URL = getApiBaseUrl();

export async function api<T>(
  path: string,
  options: { method?: string; token?: string; body?: unknown } = {},
) {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let payload: unknown = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { message: text || "The server returned an unreadable response." };
  }

  if (!response.ok) {
    const err = payload as {
      message?: string;
      error?: string;
      details?: { suggestion?: string };
    };
    const base = err?.message ?? err?.error ?? `Request failed with ${response.status}`;
    throw new Error(err.details?.suggestion ? `${base} ${err.details.suggestion}` : base);
  }

  return payload as T;
}

export function phoneParts(raw: string) {
  const digits = raw.replace(/\D/g, "");
  const local = digits.startsWith("233") ? digits.slice(3) : digits.startsWith("0") ? digits.slice(1) : digits;
  return {
    phoneCountryCode: "+233",
    phoneLocal: local,
    phoneE164: `+233${local}`,
  };
}

export function money(value: unknown, currency = "GHS") {
  let num = 0;
  if (typeof value === "number") {
    num = value;
  } else if (typeof value === "string") {
    num = Number.parseFloat(value);
  } else if (value && typeof value === "object") {
    if ("toNumber" in value && typeof (value as { toNumber: () => number }).toNumber === "function") {
      num = (value as { toNumber: () => number }).toNumber();
    } else if ("amount" in value) {
      num = Number((value as { amount: unknown }).amount);
    } else {
      num = Number(String(value));
    }
  }
  if (!Number.isFinite(num)) num = 0;
  return `${currency} ${num.toFixed(2)}`;
}

export function compactDate(value?: string) {
  if (!value) return "Recent";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Reserved for GET /merchants/nearby when backend support lands. */
export type NearbyMerchant = {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  deliveryFee: number;
  address: string;
  latitude: number;
  longitude: number;
  categoryIds: string[];
  distanceKm?: number;
  etaMin?: number;
};

export type AuthResponse = {
  token: string;
  expiresAt: string;
  user: {
    id: string;
    role: string;
    fullName: string;
    email?: string | null;
    phoneE164: string;
    phoneLocal: string;
    preferredCurrency: "GHS" | "NGN";
    isPhoneVerified?: boolean;
    avatarUrl?: string | null;
    passengerProfileId?: string | null;
    riderProfileId?: string | null;
    riderApprovalStatus?: string | null;
    accountStatus?: string;
  };
};
