import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
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
import type { PassengerScreen, Ride, ServiceZone, Session, Wallet, WalletTransaction } from "./types";

export default function PassengerApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [authStep, setAuthStep] = useState<"splash" | "auth">("splash");
  const [activeScreen, setActiveScreen] = useState<PassengerScreen>("home");
  const [flowScreen, setFlowScreen] = useState<"book" | "track" | "live" | "complete" | "menu" | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [zones, setZones] = useState<ServiceZone[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function refresh(current = session) {
    if (!current) return;
    setLoading(true);
    setMessage("");
    try {
      const [walletData, txData, rideData, zoneData] = await Promise.all([
        api<Wallet[]>(`/wallets/users/${current.user.id}`),
        api<WalletTransaction[]>(`/wallets/users/${current.user.id}/transactions`),
        api<Ride[]>("/rides"),
        api<ServiceZone[]>("/bootstrap/service-zones?limit=30"),
      ]);
      setWallets(walletData);
      setTransactions(txData);
      setRides(rideData.filter((ride) => ride.passenger?.id === current.user.passengerProfileId));
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

  if (!session) {
    return (
      <>
        <StatusBar style="light" />
        {authStep === "splash" ? <SplashScreen onStart={() => setAuthStep("auth")} /> : <AuthScreen onSession={setSession} />}
      </>
    );
  }

  const activeSession = session;
  const activeRide = rides.find((ride) => !["COMPLETED", "CANCELLED"].includes(ride.status));
  const completedRide = [...rides]
    .filter((ride) => ride.status === "COMPLETED")
    .sort((left, right) => Date.parse(right.createdAt ?? "0") - Date.parse(left.createdAt ?? "0"))[0];

  function Chrome({ children, showNav = false }: { children: ReactNode; showNav?: boolean }) {
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
        <TripsScreen rides={rides} />
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
        <ProfileScreen user={activeSession.user} onLogout={() => setSession(null)} />
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
      <Chrome>
        <BookRideScreen
          session={activeSession}
          zones={zones}
          onCreated={() => {
            refresh();
            setFlowScreen("track");
          }}
        />
      </Chrome>
    );
  }

  function TrackRideRoute() {
    return (
      <Chrome>
        <TrackRideScreen ride={activeRide} onLive={() => setFlowScreen("live")} onBack={() => setFlowScreen(null)} />
      </Chrome>
    );
  }

  function LiveTrackingRoute() {
    return (
      <Chrome>
        <LiveTrackingScreen ride={activeRide} onComplete={() => setFlowScreen("complete")} onBack={() => setFlowScreen(null)} />
      </Chrome>
    );
  }

  function TripCompleteRoute() {
    return (
      <Chrome>
        <TripCompleteScreen ride={completedRide} onDone={() => setFlowScreen(null)} />
      </Chrome>
    );
  }

  function SideMenuRoute() {
    return (
      <Chrome>
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
          onLogout={() => setSession(null)}
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
