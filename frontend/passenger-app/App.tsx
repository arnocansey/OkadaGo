import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "Not configured";

export default function App() {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.card}>
        <Text style={styles.kicker}>OkadaGo Passenger</Text>
        <Text style={styles.title}>Book safe rides across the city.</Text>
        <Text style={styles.body}>
          This is the fresh passenger React Native app shell. We can now wire login,
          booking, wallet, trip history, and live tracking cleanly from here.
        </Text>
        <View style={styles.apiBox}>
          <Text style={styles.apiLabel}>API backend</Text>
          <Text style={styles.apiText}>{apiBaseUrl}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F6F8",
    padding: 20,
  },
  card: {
    flex: 1,
    justifyContent: "center",
    gap: 18,
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
    padding: 28,
    shadowColor: "#0A0B0D",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 8,
  },
  kicker: {
    color: "#8A6C00",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  title: {
    color: "#0A0B0D",
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: -1.2,
    lineHeight: 42,
  },
  body: {
    color: "#2B3138",
    fontSize: 16,
    lineHeight: 25,
  },
  apiBox: {
    marginTop: 12,
    borderRadius: 20,
    backgroundColor: "#FFF7CC",
    padding: 16,
  },
  apiLabel: {
    color: "#8A6C00",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  apiText: {
    color: "#0A0B0D",
    fontSize: 13,
    fontWeight: "700",
  },
});
