export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://okadago-backend.onrender.com/v1";

export async function api<T>(
  path: string,
  options: { method?: string; token?: string; body?: unknown } = {},
) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
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
    const err = payload as { message?: string; error?: string };
    throw new Error(err?.message ?? err?.error ?? `Request failed with ${response.status}`);
  }

  return payload as T;
}

export function phoneParts(raw: string) {
  const digits = raw.replace(/\D/g, "");
  const local = digits.startsWith("233") ? digits.slice(3) : digits.startsWith("0") ? digits.slice(1) : digits;
  return { phoneCountryCode: "+233", phoneLocal: local, phoneE164: `+233${local}` };
}

export function money(value: string | number | null | undefined, currency = "GHS") {
  return `${currency} ${Number(value ?? 0).toFixed(2)}`;
}

export function compactDate(value?: string) {
  if (!value) return "Recent";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function nextRideStatus(status: string) {
  return ({ assigned: "arriving", arriving: "arrived", arrived: "started", started: "completed" } as Record<
    string,
    string | undefined
  >)[status.toLowerCase()];
}

export function nextDeliveryStatus(status: string) {
  return ({ assigned: "picked_up", picked_up: "in_transit", in_transit: "delivered" } as Record<
    string,
    string | undefined
  >)[status.toLowerCase()];
}

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
    passengerProfileId?: string | null;
    riderProfileId?: string | null;
    riderApprovalStatus?: string | null;
    accountStatus?: string;
  };
};
