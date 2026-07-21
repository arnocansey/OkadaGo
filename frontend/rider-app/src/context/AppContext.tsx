import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import { clearSavedSession, loadSavedSession, saveSession } from "@/lib/session-storage";
import { riderWs } from "@/lib/websocket";
import { usePushRegistration } from "@/hooks/usePushRegistration";
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
  toggleOnline: () => Promise<void>;
  setOnline: (value: boolean) => void;
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

  const refresh = useCallback(async (current = session) => {
    if (!current) return;
    setLoading(true);
    setMessage("");
    try {
      const [walletData, txData, rideData, deliveryData, zoneData, payoutData] = await Promise.all([
        api<Wallet[]>(`/wallets/users/${current.user.id}`, { token: current.token }),
        api<WalletTransaction[]>(`/wallets/users/${current.user.id}/transactions`, { token: current.token }),
        api<Ride[]>("/rides", { token: current.token }),
        api<Delivery[]>("/deliveries", { token: current.token }),
        api<ServiceZone[]>("/bootstrap/service-zones?limit=30", { token: current.token }),
        api<PayoutRequest[]>("/wallets/rider/payout-requests", { token: current.token }).catch(() => []),
      ]);
      setWallets(Array.isArray(walletData) ? walletData : []);
      setTransactions(Array.isArray(txData) ? txData : []);
      setRides((Array.isArray(rideData) ? rideData : []).filter((r) => r.rider?.id === current.user.riderProfileId));
      setDeliveries(
        (Array.isArray(deliveryData) ? deliveryData : []).filter(
          (d) => d.rider?.id === current.user.riderProfileId || (d.status ?? "").toLowerCase() === "searching",
        ),
      );
      setZones(Array.isArray(zoneData) ? zoneData : []);
      setPayouts(Array.isArray(payoutData) ? payoutData : []);
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

    riderWs.on("ride:status-update", onRideUpdate);
    riderWs.on("delivery:status-update", onDeliveryUpdate);
    riderWs.on("ride:assigned", () => refresh());

    return () => riderWs.disconnect();
  }, [session?.token, refresh]);

  usePushRegistration(session?.token);

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

  async function toggleOnline() {
    if (!session?.user.riderProfileId) return;
    const nextOnline = !online;
    try {
      await api(`/riders/${session.user.riderProfileId}/availability`, {
        method: "PATCH",
        token: session.token,
        body: { onlineStatus: nextOnline, serviceZoneId: zones[0]?.id },
      });
      setOnline(nextOnline);
    } catch (error) {
      setOnline(false);
      setMessage(error instanceof Error ? error.message : "Could not update availability.");
    }
  }

  const activeRide = rides.find((r) => !["completed", "cancelled"].includes((r.status ?? "").toLowerCase()));
  const activeDelivery = deliveries.find(
    (d) =>
      d.rider?.id === session?.user.riderProfileId &&
      !["delivered", "cancelled"].includes((d.status ?? "").toLowerCase()),
  );
  // A ride sits at "assigned" until the rider explicitly accepts (-> arriving) or
  // declines (-> cancelled), mirroring the "searching" pending-decision window for deliveries.
  const incomingRide = rides.find((r) => (r.status ?? "").toLowerCase() === "assigned");
  const incomingDelivery = deliveries.find((d) => (d.status ?? "").toLowerCase() === "searching");

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
      activeRide,
      activeDelivery,
      incomingRide,
      incomingDelivery,
    }),
    [session, restoring, loading, message, online, wallets, transactions, rides, deliveries, zones, payouts, refresh, refreshSession, updateUser, activeRide, activeDelivery, incomingRide, incomingDelivery],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
