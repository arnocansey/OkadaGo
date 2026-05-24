import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { api } from "./api";
import { BottomNav } from "./components/BottomNav";
import { styles } from "./components/ui";
import { AuthScreen } from "./screens/AuthScreen";
import { BookRideScreen } from "./screens/BookRideScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { LiveTrackingScreen } from "./screens/LiveTrackingScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { SideMenuScreen } from "./screens/SideMenuScreen";
import { SplashScreen } from "./screens/SplashScreen";
import { TrackRideScreen } from "./screens/TrackRideScreen";
import { TripCompleteScreen } from "./screens/TripCompleteScreen";
import { TripsScreen } from "./screens/TripsScreen";
import { WalletScreen } from "./screens/WalletScreen";
import { clearSavedSession, loadSavedSession, saveSession } from "./session-storage";
import type { Delivery, PassengerScreen, Ride, ServiceZone, Session, SessionUser, Wallet, WalletTransaction } from "./types";

export default function PassengerApp() {
  return (
    <SafeAreaProvider>
      <PassengerAppContent />
    </SafeAreaProvider>
  );
}

function PassengerAppContent() {
  const [session, setSession] = useState<Session | null>(null);
  const [authStep, setAuthStep] = useState<"splash" | "auth">("splash");
  const [activeScreen, setActiveScreen] = useState<PassengerScreen>("home");
  const [flowScreen, setFlowScreen] = useState<"book" | "track" | "live" | "complete" | "menu" | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [zones, setZones] = useState<ServiceZone[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    loadSavedSession()
      .then((saved) => {
        if (!active) return;
        if (saved) {
          setSession(saved);
        }
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
    setAuthStep("auth");
    await saveSession(nextSession);
  }

  async function updateUser(nextUser: SessionUser) {
    if (!session) return;
    const nextSession = { ...session, user: nextUser };
    setSession(nextSession);
    await saveSession(nextSession);
  }

  async function logout() {
    setSession(null);
    setFlowScreen(null);
    setActiveScreen("home");
    setAuthStep("auth");
    await clearSavedSession();
  }

  async function refresh(current = session) {
    if (!current) return;
    setLoading(true);
    setMessage("");
    try {
      const [walletData, txData, rideData, deliveryData, zoneData] = await Promise.all([
        api<Wallet[]>(`/wallets/users/${current.user.id}`),
        api<WalletTransaction[]>(`/wallets/users/${current.user.id}/transactions`),
        api<Ride[]>("/rides"),
        api<Delivery[]>("/deliveries"),
        api<ServiceZone[]>("/bootstrap/service-zones?limit=30"),
      ]);
      setWallets(walletData);
      setTransactions(txData);
      setRides(rideData.filter((ride) => ride.passenger?.id === current.user.passengerProfileId));
      setDeliveries(deliveryData.filter((delivery) => delivery.passenger?.id === current.user.passengerProfileId));
      setZones(zoneData);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load app data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session) {
      refresh(session);
    }
  }, [session?.token]);

  if (restoring) {
    return (
      <>
        <StatusBar style="light" />
        <SplashScreen onStart={() => undefined} busy />
      </>
    );
  }

  if (!session) {
    return (
      <>
        <StatusBar style="light" />
        {authStep === "splash" ? <SplashScreen onStart={() => setAuthStep("auth")} /> : <AuthScreen onSession={handleSession} />}
      </>
    );
  }

  const activeSession = session;
  const activeRide = rides.find((ride) => !["COMPLETED", "CANCELLED"].includes(ride.status));
  const completedRide = [...rides]
    .filter((ride) => ride.status === "COMPLETED")
    .sort((left, right) => Date.parse(right.createdAt ?? "0") - Date.parse(left.createdAt ?? "0"))[0];

  function Chrome({ children, showNav = false, onBack }: { children: ReactNode; showNav?: boolean; onBack?: () => void }) {
    function changeTab(nextScreen: PassengerScreen) {
      if (nextScreen === "book") {
        setFlowScreen("book");
        return;
      }
      setActiveScreen(nextScreen);
    }

    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar style="light" />
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
            <Text style={styles.logoSub}>Passenger app</Text>
          </View>
          <Pressable style={styles.refreshButton} onPress={() => refresh()}>
            <Text style={styles.refreshText}>{loading ? "..." : "Sync"}</Text>
          </Pressable>
        </View>
        {message ? <Text style={styles.inlineError}>{message}</Text> : null}
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
        {showNav ? <BottomNav active={activeScreen} onChange={changeTab} /> : null}
      </SafeAreaView>
    );
  }

  function HomeRoute() {
    return (
      <Chrome showNav>
        <HomeScreen
          user={activeSession.user}
          wallets={wallets}
          rides={rides}
          onBook={() => setFlowScreen("book")}
          onTrack={() => setFlowScreen("track")}
          onMenu={() => setFlowScreen("menu")}
        />
      </Chrome>
    );
  }

  function TripsRoute() {
    return (
      <Chrome showNav>
        <TripsScreen rides={rides} deliveries={deliveries} />
      </Chrome>
    );
  }

  function WalletRoute() {
    return (
      <Chrome showNav>
        <WalletScreen session={activeSession} wallets={wallets} transactions={transactions} onRefresh={() => refresh()} />
      </Chrome>
    );
  }

  function ProfileRoute() {
    return (
      <Chrome showNav>
        <ProfileScreen
          user={activeSession.user}
          wallets={wallets}
          rides={rides}
          deliveries={deliveries}
          onSaveUser={updateUser}
          onLogout={logout}
        />
      </Chrome>
    );
  }

  function MainTabs() {
    if (activeScreen === "trips") return <TripsRoute />;
    if (activeScreen === "wallet") return <WalletRoute />;
    if (activeScreen === "profile") return <ProfileRoute />;
    return <HomeRoute />;
  }

  function BookRideRoute() {
    return (
      <Chrome onBack={() => setFlowScreen(null)}>
        <BookRideScreen
          session={activeSession}
          zones={zones}
          onCreated={() => {
            refresh();
            setActiveScreen("trips");
            setFlowScreen(null);
          }}
        />
      </Chrome>
    );
  }

  function TrackRideRoute() {
    return (
      <Chrome onBack={() => setFlowScreen(null)}>
        <TrackRideScreen ride={activeRide} onLive={() => setFlowScreen("live")} onBack={() => setFlowScreen(null)} />
      </Chrome>
    );
  }

  function LiveTrackingRoute() {
    return (
      <Chrome onBack={() => setFlowScreen("track")}>
        <LiveTrackingScreen ride={activeRide} onComplete={() => setFlowScreen("complete")} onBack={() => setFlowScreen(null)} />
      </Chrome>
    );
  }

  function TripCompleteRoute() {
    return (
      <Chrome onBack={() => setFlowScreen(null)}>
        <TripCompleteScreen ride={completedRide} onDone={() => setFlowScreen(null)} />
      </Chrome>
    );
  }

  function SideMenuRoute() {
    return (
      <Chrome onBack={() => setFlowScreen(null)}>
        <SideMenuScreen
          user={activeSession.user}
          onTrips={() => {
            setActiveScreen("trips");
            setFlowScreen(null);
          }}
          onWallet={() => {
            setActiveScreen("wallet");
            setFlowScreen(null);
          }}
          onProfile={() => {
            setActiveScreen("profile");
            setFlowScreen(null);
          }}
          onLogout={logout}
        />
      </Chrome>
    );
  }

  if (flowScreen === "book") return <BookRideRoute />;
  if (flowScreen === "track") return <TrackRideRoute />;
  if (flowScreen === "live") return <LiveTrackingRoute />;
  if (flowScreen === "complete") return <TripCompleteRoute />;
  if (flowScreen === "menu") return <SideMenuRoute />;

  return <MainTabs />;
}
