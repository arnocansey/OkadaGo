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

export function PrimaryButton({
  label,
  onPress,
  disabled,
  dark,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  dark?: boolean;
}) {
  return (
    <Pressable
      style={[styles.primaryButton, dark && styles.primaryButtonDark, disabled && styles.disabledButton]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.primaryButtonText, dark && styles.primaryButtonTextDark]}>{label}</Text>
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

export function MapPanel({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.mapPanel}>
      <View style={styles.mapGrid} />
      <View style={styles.mapRoute} />
      <View style={styles.mapDotStart} />
      <View style={styles.mapDotEnd} />
      <View style={styles.mapCaption}>
        <Text style={styles.mapTitle}>{title}</Text>
        <Text style={styles.mapSubtitle}>{subtitle}</Text>
      </View>
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

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0E0E0E" },
  content: { padding: 18, paddingBottom: 110, gap: 16 },
  topBar: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#252525" },
  logoMark: { width: 42, height: 42, borderRadius: 16, backgroundColor: "#F5B800", alignItems: "center", justifyContent: "center" },
  logoIcon: { color: "#111111", fontWeight: "900", fontSize: 20 },
  logoText: { color: "#FFFFFF", fontWeight: "900", fontSize: 19, letterSpacing: -0.5 },
  logoSub: { color: "#8B8F98", fontSize: 12, fontWeight: "700" },
  refreshButton: { marginLeft: "auto", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: "#1C1C1C" },
  refreshText: { color: "#F5B800", fontWeight: "800" },
  inlineError: { marginHorizontal: 18, marginTop: 10, color: "#FFB4A8", fontWeight: "700" },
  hello: { color: "#B8BDC7", fontSize: 15, fontWeight: "700" },
  pageTitle: { color: "#FFFFFF", fontSize: 34, lineHeight: 38, fontWeight: "900", letterSpacing: -1 },
  card: { backgroundColor: "#1B1B1B", borderRadius: 28, padding: 18, gap: 14, borderWidth: 1, borderColor: "#2A2A2A" },
  yellowCard: { backgroundColor: "#F5B800", borderColor: "#F5B800" },
  heroLabel: { color: "#4B3900", fontSize: 12, fontWeight: "900", letterSpacing: 1.2, textTransform: "uppercase" },
  heroTitle: { color: "#111111", fontSize: 28, lineHeight: 32, fontWeight: "900" },
  heroCopy: { color: "#2D260D", fontSize: 15, lineHeight: 22 },
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
  primaryButtonDark: { backgroundColor: "#111111" },
  primaryButtonText: { color: "#111111", fontSize: 15, fontWeight: "900" },
  primaryButtonTextDark: { color: "#FFFFFF" },
  disabledButton: { opacity: 0.55 },
  errorText: { color: "#FFB4A8", fontSize: 13, fontWeight: "700", lineHeight: 19 },
  emptyState: { borderWidth: 1, borderColor: "#323232", borderStyle: "dashed", borderRadius: 22, padding: 16, gap: 6 },
  emptyTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  mapPanel: { height: 270, borderRadius: 30, overflow: "hidden", backgroundColor: "#222831", borderWidth: 1, borderColor: "#343A44" },
  mapGrid: { ...StyleSheet.absoluteFillObject, opacity: 0.12, backgroundColor: "#F5B800" },
  mapRoute: { position: "absolute", left: 70, right: 58, top: 130, height: 6, borderRadius: 999, backgroundColor: "#F5B800", transform: [{ rotate: "-16deg" }] },
  mapDotStart: { position: "absolute", left: 64, top: 156, width: 18, height: 18, borderRadius: 9, backgroundColor: "#FFFFFF" },
  mapDotEnd: { position: "absolute", right: 54, top: 98, width: 22, height: 22, borderRadius: 11, backgroundColor: "#F5B800" },
  mapCaption: { position: "absolute", left: 16, right: 16, bottom: 16, borderRadius: 20, padding: 14, backgroundColor: "rgba(14,14,14,0.86)" },
  mapTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" },
  mapSubtitle: { color: "#B8BDC7", fontSize: 13, marginTop: 4 },
});
