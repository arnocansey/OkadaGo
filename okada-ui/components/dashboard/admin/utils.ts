export function parseNumber(value: string | number | null | undefined): number {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return 0;
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return new Intl.DateTimeFormat("en-GH", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat("en-GH", { dateStyle: "medium" }).format(date);
}

export function statusTone(status: string): string {
  const normalized = status.toLowerCase();
  if (
    ["completed", "delivered", "paid", "captured", "posted", "approved", "valid", "active", "resolved"].includes(
      normalized
    )
  )
    return "success";
  if (
    [
      "searching",
      "assigned",
      "arriving",
      "arrived",
      "started",
      "picked_up",
      "in_transit",
      "pending",
      "requested",
      "reviewing",
      "under review",
      "processing",
      "online"
    ].includes(normalized)
  )
    return "warning";
  if (
    [
      "failed",
      "rejected",
      "cancelled",
      "reversed",
      "missing",
      "expired",
      "blocked",
      "suspended"
    ].includes(normalized)
  )
    return "danger";
  return "neutral";
}

export function formatEnumLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function withQueryString(path: string, entries: Record<string, string>): string {
  const searchParams = new URLSearchParams();
  Object.entries(entries).forEach(([key, value]) => {
    if (value.trim()) searchParams.set(key, value);
  });
  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

export function shortDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GH", { month: "short", day: "numeric" }).format(date);
}
