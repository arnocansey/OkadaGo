"use client";

import { useQuery } from "@tanstack/react-query";

import { requestJson } from "@/lib/api";
import { QK } from "./adminQueryKeys";

export type AdminOpsSummary = {
  generatedAt: string;
  range: { from: string; to: string };
  rides: {
    active: number;
    completedInRange: number;
    totalInRange: number;
    promoAdjustedInRange: number;
    commissionInRange: number;
  };
  deliveries: {
    active: number;
    completedInRange: number;
    totalInRange: number;
    commissionInRange: number;
  };
  riders: {
    total: number;
    online: number;
    withCoords: number;
    suspended: number;
    pending: number;
    verified: number;
    rejected: number;
    underReview: number;
    withEarnings: number;
  };
  passengers: {
    total: number;
    pending: number;
    verified: number;
  };
  finance: {
    pendingPayoutRequests: number;
    requestedRiderPayouts: number;
    riderWalletTxCount: number;
    commissionInRange: number;
  };
  ratings: { total: number };
  zones: { active: number };
  support: { openTickets: number };
  sos: { open: number };
  incidents: { riderRelated: number };
  documents: { pendingOrMissing: number };
  adminAccounts: { total: number };
  weeklyRides: Array<{ key: string; rides: number; completed: number }>;
  recentActivity: {
    rides: Array<{
      id: string;
      createdAt: string;
      passengerName: string;
      riderName: string | null;
    }>;
    deliveries: Array<{
      id: string;
      createdAt: string;
      passengerName: string;
      recipientName: string;
    }>;
  };
};

export function useAdminOpsSummary(opts: {
  enabled: boolean;
  token: string | null | undefined;
  from?: string;
  to?: string;
  refetchInterval?: number | false;
}) {
  const { enabled, token, from = "", to = "", refetchInterval = false } = opts;

  return useQuery<AdminOpsSummary>({
    queryKey: [...QK.opsSummary, from, to],
    queryFn: () => {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const qs = params.toString();
      return requestJson(`/admin/ops-summary${qs ? `?${qs}` : ""}`, { token: token! });
    },
    enabled: Boolean(enabled && token),
    refetchInterval,
    staleTime: 25_000
  });
}
