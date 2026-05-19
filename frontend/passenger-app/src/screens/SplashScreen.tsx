import { SafeAreaView, Text, View } from "react-native";
import { IconBadge, PrimaryButton, styles } from "../components/ui";

export function SplashScreen({ onStart, busy = false }: { onStart: () => void; busy?: boolean }) {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={[styles.content, { flex: 1, justifyContent: "center", gap: 18 }]}>
        <View style={styles.brandMarkLarge}>
          <Text style={styles.brandIconLarge}>O</Text>
        </View>
        <View style={styles.grid}>
          <IconBadge label="BIKE" />
          <IconBadge label="PAY" tone="green" />
          <IconBadge label="MAP" tone="dark" />
        </View>
        <Text style={styles.authTitle}>Move across the city with OkadaGo.</Text>
        <Text style={styles.muted}>Book verified riders, track every trip, and pay with the method that works for you.</Text>
        <PrimaryButton label={busy ? "Loading..." : "Get started"} onPress={onStart} disabled={busy} />
      </View>
    </SafeAreaView>
  );
}
