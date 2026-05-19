import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export const palette = {
  ink: "#070A0E",
  panel: "#14171D",
  panelRaised: "#1C2028",
  stroke: "#2E3542",
  muted: "#A7AFBD",
  yellow: "#F7C600",
  green: "#14763B",
  red: "#DC3C2E",
};

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

export function Pill({ label, tone = "default" }: { label: string; tone?: "default" | "success" | "warning" | "danger" }) {
  return (
    <View style={[styles.pill, tone === "success" && styles.pillSuccess, tone === "warning" && styles.pillWarning, tone === "danger" && styles.pillDanger]}>
      <Text style={[styles.pillText, tone === "warning" && styles.pillTextDark]}>{label}</Text>
    </View>
  );
}

export function ListRow({ title, body, meta, amount }: { title: string; body: string; meta: string; amount?: string }) {
  return (
    <View style={styles.listRow}>
      <View style={styles.listGlyph} />
      <View style={styles.listCopy}>
        <Text style={styles.listTitle}>{title}</Text>
        <Text style={styles.listBody}>{body}</Text>
        <Text style={styles.listMeta}>{meta}</Text>
      </View>
      {amount ? <Text style={styles.listAmount}>{amount}</Text> : null}
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
  screen: { flex: 1, backgroundColor: palette.ink },
  content: { padding: 18, paddingBottom: 110, gap: 16 },
  authContent: { padding: 20, paddingBottom: 34, gap: 18 },
  authHero: { minHeight: 280, justifyContent: "flex-end", gap: 12, paddingBottom: 10 },
  brandMarkLarge: { width: 72, height: 72, borderRadius: 24, backgroundColor: palette.yellow, alignItems: "center", justifyContent: "center", shadowColor: palette.yellow, shadowOpacity: 0.25, shadowRadius: 20 },
  brandIconLarge: { color: "#111111", fontSize: 34, fontWeight: "900" },
  authTitle: { color: "#FFFFFF", fontSize: 42, lineHeight: 44, fontWeight: "900", letterSpacing: -1.4 },
  modeTabs: { flexDirection: "row", padding: 4, backgroundColor: "#0D1117", borderRadius: 999, borderWidth: 1, borderColor: "#252D39" },
  modeTab: { flex: 1, paddingVertical: 11, borderRadius: 999, alignItems: "center" },
  modeTabActive: { backgroundColor: palette.yellow },
  modeTabText: { color: "#A8ADB6", fontWeight: "900" },
  modeTabTextActive: { color: "#111111" },
  apiText: { color: "#6F7682", fontSize: 11, textAlign: "center" },
  liveStrip: { height: 34, backgroundColor: "#14763B", flexDirection: "row", alignItems: "center", paddingHorizontal: 18, gap: 10 },
  liveStripText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900", letterSpacing: 1 },
  liveDot: { width: 9, height: 9, borderRadius: 5, marginLeft: "auto" },
  liveDotOnline: { backgroundColor: "#A7F3D0" },
  liveDotOffline: { backgroundColor: "#FFB4A8" },
  topBar: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#1E2530", backgroundColor: "#0B0F14" },
  logoMark: { width: 42, height: 42, borderRadius: 16, backgroundColor: palette.yellow, alignItems: "center", justifyContent: "center", shadowColor: palette.yellow, shadowOpacity: 0.25, shadowRadius: 18 },
  logoIcon: { color: "#111111", fontWeight: "900", fontSize: 20 },
  logoText: { color: "#FFFFFF", fontWeight: "900", fontSize: 19, letterSpacing: -0.5 },
  logoSub: { color: "#8B8F98", fontSize: 12, fontWeight: "700" },
  inlineError: { marginHorizontal: 18, marginTop: 10, color: "#FFB4A8", fontWeight: "700" },
  syncPill: { position: "absolute", alignSelf: "center", bottom: 88, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: "#1B1B1B", borderWidth: 1, borderColor: "#2A2A2A" },
  syncPillText: { color: "#F5B800", fontWeight: "900" },
  hello: { color: "#B8BDC7", fontSize: 15, fontWeight: "700" },
  pageTitle: { color: "#FFFFFF", fontSize: 34, lineHeight: 38, fontWeight: "900", letterSpacing: -1 },
  card: { backgroundColor: palette.panel, borderRadius: 30, padding: 18, gap: 14, borderWidth: 1, borderColor: palette.stroke },
  lockedCard: { borderColor: "#9B1C1C", backgroundColor: "#251515" },
  grid: { flexDirection: "row", gap: 12 },
  statCard: { flex: 1, backgroundColor: palette.panelRaised, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: palette.stroke, gap: 8 },
  statLabel: { color: "#9096A0", fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  statValue: { color: "#FFFFFF", fontSize: 20, fontWeight: "900" },
  sectionHead: { gap: 6 },
  kicker: { color: palette.yellow, fontSize: 12, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase" },
  sectionTitle: { color: "#FFFFFF", fontSize: 22, fontWeight: "900", letterSpacing: -0.4 },
  muted: { color: "#A8ADB6", fontSize: 14, lineHeight: 20 },
  fieldWrap: { gap: 7 },
  fieldLabel: { color: "#DDE0E7", fontSize: 13, fontWeight: "800" },
  input: { minHeight: 52, borderRadius: 18, backgroundColor: "#0D1117", borderWidth: 1, borderColor: "#303846", color: "#FFFFFF", paddingHorizontal: 14, fontSize: 15, fontWeight: "700" },
  primaryButton: { minHeight: 54, borderRadius: 19, backgroundColor: palette.yellow, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  primaryButtonText: { color: "#111111", fontSize: 15, fontWeight: "900", textTransform: "capitalize" },
  disabledButton: { opacity: 0.55 },
  errorText: { color: "#FFB4A8", fontSize: 13, fontWeight: "700", lineHeight: 19 },
  emptyState: { borderWidth: 1, borderColor: "#323232", borderStyle: "dashed", borderRadius: 22, padding: 16, gap: 6 },
  emptyTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  mapPanel: { height: 300, borderRadius: 32, overflow: "hidden", backgroundColor: "#1E2633", borderWidth: 1, borderColor: "#3A4657" },
  mapGrid: { ...StyleSheet.absoluteFillObject, opacity: 0.16, backgroundColor: palette.yellow },
  mapRoute: { position: "absolute", left: 50, right: 44, top: 140, height: 7, borderRadius: 999, backgroundColor: palette.yellow, transform: [{ rotate: "-14deg" }] },
  mapStatus: { position: "absolute", top: 18, alignSelf: "center", borderRadius: 999, backgroundColor: palette.yellow, paddingHorizontal: 18, paddingVertical: 10 },
  mapStatusText: { color: "#111111", fontWeight: "900", textTransform: "capitalize" },
  mapCaption: { position: "absolute", left: 16, right: 16, bottom: 16, borderRadius: 20, padding: 14, backgroundColor: "rgba(14,14,14,0.86)" },
  mapTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" },
  mapSubtitle: { color: "#B8BDC7", fontSize: 13, marginTop: 4 },
  pill: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6, backgroundColor: "#202733", borderWidth: 1, borderColor: "#344052" },
  pillSuccess: { backgroundColor: "#123D25", borderColor: "#1F8A47" },
  pillWarning: { backgroundColor: palette.yellow, borderColor: palette.yellow },
  pillDanger: { backgroundColor: "#3D1712", borderColor: "#A9362C" },
  pillText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.7 },
  pillTextDark: { color: "#111111" },
  listRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#29313D" },
  listGlyph: { width: 42, height: 42, borderRadius: 17, backgroundColor: "#202A20", borderWidth: 1, borderColor: "#314E33" },
  listCopy: { flex: 1, paddingRight: 8 },
  listTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  listBody: { color: "#AAB2BF", fontSize: 13, marginTop: 4, lineHeight: 18 },
  listMeta: { color: "#737D8C", fontSize: 12, marginTop: 5, fontWeight: "700" },
  listAmount: { color: palette.yellow, fontSize: 14, fontWeight: "900" },
});
