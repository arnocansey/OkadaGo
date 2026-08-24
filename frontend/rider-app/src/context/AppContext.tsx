import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import { clearSavedSession, loadSavedSession, saveSession } from "@/lib/session-storage";
import { riderWs } from "@/lib/websocket";
import { usePushRegistration } from "@/hooks/usePushRegistration";
import { useNotificationDeepLinks } from "@/hooks/useNotificationDeepLinks";
import type { Delivery, PayoutRequest, Ride, ServiceZone, Session, Wallet, WalletTransaction } from "@/types";

type AppState = {
  session: Session | null;
  restoring: boolean;
  loading: boolean;
  message: string;
  online: boolean;
  wallets: Wallet[];
  transactions: WalletTransaction[];
  rides: Ride[];
  deliveries: Delivery[];
  zones: ServiceZone[];
  payouts: PayoutRequest[];
  signIn: (session: Session) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateUser: (user: Session["user"]) => Promise<void>;
  setMessage: (message: string) => void;
  toggleOnline: (location?: { latitude: number; longitude: number; isMocked?: boolean }) => Promise<void>;
  setOnline: (value: boolean) => void;
  dismissRequest: (id: string) => void;
  activeRide: Ride | undefined;
  activeDelivery: Delivery | undefined;
  incomingRide: Ride | undefined;
  incomingDelivery: Delivery | undefined;
};

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [online, setOnline] = useState(false);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [zones, setZones] = useState<ServiceZone[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [dismissedRequestIds, setDismissedRequestIds] = useState<string[]>([]);

  const dismissRequest = useCallback((id: string) => {
    if (!id) return;
    setDismissedRequestIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const refresh = useCallback(async (current = session) => {
    if (!current) return;
    setLoading(true);
    setMessage("");
    try {
      const riderProfileId = current.user.riderProfileId;
      const [walletData, txData, ownRideData, searchingRideData, ownDeliveryData, searchingDeliveryData, zoneData, payoutData, riderProfileData] = await Promise.all([
        api<Wallet[]>(`/wallets/users/${current.user.id}`, { token: current.token }),
        api<WalletTransaction[]>(`/wallets/users/${current.user.id}/transactions`, { token: current.token }),
        riderProfileId
          ? api<Ride[]>(`/rides?riderId=${riderProfileId}&limit=100`, { token: current.token }).catch(() => [])
          : Promise.resolve([]),
        api<Ride[]>("/rides?status=searching&limit=50", { token: current.token }).catch(() => []),
        riderProfileId
          ? api<Delivery[]>(`/deliveries?riderId=${riderProfileId}&limit=100`, { token: current.token }).catch(() => [])
          : Promise.resolve([]),
        api<Delivery[]>("/deliveries?status=searching&limit=50", { token: current.token }).catch(() => []),
        api<ServiceZone[]>("/bootstrap/service-zones?limit=30", { token: current.token }),
        api<PayoutRequest[]>("/wallets/rider/payout-requests", { token: current.token }).catch(() => []),
        riderProfileId
          ? api<{ onlineStatus: boolean }>(`/riders/${riderProfileId}`, { token: current.token }).catch(() => null)
          : Promise.resolve(null),
      ]);

      const combinedRides = [
        ...(Array.isArray(ownRideData) ? ownRideData : []),
        ...(Array.isArray(searchingRideData) ? searchingRideData : []),
      ];
      const uniqueRides = Array.from(new Map(combinedRides.map((r) => [r.id, r])).values());

      const combinedDeliveries = [
        ...(Array.isArray(ownDeliveryData) ? ownDeliveryData : []),
        ...(Array.isArray(searchingDeliveryData) ? searchingDeliveryData : []),
      ];
      const uniqueDeliveries = Array.from(new Map(combinedDeliveries.map((d) => [d.id, d])).values());

      setWallets(Array.isArray(walletData) ? walletData : []);
      setTransactions(Array.isArray(txData) ? txData : []);
      setRides(uniqueRides);
      setDeliveries(uniqueDeliveries);
      setZones(Array.isArray(zoneData) ? zoneData : []);
      setPayouts(Array.isArray(payoutData) ? payoutData : []);

      if (riderProfileData && typeof riderProfileData === "object" && "onlineStatus" in riderProfileData) {
        setOnline(Boolean(riderProfileData.onlineStatus));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load rider data.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadSavedSession()
      .then((saved) => {
        if (saved) setSession(saved);
      })
      .catch(() => setMessage("Could not restore your saved session."))
      .finally(() => setRestoring(false));
  }, []);

  useEffect(() => {
    if (session) refresh(session);
  }, [session?.token]);

  useEffect(() => {
    if (!session?.token) return;

    riderWs.connect(session.token).catch(() => undefined);

    const onRideRequest = (data: unknown) => {
      const patch = data as Ride;
      if (!patch || !patch.id) return;
      setRides((prev) => {
        if (prev.some((r) => r.id === patch.id)) {
          return prev.map((r) => (r.id === patch.id ? { ...r, ...patch } : r));
        }
        return [patch, ...prev];
      });
      refresh();
    };

    const onDeliveryRequest = (data: unknown) => {
      const patch = data as Delivery;
      if (!patch || !patch.id) return;
      setDeliveries((prev) => {
        if (prev.some((d) => d.id === patch.id)) {
          return prev.map((d) => (d.id === patch.id ? { ...d, ...patch } : d));
        }
        return [patch, ...prev];
      });
      refresh();
    };

    const onRideUpdate = (data: unknown) => {
      const patch = data as Ride;
      setRides((prev) => prev.map((r) => (r.id === patch.id ? { ...r, ...patch } : r)));
      refresh();
    };

    const onDeliveryUpdate = (data: unknown) => {
      const patch = data as Delivery;
      setDeliveries((prev) => prev.map((d) => (d.id === patch.id ? { ...d, ...patch } : d)));
      refresh();
    };

    riderWs.on("ride:request", onRideRequest);
    riderWs.on("ride:status-update", onRideUpdate);
    riderWs.on("delivery:request", onDeliveryRequest);
    riderWs.on("delivery:status-update", onDeliveryUpdate);
    riderWs.on("ride:assigned", () => refresh());

    return () => riderWs.disconnect();
  }, [session?.token, refresh]);

  usePushRegistration(session?.token);
  useNotificationDeepLinks(Boolean(session?.token));

  const refreshSession = useCallback(async () => {
    if (!session?.token) return;
    const data = await api<{ user: Session["user"] }>("/auth/session", { token: session.token });
    const next = { ...session, user: data.user };
    setSession(next);
    await saveSession(next);
  }, [session]);

  const updateUser = useCallback(async (user: Session["user"]) => {
    setSession((current) => {
      if (!current) return current;
      const next = { ...current, user };
      void saveSession(next);
      return next;
    });
  }, []);

  async function signIn(next: Session) {
    setSession(next);
    await saveSession(next);
  }

  async function signOut() {
    setSession(null);
    setOnline(false);
    await clearSavedSession();
  }

  async function toggleOnline(location?: { latitude: number; longitude: number; isMocked?: boolean }) {
    if (!session?.user.riderProfileId) return;
    const nextOnline = !online;
    try {
      const body: Record<string, unknown> = {
        onlineStatus: nextOnline,
        ...(location
          ? {
              latitude: location.latitude,
              longitude: location.longitude,
              isMocked: location.isMocked,
            }
          : {}),
      };
      if (zones[0]?.id) body.serviceZoneId = zones[0].id;
      await api(`/riders/${session.user.riderProfileId}/availability`, {
        method: "PATCH",
        token: session.token,
        body,
      });
      setOnline(nextOnline);
    } catch (error) {
      setOnline(false);
      setMessage(error instanceof Error ? error.message : "Could not update availability.");
      throw error;
    }
  }

  const activeRide = rides.find(
    (r) =>
      r.rider?.id === session?.user.riderProfileId &&
      !["completed", "cancelled"].includes((r.status ?? "").toLowerCase()),
  );
  const activeDelivery = deliveries.find(
    (d) =>
      d.rider?.id === session?.user.riderProfileId &&
      !["delivered", "cancelled"].includes((d.status ?? "").toLowerCase()),
  );
  // A ride sits at "assigned" or "searching" (if unassigned) until the rider explicitly accepts or declines/dismisses.
  const incomingRide = rides.find(
    (r) =>
      !dismissedRequestIds.includes(r.id) &&
      (((r.status ?? "").toLowerCase() === "assigned" && r.rider?.id === session?.user.riderProfileId) ||
        ((r.status ?? "").toLowerCase() === "searching" && !r.rider?.id)),
  );
  const incomingDelivery = deliveries.find(
    (d) =>
      !dismissedRequestIds.includes(d.id) &&
      (d.status ?? "").toLowerCase() === "searching" &&
      (!d.rider?.id || d.rider?.id === session?.user.riderProfileId),
  );

  const value = useMemo(
    () => ({
      session,
      restoring,
      loading,
      message,
      online,
      wallets,
      transactions,
      rides,
      deliveries,
      zones,
      payouts,
      signIn,
      signOut,
      refresh,
      refreshSession,
      updateUser,
      setMessage,
      toggleOnline,
      setOnline,
      dismissRequest,
      activeRide,
      activeDelivery,
      incomingRide,
      incomingDelivery,
    }),
    [session, restoring, loading, message, online, wallets, transactions, rides, deliveries, zones, payouts, refresh, refreshSession, updateUser, dismissRequest, activeRide, activeDelivery, incomingRide, incomingDelivery],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
