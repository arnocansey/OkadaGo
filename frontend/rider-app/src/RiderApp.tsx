import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { api } from "./api";
import { AvailabilityToggle } from "./components/AvailabilityToggle";
import { BottomNav } from "./components/BottomNav";
import { styles } from "./components/ui";
import { AuthScreen } from "./screens/AuthScreen";
import { ArrivedPickupScreen } from "./screens/ArrivedPickupScreen";
import { DashboardScreen } from "./screens/DashboardScreen";
import { DocumentsScreen } from "./screens/DocumentsScreen";
import { EarningsScreen } from "./screens/EarningsScreen";
import { IncentivesScreen } from "./screens/IncentivesScreen";
import { OnTheWayScreen } from "./screens/OnTheWayScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { RideRequestScreen } from "./screens/RideRequestScreen";
import { TripsScreen } from "./screens/TripsScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { TripCompletedScreen } from "./screens/TripCompletedScreen";
import { TripProgressScreen } from "./screens/TripProgressScreen";
import { WalletScreen } from "./screens/WalletScreen";
import { clearSavedSession, loadSavedSession, saveSession } from "./session-storage";
import type { Delivery, PayoutRequest, Ride, RiderScreen, ServiceZone, Session, Wallet, WalletTransaction } from "./types";

export default function RiderApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [activeScreen, setActiveScreen] = useState<RiderScreen>("dashboard");
  const [flowScreen, setFlowScreen] = useState<"request" | "way" | "arrived" | "progress" | "completed" | "incentives" | "documents" | "settings" | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [zones, setZones] = useState<ServiceZone[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    loadSavedSession()
      .then((saved) => {
        if (active && saved) setSession(saved);
      })
      .catch(() => {
        if (active) setMessage("Could not restore your saved session.");
      })
      .finally(() => {
        if (active) setRestoring(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleSession(nextSession: Session) {
    setSession(nextSession);
    await saveSession(nextSession);
  }

  async function logout() {
    setSession(null);
    setFlowScreen(null);
    setActiveScreen("dashboard");
    setOnline(false);
    await clearSavedSession();
  }

  async function refresh(current = session) {
    if (!current) return;
    setLoading(true);
    setMessage("");
    try {
      const [walletData, txData, rideData, deliveryData, zoneData, payoutData] = await Promise.all([
        api<Wallet[]>(`/wallets/users/${current.user.id}`),
        api<WalletTransaction[]>(`/wallets/users/${current.user.id}/transactions`),
        api<Ride[]>("/rides"),
        api<Delivery[]>("/deliveries"),
        api<ServiceZone[]>("/bootstrap/service-zones?limit=30"),
        api<PayoutRequest[]>("/wallets/rider/payout-requests", { token: current.token }).catch(() => []),
      ]);
      setWallets(walletData);
      setTransactions(txData);
      setRides(rideData.filter((ride) => ride.rider?.id === current.user.riderProfileId));
      setDeliveries(
        deliveryData.filter(
          (delivery) => delivery.rider?.id === current.user.riderProfileId || delivery.status.toLowerCase() === "searching"
        )
      );
      setZones(zoneData);
      setPayouts(payoutData);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load rider data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session) refresh(session);
  }, [session?.token]);

  if (restoring) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar style="light" />
        <View style={styles.authContent}>
          <View style={styles.authHero}>
            <View style={styles.brandMarkLarge}><Text style={styles.brandIconLarge}>O</Text></View>
            <Text style={styles.kicker}>OKADAGO RIDER</Text>
            <Text style={styles.authTitle}>Loading rider workspace</Text>
            <Text style={styles.muted}>Restoring your saved session.</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <>
        <StatusBar style="light" />
        <AuthScreen onSession={handleSession} />
      </>
    );
  }

  const activeSession = session;
  const activeRide = rides.find((ride) => !["COMPLETED", "CANCELLED"].includes(ride.status));
  const activeDelivery = deliveries.find(
    (delivery) => delivery.rider?.id === activeSession.user.riderProfileId && !["DELIVERED", "CANCELLED"].includes(delivery.status)
  );
  const completedRide = [...rides]
    .filter((ride) => ride.status === "COMPLETED")
    .sort((left, right) => Date.parse(right.createdAt ?? "0") - Date.parse(left.createdAt ?? "0"))[0];

  async function toggleAvailability() {
    if (!activeSession.user.riderProfileId) return;
    const nextOnline = !online;
    setMessage("");
    try {
      await api(`/riders/${activeSession.user.riderProfileId}/availability`, {
        method: "PATCH",
        body: { onlineStatus: nextOnline, serviceZoneId: zones[0]?.id },
      });
      setOnline(nextOnline);
    } catch (error) {
      setOnline(false);
      setMessage(error instanceof Error ? error.message : "Could not update availability.");
    }
  }

  function Chrome({ children, showNav = false, onBack }: { children: ReactNode; showNav?: boolean; onBack?: () => void }) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar style="light" />
        <View style={styles.liveStrip}>
          <Text style={styles.liveStripText}>{online ? "LIVE RIDER DASHBOARD - ONLINE" : "LIVE RIDER DASHBOARD - OFFLINE"}</Text>
          <View style={[styles.liveDot, online ? styles.liveDotOnline : styles.liveDotOffline]} />
        </View>
        <View style={styles.topBar}>
          {onBack ? (
            <Pressable style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>Back</Text>
            </Pressable>
          ) : null}
          <View style={styles.logoMark}>
            <Text style={styles.logoIcon}>O</Text>
          </View>
          <View>
            <Text style={styles.logoText}>OKADAGO</Text>
            <Text style={styles.logoSub}>Rider app</Text>
          </View>
          <AvailabilityToggle online={online} disabled={!activeSession.user.riderProfileId} onToggle={toggleAvailability} />
        </View>
        {message ? <Text style={styles.inlineError}>{message}</Text> : null}
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
        {loading ? (
          <View style={styles.syncPill}>
            <Text style={styles.syncPillText}>Syncing...</Text>
          </View>
        ) : null}
        {showNav ? <BottomNav active={activeScreen} onChange={setActiveScreen} /> : null}
      </SafeAreaView>
    );
  }

  function openTripFlow() {
    if (activeDelivery && !activeRide) {
      setActiveScreen("trips");
      return;
    }

    const status = activeRide?.status.toLowerCase();
    if (status === "assigned") setFlowScreen("request");
    else if (status === "arriving") setFlowScreen("way");
    else if (status === "arrived") setFlowScreen("arrived");
    else if (status === "started") setFlowScreen("progress");
    else setActiveScreen("trips");
  }

  function DashboardRoute() {
    return (
      <Chrome showNav>
        <DashboardScreen
          session={activeSession}
          wallets={wallets}
          rides={rides}
          deliveries={deliveries}
          online={online}
          onOpenActiveTrip={openTripFlow}
          onOpenIncentives={() => setFlowScreen("incentives")}
          onOpenDocuments={() => setFlowScreen("documents")}
        />
      </Chrome>
    );
  }

  function EarningsRoute() {
    return (
      <Chrome showNav>
        <EarningsScreen session={activeSession} wallets={wallets} rides={rides} transactions={transactions} onRefresh={() => refresh()} />
      </Chrome>
    );
  }

  function TripsRoute() {
    return (
      <Chrome showNav>
        <TripsScreen session={activeSession} rides={rides} deliveries={deliveries} onRefresh={() => refresh()} />
      </Chrome>
    );
  }

  function WalletRoute() {
    return (
      <Chrome showNav>
        <WalletScreen session={activeSession} wallets={wallets} payouts={payouts} transactions={transactions} onRefresh={() => refresh()} />
      </Chrome>
    );
  }

  function ProfileRoute() {
    return (
      <Chrome showNav>
        <ProfileScreen
          user={activeSession.user}
          zones={zones}
          onDocuments={() => setFlowScreen("documents")}
          onSettings={() => setFlowScreen("settings")}
          onLogout={logout}
        />
      </Chrome>
    );
  }

  function MainTabs() {
    if (activeScreen === "earnings") return <EarningsRoute />;
    if (activeScreen === "trips") return <TripsRoute />;
    if (activeScreen === "wallet") return <WalletRoute />;
    if (activeScreen === "profile") return <ProfileRoute />;
    return <DashboardRoute />;
  }

  function RideRequestRoute() {
    return (
      <Chrome onBack={() => setFlowScreen(null)}>
        <RideRequestScreen session={activeSession} ride={activeRide} onRefresh={() => refresh()} onAccepted={() => setFlowScreen("way")} />
      </Chrome>
    );
  }

  function OnTheWayRoute() {
    return (
      <Chrome onBack={() => setFlowScreen(null)}>
        <OnTheWayScreen session={activeSession} ride={activeRide} onRefresh={() => refresh()} onArrived={() => setFlowScreen("arrived")} />
      </Chrome>
    );
  }

  function ArrivedPickupRoute() {
    return (
      <Chrome onBack={() => setFlowScreen(null)}>
        <ArrivedPickupScreen session={activeSession} ride={activeRide} onRefresh={() => refresh()} onStarted={() => setFlowScreen("progress")} />
      </Chrome>
    );
  }

  function TripProgressRoute() {
    return (
      <Chrome onBack={() => setFlowScreen(null)}>
        <TripProgressScreen session={activeSession} ride={activeRide} onRefresh={() => refresh()} onCompleted={() => setFlowScreen("completed")} />
      </Chrome>
    );
  }

  function TripCompletedRoute() {
    return (
      <Chrome onBack={() => setFlowScreen(null)}>
        <TripCompletedScreen ride={completedRide} onDone={() => setFlowScreen(null)} />
      </Chrome>
    );
  }

  function IncentivesRoute() {
    return (
      <Chrome onBack={() => setFlowScreen(null)}>
        <IncentivesScreen rides={rides} />
      </Chrome>
    );
  }

  function DocumentsRoute() {
    return (
      <Chrome onBack={() => setFlowScreen(null)}>
        <DocumentsScreen user={activeSession.user} />
      </Chrome>
    );
  }

  function SettingsRoute() {
    return (
      <Chrome onBack={() => setFlowScreen(null)}>
        <SettingsScreen user={activeSession.user} onLogout={logout} />
      </Chrome>
    );
  }

  if (flowScreen === "request") return <RideRequestRoute />;
  if (flowScreen === "way") return <OnTheWayRoute />;
  if (flowScreen === "arrived") return <ArrivedPickupRoute />;
  if (flowScreen === "progress") return <TripProgressRoute />;
  if (flowScreen === "completed") return <TripCompletedRoute />;
  if (flowScreen === "incentives") return <IncentivesRoute />;
  if (flowScreen === "documents") return <DocumentsRoute />;
  if (flowScreen === "settings") return <SettingsRoute />;

  return <MainTabs />;
}
