import type { AdminConsoleScreen } from "./types";

/** Data domains the admin console can fetch. */
export type AdminQueryNeed =
  | "rides"
  | "deliveries"
  | "riders"
  | "passengers"
  | "userStats"
  | "walletTx"
  | "payout"
  | "ratings"
  | "incidents"
  | "adminAccounts"
  | "adminPermissions"
  | "adminModules"
  | "zones"
  | "auditLogs"
  | "supportTickets"
  | "escalationRules"
  | "scheduledBroadcasts"
  | "opsJobStatus"
  | "riderDocuments"
  | "platformSettings"
  | "liveStream";

/** Always fetched so shell badges stay roughly honest without loading every domain. */
const SHELL_NEEDS: AdminQueryNeed[] = [
  "rides",
  "deliveries",
  "riders",
  "userStats",
  "incidents"
];

const SCREEN_EXTRA: Record<AdminConsoleScreen, AdminQueryNeed[]> = {
  dashboard: ["liveStream", "zones"],
  rides: [],
  deliveries: [],
  riders: ["liveStream", "zones"],
  riderVerification: ["riderDocuments"],
  riderDocuments: ["riderDocuments"],
  riderPerformance: ["ratings", "walletTx", "payout"],
  riderEarnings: ["walletTx", "payout", "ratings"],
  riderWallet: ["walletTx", "payout"],
  riderPayouts: ["walletTx", "payout"],
  riderComplaints: ["adminAccounts"],
  riderActivity: ["liveStream", "walletTx", "payout", "ratings"],
  riderSuspensions: ["auditLogs"],
  passengers: ["passengers"],
  payments: ["walletTx", "payout"],
  ratings: ["ratings"],
  promotions: ["zones"],
  zones: ["zones"],
  supportTickets: ["supportTickets"],
  sosIncidents: ["liveStream"],
  notifications: ["scheduledBroadcasts", "opsJobStatus"],
  reports: ["passengers", "ratings", "walletTx"],
  auditLogs: ["auditLogs", "adminAccounts"],
  settings: [
    "zones",
    "adminAccounts",
    "adminPermissions",
    "adminModules",
    "auditLogs",
    "platformSettings"
  ],
  paymentMethods: [],
  integrations: [],
  taxesCompliance: ["platformSettings"],
  settingsNotifications: ["scheduledBroadcasts"],
  admins: ["adminAccounts", "adminPermissions", "passengers"],
  escalationRules: ["escalationRules"]
};

export function needsForScreen(screen: AdminConsoleScreen): Set<AdminQueryNeed> {
  const set = new Set<AdminQueryNeed>(SHELL_NEEDS);
  for (const need of SCREEN_EXTRA[screen] ?? []) {
    set.add(need);
  }
  return set;
}

export function screenNeeds(need: AdminQueryNeed, screen: AdminConsoleScreen): boolean {
  return needsForScreen(screen).has(need);
}
