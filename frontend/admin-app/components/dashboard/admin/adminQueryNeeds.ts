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
  | "promoCodes"
  | "goPoints"
  | "messageTemplates"
  | "liveStream";

/** Shell badges + dashboard KPIs — one aggregate, not sample list pages. */
const SHELL_NEEDS: AdminQueryNeed[] = ["opsSummary"];

const SCREEN_EXTRA: Record<AdminConsoleScreen, AdminQueryNeed[]> = {
  dashboard: ["liveStream", "zones"],
  liveOperations: ["liveStream", "zones", "rides", "riders"],
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
  revenue: ["financeSummary", "walletTx", "payout"],
  transactions: ["walletTx"],
  payouts: ["walletTx", "payout", "riders"],
  pricing: ["zones", "rides"],
  dynamicPricing: ["zones", "rides", "riders"],
  ratings: ["ratings"],
  promotions: ["rides", "zones"],
  promoManagement: ["rides", "zones", "promoCodes"],
  referrals: ["rides", "zones", "promoCodes"],
  goPoints: ["goPoints"],
  wallet: ["walletTx", "payout"],
  zones: ["zones", "riders", "rides"],
  supportTickets: ["supportTickets"],
  messageTemplates: ["messageTemplates"],
  sosIncidents: ["incidents", "liveStream", "adminAccounts"],
  safetyCenter: ["incidents", "escalationRules", "riders"],
  analytics: ["financeSummary", "rides", "deliveries", "riders"],
  notifications: ["scheduledBroadcasts", "opsJobStatus"],
  reports: ["financeSummary"],
  auditLogs: ["auditLogs", "adminAccounts"],
  settings: ["platformSettings"],
  companyProfile: ["platformSettings", "userStats", "adminAccounts"],
  accountSecurity: ["platformSettings"],
  notificationSettings: ["platformSettings"],
  paymentMethods: ["walletTx", "platformSettings"],
  integrations: [],
  taxesCompliance: ["platformSettings"],
  settingsNotifications: ["scheduledBroadcasts"],
  admins: ["adminAccounts", "adminPermissions", "passengers"],
  rolesPermissions: ["adminAccounts", "adminPermissions"],
  escalationRules: ["escalationRules"],
  refunds: ["walletTx", "rides", "deliveries"]
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
