import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.kicker}>{kicker}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

export function Field(props: React.ComponentProps<typeof TextInput> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput placeholderTextColor="#8B8F98" style={styles.input} {...rest} />
    </View>
  );
}

export function PrimaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable style={[styles.primaryButton, disabled && styles.disabledButton]} onPress={onPress} disabled={disabled}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.muted}>{body}</Text>
    </View>
  );
}

export function MapPanel({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.mapPanel}>
      <View style={styles.mapGrid} />
      <View style={styles.mapRoute} />
      <View style={styles.mapStatus}><Text style={styles.mapStatusText}>{title}</Text></View>
      <View style={styles.mapCaption}>
        <Text style={styles.mapTitle}>Live operations map</Text>
        <Text style={styles.mapSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0E0E0E" },
  content: { padding: 18, paddingBottom: 110, gap: 16 },
  liveStrip: { height: 34, backgroundColor: "#14763B", flexDirection: "row", alignItems: "center", paddingHorizontal: 18, gap: 10 },
  liveStripText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900", letterSpacing: 1 },
  liveDot: { width: 9, height: 9, borderRadius: 5, marginLeft: "auto" },
  liveDotOnline: { backgroundColor: "#A7F3D0" },
  liveDotOffline: { backgroundColor: "#FFB4A8" },
  topBar: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#252525" },
  logoMark: { width: 42, height: 42, borderRadius: 16, backgroundColor: "#F5B800", alignItems: "center", justifyContent: "center" },
  logoIcon: { color: "#111111", fontWeight: "900", fontSize: 20 },
  logoText: { color: "#FFFFFF", fontWeight: "900", fontSize: 19, letterSpacing: -0.5 },
  logoSub: { color: "#8B8F98", fontSize: 12, fontWeight: "700" },
  inlineError: { marginHorizontal: 18, marginTop: 10, color: "#FFB4A8", fontWeight: "700" },
  syncPill: { position: "absolute", alignSelf: "center", bottom: 88, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: "#1B1B1B", borderWidth: 1, borderColor: "#2A2A2A" },
  syncPillText: { color: "#F5B800", fontWeight: "900" },
  hello: { color: "#B8BDC7", fontSize: 15, fontWeight: "700" },
  pageTitle: { color: "#FFFFFF", fontSize: 34, lineHeight: 38, fontWeight: "900", letterSpacing: -1 },
  card: { backgroundColor: "#1B1B1B", borderRadius: 28, padding: 18, gap: 14, borderWidth: 1, borderColor: "#2A2A2A" },
  lockedCard: { borderColor: "#9B1C1C", backgroundColor: "#251515" },
  grid: { flexDirection: "row", gap: 12 },
  statCard: { flex: 1, backgroundColor: "#1B1B1B", borderRadius: 24, padding: 16, borderWidth: 1, borderColor: "#2A2A2A", gap: 8 },
  statLabel: { color: "#9096A0", fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  statValue: { color: "#FFFFFF", fontSize: 20, fontWeight: "900" },
  sectionHead: { gap: 6 },
  kicker: { color: "#F5B800", fontSize: 12, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase" },
  sectionTitle: { color: "#FFFFFF", fontSize: 22, fontWeight: "900", letterSpacing: -0.4 },
  muted: { color: "#A8ADB6", fontSize: 14, lineHeight: 20 },
  fieldWrap: { gap: 7 },
  fieldLabel: { color: "#DDE0E7", fontSize: 13, fontWeight: "800" },
  input: { minHeight: 50, borderRadius: 17, backgroundColor: "#111111", borderWidth: 1, borderColor: "#2C2C2C", color: "#FFFFFF", paddingHorizontal: 14, fontSize: 15, fontWeight: "700" },
  primaryButton: { minHeight: 52, borderRadius: 18, backgroundColor: "#F5B800", alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  primaryButtonText: { color: "#111111", fontSize: 15, fontWeight: "900", textTransform: "capitalize" },
  disabledButton: { opacity: 0.55 },
  errorText: { color: "#FFB4A8", fontSize: 13, fontWeight: "700", lineHeight: 19 },
  emptyState: { borderWidth: 1, borderColor: "#323232", borderStyle: "dashed", borderRadius: 22, padding: 16, gap: 6 },
  emptyTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  mapPanel: { height: 300, borderRadius: 30, overflow: "hidden", backgroundColor: "#222831", borderWidth: 1, borderColor: "#343A44" },
  mapGrid: { ...StyleSheet.absoluteFillObject, opacity: 0.12, backgroundColor: "#F5B800" },
  mapRoute: { position: "absolute", left: 50, right: 44, top: 140, height: 7, borderRadius: 999, backgroundColor: "#F5B800", transform: [{ rotate: "-14deg" }] },
  mapStatus: { position: "absolute", top: 18, alignSelf: "center", borderRadius: 999, backgroundColor: "#F5B800", paddingHorizontal: 18, paddingVertical: 10 },
  mapStatusText: { color: "#111111", fontWeight: "900", textTransform: "capitalize" },
  mapCaption: { position: "absolute", left: 16, right: 16, bottom: 16, borderRadius: 20, padding: 14, backgroundColor: "rgba(14,14,14,0.86)" },
  mapTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" },
  mapSubtitle: { color: "#B8BDC7", fontSize: 13, marginTop: 4 },
});
