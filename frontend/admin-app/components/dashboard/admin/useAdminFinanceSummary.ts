"use client";

import { useQuery } from "@tanstack/react-query";

import { requestJson } from "@/lib/api";
import { QK } from "./adminQueryKeys";

export type AdminFinanceSummary = {
  generatedAt: string;
  range: { from: string; to: string };
  revenue: { rides: number; deliveries: number; total: number };
  commission: { rides: number; deliveries: number; total: number };
  riderEarningsTotal: number;
  payouts: {
    paidOutflow: number;
    paidCount: number;
    pendingValue: number;
    pendingCount: number;
  };
  wallet: {
    postedVolume: number;
    postedCount: number;
    pendingCount: number;
    failedCount: number;
    lockedBalance: number;
    availableBalance: number;
  };
  platformNetProfit: number;
  profitMargin: number;
  paymentMethods: [string, number][];
  daily: Array<{
    key: string;
    revenue: number;
    commission: number;
    riderEarnings: number;
    rides: number;
    deliveries: number;
    payouts: number;
  }>;
  topRiders: Array<{
    riderId: string;
    name: string;
    displayCode: string;
    completedCount: number;
    revenue: number;
    commission: number;
    earnings: number;
    averageRating: number;
    ratingCount: number;
    payoutTotal: number;
  }>;
};

export function useAdminFinanceSummary(opts: {
  enabled: boolean;
  token: string | null | undefined;
  from?: string;
  to?: string;
  refetchInterval?: number | false;
}) {
  const { enabled, token, from = "", to = "", refetchInterval = false } = opts;

  return useQuery<AdminFinanceSummary>({
    queryKey: [...QK.financeSummary, from, to],
    queryFn: () => {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const qs = params.toString();
      return requestJson(`/admin/finance-summary${qs ? `?${qs}` : ""}`, { token: token! });
    },
    enabled: Boolean(enabled && token),
    refetchInterval,
    staleTime: 25_000
  });
}
