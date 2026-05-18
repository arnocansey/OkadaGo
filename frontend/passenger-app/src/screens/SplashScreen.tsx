import { SafeAreaView, Text, View } from "react-native";
import { PrimaryButton, styles } from "../components/ui";

export function SplashScreen({ onStart }: { onStart: () => void }) {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={[styles.content, { flex: 1, justifyContent: "center" }]}>
        <View style={styles.logoMark}>
          <Text style={styles.logoIcon}>O</Text>
        </View>
        <Text style={styles.pageTitle}>Move across the city with OkadaGo.</Text>
        <Text style={styles.muted}>Book verified riders, track every trip, and pay with the method that works for you.</Text>
        <PrimaryButton label="Get started" onPress={onStart} />
      </View>
    </SafeAreaView>
  );
}
