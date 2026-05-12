import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "Not configured";

export default function App() {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.card}>
        <Text style={styles.kicker}>OkadaGo Rider</Text>
        <Text style={styles.title}>Earn, settle, and manage trips.</Text>
        <Text style={styles.body}>
          This is the fresh rider React Native app shell. We can now wire online
          status, trip requests, earnings, deficit settlement, and payouts cleanly.
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
    backgroundColor: "#0A0B0D",
    padding: 20,
  },
  card: {
    flex: 1,
    justifyContent: "center",
    gap: 18,
    borderRadius: 32,
    backgroundColor: "#15181D",
    borderColor: "rgba(247, 198, 0, 0.22)",
    borderWidth: 1,
    padding: 28,
  },
  kicker: {
    color: "#F7C600",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: -1.2,
    lineHeight: 42,
  },
  body: {
    color: "#C7CDD4",
    fontSize: 16,
    lineHeight: 25,
  },
  apiBox: {
    marginTop: 12,
    borderRadius: 20,
    backgroundColor: "#F7C600",
    padding: 16,
  },
  apiLabel: {
    color: "#8A6C00",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  apiText: {
    color: "#0A0B0D",
    fontSize: 13,
    fontWeight: "800",
  },
});
