import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, Text, View } from "react-native";
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
import type { PayoutRequest, Ride, RiderScreen, ServiceZone, Session, Wallet, WalletTransaction } from "./types";

export default function RiderApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [activeScreen, setActiveScreen] = useState<RiderScreen>("dashboard");
  const [flowScreen, setFlowScreen] = useState<"request" | "way" | "arrived" | "progress" | "completed" | "incentives" | "documents" | "settings" | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [zones, setZones] = useState<ServiceZone[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function refresh(current = session) {
    if (!current) return;
    setLoading(true);
    setMessage("");
    try {
      const [walletData, txData, rideData, zoneData, payoutData] = await Promise.all([
        api<Wallet[]>(`/wallets/users/${current.user.id}`),
        api<WalletTransaction[]>(`/wallets/users/${current.user.id}/transactions`),
        api<Ride[]>("/rides"),
        api<ServiceZone[]>("/bootstrap/service-zones?limit=30"),
        api<PayoutRequest[]>("/wallets/rider/payout-requests", { token: current.token }).catch(() => []),
      ]);
      setWallets(walletData);
      setTransactions(txData);
      setRides(rideData.filter((ride) => ride.rider?.id === current.user.riderProfileId));
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

  if (!session) {
    return (
      <>
        <StatusBar style="light" />
        <AuthScreen onSession={setSession} />
      </>
    );
  }

  const activeSession = session;
  const activeRide = rides.find((ride) => !["COMPLETED", "CANCELLED"].includes(ride.status));
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

  function Chrome({ children, showNav = false }: { children: ReactNode; showNav?: boolean }) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar style="light" />
        <View style={styles.liveStrip}>
          <Text style={styles.liveStripText}>{online ? "LIVE RIDER DASHBOARD - ONLINE" : "LIVE RIDER DASHBOARD - OFFLINE"}</Text>
          <View style={[styles.liveDot, online ? styles.liveDotOnline : styles.liveDotOffline]} />
        </View>
        <View style={styles.topBar}>
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
        <TripsScreen session={activeSession} rides={rides} onRefresh={() => refresh()} />
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
          onLogout={() => setSession(null)}
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
      <Chrome>
        <RideRequestScreen session={activeSession} ride={activeRide} onRefresh={() => refresh()} onAccepted={() => setFlowScreen("way")} />
      </Chrome>
    );
  }

  function OnTheWayRoute() {
    return (
      <Chrome>
        <OnTheWayScreen session={activeSession} ride={activeRide} onRefresh={() => refresh()} onArrived={() => setFlowScreen("arrived")} />
      </Chrome>
    );
  }

  function ArrivedPickupRoute() {
    return (
      <Chrome>
        <ArrivedPickupScreen session={activeSession} ride={activeRide} onRefresh={() => refresh()} onStarted={() => setFlowScreen("progress")} />
      </Chrome>
    );
  }

  function TripProgressRoute() {
    return (
      <Chrome>
        <TripProgressScreen session={activeSession} ride={activeRide} onRefresh={() => refresh()} onCompleted={() => setFlowScreen("completed")} />
      </Chrome>
    );
  }

  function TripCompletedRoute() {
    return (
      <Chrome>
        <TripCompletedScreen ride={completedRide} onDone={() => setFlowScreen(null)} />
      </Chrome>
    );
  }

  function IncentivesRoute() {
    return (
      <Chrome>
        <IncentivesScreen rides={rides} />
      </Chrome>
    );
  }

  function DocumentsRoute() {
    return (
      <Chrome>
        <DocumentsScreen user={activeSession.user} />
      </Chrome>
    );
  }

  function SettingsRoute() {
    return (
      <Chrome>
        <SettingsScreen user={activeSession.user} onLogout={() => setSession(null)} />
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
