import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import { clearSavedSession, loadSavedSession, saveSession } from "@/lib/session-storage";
import { passengerWs } from "@/lib/websocket";
import { usePushRegistration } from "@/hooks/usePushRegistration";
import { useNotificationDeepLinks } from "@/hooks/useNotificationDeepLinks";
import type { Delivery, Ride, ServiceZone, Session, SessionUser, Wallet, WalletTransaction } from "@/types";

type AppState = {
  session: Session | null;
  restoring: boolean;
  loading: boolean;
  message: string;
  wallets: Wallet[];
  transactions: WalletTransaction[];
  rides: Ride[];
  deliveries: Delivery[];
  zones: ServiceZone[];
  signIn: (session: Session) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateUser: (user: SessionUser) => Promise<void>;
  setMessage: (message: string) => void;
  activeRide: Ride | undefined;
  activeDelivery: Delivery | undefined;
};

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [zones, setZones] = useState<ServiceZone[]>([]);

  const refresh = useCallback(async (current = session) => {
    if (!current) return;
    setLoading(true);
    setMessage("");
    try {
      const [walletData, txData, rideData, deliveryData, zoneData] = await Promise.all([
        api<Wallet[]>(`/wallets/users/${current.user.id}`, { token: current.token }),
        api<WalletTransaction[]>(`/wallets/users/${current.user.id}/transactions`, { token: current.token }),
        api<Ride[]>("/rides", { token: current.token }),
        api<Delivery[]>("/deliveries", { token: current.token }),
        api<ServiceZone[]>("/bootstrap/service-zones?limit=30", { token: current.token }),
      ]);
      setWallets(walletData);
      setTransactions(txData);
      setRides(rideData.filter((ride) => ride.passenger?.id === current.user.passengerProfileId));
      setDeliveries(deliveryData.filter((d) => d.passenger?.id === current.user.passengerProfileId));
      setZones(zoneData);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load app data.");
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

    passengerWs.connect(session.token).catch(() => undefined);

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

    const onRiderLocation = (data: unknown) => {
      const patch = data as {
        rideId?: string;
        deliveryId?: string;
        latitude?: number;
        longitude?: number;
      };
      if (patch.latitude == null || patch.longitude == null) return;

      if (patch.rideId) {
        setRides((prev) =>
          prev.map((r) =>
            r.id === patch.rideId
              ? {
                  ...r,
                  rider: {
                    ...(r.rider ?? {}),
                    currentLatitude: patch.latitude,
                    currentLongitude: patch.longitude,
                  },
                }
              : r,
          ),
        );
      }

      if (patch.deliveryId) {
        setDeliveries((prev) =>
          prev.map((d) =>
            d.id === patch.deliveryId
              ? {
                  ...d,
                  rider: {
                    ...(d.rider ?? {}),
                    currentLatitude: patch.latitude,
                    currentLongitude: patch.longitude,
                  },
                }
              : d,
          ),
        );
      }
    };

    passengerWs.on("ride:assigned", () => refresh());
    passengerWs.on("ride:status-update", onRideUpdate);
    passengerWs.on("delivery:status-update", onDeliveryUpdate);
    passengerWs.on("rider:location-update", onRiderLocation);

    return () => passengerWs.disconnect();
  }, [session?.token, refresh]);

  usePushRegistration(session?.token);
  useNotificationDeepLinks(Boolean(session?.token));

  const refreshSession = useCallback(async () => {
    if (!session?.token) return;
    const data = await api<{ user: SessionUser }>("/auth/session", { token: session.token });
    const next = { ...session, user: data.user };
    setSession(next);
    await saveSession(next);
  }, [session]);

  async function signIn(next: Session) {
    setSession(next);
    await saveSession(next);
  }

  async function signOut() {
    setSession(null);
    await clearSavedSession();
  }

  const updateUser = useCallback(async (user: SessionUser) => {
    setSession((current) => {
      if (!current) return current;
      const next = { ...current, user };
      void saveSession(next);
      return next;
    });
  }, []);

  const activeRide = rides.find((r) => !["completed", "cancelled"].includes((r.status ?? "").toLowerCase()));
  const activeDelivery = deliveries.find((d) => !["delivered", "cancelled"].includes((d.status ?? "").toLowerCase()));

  const value = useMemo(
    () => ({
      session,
      restoring,
      loading,
      message,
      wallets,
      transactions,
      rides,
      deliveries,
      zones,
      signIn,
      signOut,
      refresh,
      refreshSession,
      updateUser,
      setMessage,
      activeRide,
      activeDelivery,
    }),
    [session, restoring, loading, message, wallets, transactions, rides, deliveries, zones, refresh, refreshSession, activeRide, activeDelivery],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
