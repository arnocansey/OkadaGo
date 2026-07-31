"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { apiUrl } from "@/lib/api";
import { QK } from "./adminQueryKeys";

export type LiveOpsSnapshot = {
  timestamp: string;
  riders: Array<{
    id: string;
    displayCode: string;
    name: string;
    latitude: number;
    longitude: number;
  }>;
  sos: Array<{
    id: string;
    severity: string;
    status: string;
    category: string;
    description: string;
    createdAt: string;
    reporter: { fullName: string; phoneE164: string };
  }>;
};

/** SSE live fleet + SOS — only when the active screen needs it. */
export function useAdminLiveOps(opts: {
  enabled: boolean;
  token: string | null | undefined;
  invalidateIncidents?: boolean;
}) {
  const { enabled, token, invalidateIncidents = false } = opts;
  const queryClient = useQueryClient();
  const [liveSnapshot, setLiveSnapshot] = useState<LiveOpsSnapshot | null>(null);

  useEffect(() => {
    if (!enabled || !token || typeof window === "undefined") {
      setLiveSnapshot(null);
      return;
    }
    const source = new EventSource(apiUrl(`/admin/stream?token=${encodeURIComponent(token)}`));
    source.onmessage = (event) => {
      try {
        setLiveSnapshot(JSON.parse(event.data) as LiveOpsSnapshot);
      } catch {
        // Malformed frame — keep the previous snapshot.
      }
    };
    return () => {
      source.close();
    };
  }, [enabled, token]);

  const liveSos = useMemo(() => liveSnapshot?.sos ?? [], [liveSnapshot]);
  const seenLiveSosIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!invalidateIncidents || liveSos.length === 0) return;
    const fresh = liveSos.filter((s) => !seenLiveSosIds.current.has(s.id));
    if (fresh.length === 0) return;
    for (const s of fresh) seenLiveSosIds.current.add(s.id);
    void queryClient.invalidateQueries({ queryKey: QK.incidents });
    void queryClient.invalidateQueries({ queryKey: QK.opsSummary });
  }, [liveSos, queryClient, invalidateIncidents]);

  return {
    liveSnapshot,
    liveSos,
    liveOpsConnected: Boolean(liveSnapshot),
    liveOpsTimestamp: liveSnapshot?.timestamp ?? null
  };
}
