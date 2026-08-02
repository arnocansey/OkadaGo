import type { AdminConsoleScreen } from "./types";

/** Data domains the admin console can fetch. */
export type AdminQueryNeed =
  | "opsSummary"
  | "financeSummary"
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

/** Shell badges + dashboard KPIs — one aggregate, not sample list pages. */
const SHELL_NEEDS: AdminQueryNeed[] = ["opsSummary"];

const SCREEN_EXTRA: Record<AdminConsoleScreen, AdminQueryNeed[]> = {
  dashboard: ["liveStream", "zones"],
  rides: ["rides"],
  deliveries: ["deliveries"],
  riders: ["riders", "liveStream", "zones"],
  riderVerification: ["riders", "userStats", "riderDocuments"],
  riderDocuments: ["riderDocuments"],
  riderPerformance: ["financeSummary", "riders", "ratings"],
  riderEarnings: ["financeSummary", "riders"],
  riderWallet: ["walletTx", "payout"],
  riderPayouts: ["walletTx", "payout"],
  riderComplaints: ["incidents", "adminAccounts"],
  riderActivity: ["riders", "liveStream", "rides", "walletTx", "payout", "ratings"],
  riderSuspensions: ["riders", "auditLogs"],
  passengers: ["passengers", "userStats"],
  payments: ["financeSummary", "walletTx", "payout"],
  ratings: ["ratings"],
  promotions: ["rides", "zones"],
  zones: ["zones", "riders", "rides"],
  supportTickets: ["supportTickets"],
  sosIncidents: ["incidents", "liveStream"],
  notifications: ["scheduledBroadcasts", "opsJobStatus"],
  reports: ["financeSummary"],
  auditLogs: ["auditLogs", "adminAccounts"],
  settings: ["platformSettings"],
  companyProfile: ["platformSettings"],
  accountSecurity: ["platformSettings"],
  notificationSettings: ["platformSettings"],
  paymentMethods: ["walletTx"],
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
