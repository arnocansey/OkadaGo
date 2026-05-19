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
  let payload: any = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { message: text || "The server returned an unreadable response." };
  }

  if (!response.ok) {
    throw new Error(payload?.message ?? payload?.error ?? `Request failed with ${response.status}`);
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

export function money(value: string | number | null | undefined, currency = "GHS") {
  const amount = Number(value ?? 0);
  return `${currency} ${amount.toFixed(2)}`;
}

export function compactDate(value?: string) {
  if (!value) return "Recent";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
