import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { WebView } from "react-native-webview";

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

export function IconBadge({ label, tone = "yellow" }: { label: string; tone?: "yellow" | "green" | "dark" }) {
  return (
    <View style={[styles.iconBadge, tone === "green" && styles.iconBadgeGreen, tone === "dark" && styles.iconBadgeDark]}>
      <Text style={[styles.iconBadgeText, tone === "dark" && styles.iconBadgeTextLight]}>{label}</Text>
    </View>
  );
}

export function ServiceTile({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <View style={styles.serviceTile}>
      <IconBadge label={icon} />
      <Text style={styles.serviceTitle}>{title}</Text>
      <Text style={styles.serviceBody}>{body}</Text>
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

export function ListRow({
  title,
  body,
  meta,
  amount,
}: {
  title: string;
  body: string;
  meta: string;
  amount?: string;
}) {
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

export function MapPanel({
  title,
  subtitle,
  start,
  end,
}: {
  title: string;
  subtitle: string;
  start?: { latitude: number; longitude: number; label?: string } | null;
  end?: { latitude: number; longitude: number; label?: string } | null;
}) {
  const center = start ?? end ?? { latitude: 5.6037, longitude: -0.187 };
  const span = start && end ? 0.08 : 0.12;
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${center.longitude - span}%2C${center.latitude - span}%2C${center.longitude + span}%2C${center.latitude + span}&layer=mapnik&marker=${center.latitude}%2C${center.longitude}`;

  return (
    <View style={styles.mapPanel}>
      <WebView style={styles.realMap} source={{ uri: mapUrl }} originWhitelist={["*"]} scrollEnabled={false} />
      {start && end ? (
        <View style={styles.mapRouteOverlay}>
          <View style={styles.mapDotStart} />
          <View style={styles.mapRoute} />
          <View style={styles.mapDotEnd} />
        </View>
      ) : null}
      <View style={styles.mapPin}>
        <Text style={styles.mapPinText}>GPS</Text>
      </View>
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
  screen: { flex: 1, backgroundColor: palette.ink },
  content: { padding: 16, paddingBottom: 126, gap: 14 },
  authContent: { padding: 18, paddingBottom: 30, gap: 16 },
  authHero: { minHeight: 210, justifyContent: "flex-end", gap: 10, paddingBottom: 6 },
  brandMarkLarge: { width: 64, height: 64, borderRadius: 22, backgroundColor: palette.yellow, alignItems: "center", justifyContent: "center", shadowColor: palette.yellow, shadowOpacity: 0.25, shadowRadius: 20 },
  brandIconLarge: { color: "#111111", fontSize: 30, fontWeight: "900" },
  authTitle: { color: "#FFFFFF", fontSize: 34, lineHeight: 37, fontWeight: "900", letterSpacing: -1.2 },
  modeTabs: { flexDirection: "row", padding: 4, backgroundColor: "#0D1117", borderRadius: 999, borderWidth: 1, borderColor: "#252D39" },
  modeTab: { flex: 1, paddingVertical: 11, borderRadius: 999, alignItems: "center" },
  modeTabActive: { backgroundColor: palette.yellow },
  modeTabText: { color: "#A8ADB6", fontWeight: "900" },
  modeTabTextActive: { color: "#111111" },
  apiText: { color: "#6F7682", fontSize: 11, textAlign: "center" },
  topBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#1E2530", backgroundColor: "#0B0F14" },
  backButton: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: "#171D26", borderWidth: 1, borderColor: "#303846" },
  backButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  logoMark: { width: 42, height: 42, borderRadius: 16, backgroundColor: palette.yellow, alignItems: "center", justifyContent: "center", shadowColor: palette.yellow, shadowOpacity: 0.25, shadowRadius: 18 },
  logoIcon: { color: "#111111", fontWeight: "900", fontSize: 20 },
  logoText: { color: "#FFFFFF", fontWeight: "900", fontSize: 19, letterSpacing: -0.5 },
  logoSub: { color: "#8B8F98", fontSize: 12, fontWeight: "700" },
  refreshButton: { marginLeft: "auto", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: "#18211A", borderWidth: 1, borderColor: "#284C33" },
  refreshText: { color: "#8EF0A5", fontWeight: "800" },
  inlineError: { marginHorizontal: 18, marginTop: 10, color: "#FFB4A8", fontWeight: "700" },
  hello: { color: "#B8BDC7", fontSize: 15, fontWeight: "700" },
  pageTitle: { color: "#FFFFFF", fontSize: 30, lineHeight: 34, fontWeight: "900", letterSpacing: -0.8 },
  card: { backgroundColor: palette.panel, borderRadius: 26, padding: 16, gap: 12, borderWidth: 1, borderColor: palette.stroke },
  yellowCard: { backgroundColor: palette.yellow, borderColor: palette.yellow },
  heroLabel: { color: "#4B3900", fontSize: 12, fontWeight: "900", letterSpacing: 1.2, textTransform: "uppercase" },
  heroTitle: { color: "#111111", fontSize: 28, lineHeight: 32, fontWeight: "900" },
  heroCopy: { color: "#2D260D", fontSize: 15, lineHeight: 22 },
  grid: { flexDirection: "row", gap: 10 },
  serviceTile: { flex: 1, backgroundColor: "#0D1117", borderRadius: 24, padding: 15, gap: 9, borderWidth: 1, borderColor: "#303846" },
  serviceTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  serviceBody: { color: "#A8ADB6", fontSize: 13, lineHeight: 18 },
  iconBadge: { width: 42, height: 42, borderRadius: 16, backgroundColor: palette.yellow, alignItems: "center", justifyContent: "center" },
  iconBadgeGreen: { backgroundColor: "#1F8A47" },
  iconBadgeDark: { backgroundColor: "#202733", borderWidth: 1, borderColor: "#344052" },
  iconBadgeText: { color: "#111111", fontSize: 14, fontWeight: "900" },
  iconBadgeTextLight: { color: "#FFFFFF" },
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
  primaryButtonDark: { backgroundColor: "#111111" },
  primaryButtonText: { color: "#111111", fontSize: 15, fontWeight: "900" },
  primaryButtonTextDark: { color: "#FFFFFF" },
  disabledButton: { opacity: 0.55 },
  errorText: { color: "#FFB4A8", fontSize: 13, fontWeight: "700", lineHeight: 19 },
  emptyState: { borderWidth: 1, borderColor: "#323232", borderStyle: "dashed", borderRadius: 22, padding: 16, gap: 6 },
  emptyTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  mapPanel: { height: 235, borderRadius: 28, overflow: "hidden", backgroundColor: "#1E2633", borderWidth: 1, borderColor: "#3A4657" },
  realMap: { ...StyleSheet.absoluteFillObject },
  mapRouteOverlay: { ...StyleSheet.absoluteFillObject },
  mapGrid: { ...StyleSheet.absoluteFillObject, opacity: 0.11, backgroundColor: palette.yellow },
  mapRoadOne: { position: "absolute", left: -24, right: 28, top: 72, height: 5, borderRadius: 999, backgroundColor: "#526070", transform: [{ rotate: "10deg" }] },
  mapRoadTwo: { position: "absolute", left: 28, right: -30, top: 190, height: 5, borderRadius: 999, backgroundColor: "#526070", transform: [{ rotate: "-12deg" }] },
  mapRoadThree: { position: "absolute", left: 128, top: -20, bottom: -20, width: 5, borderRadius: 999, backgroundColor: "#526070", transform: [{ rotate: "18deg" }] },
  mapRoute: { position: "absolute", left: 70, right: 58, top: 130, height: 7, borderRadius: 999, backgroundColor: palette.yellow, transform: [{ rotate: "-16deg" }] },
  mapDotStart: { position: "absolute", left: 64, top: 156, width: 18, height: 18, borderRadius: 9, backgroundColor: "#FFFFFF" },
  mapDotEnd: { position: "absolute", right: 54, top: 98, width: 22, height: 22, borderRadius: 11, backgroundColor: "#F5B800" },
  mapPin: { position: "absolute", top: 22, right: 18, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#FFFFFF" },
  mapPinText: { color: "#111111", fontSize: 11, fontWeight: "900" },
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
  bottomNav: { position: "absolute", left: 12, right: 12, flexDirection: "row", gap: 6, padding: 7, borderRadius: 30, backgroundColor: "rgba(13,17,23,0.96)", borderWidth: 1, borderColor: "#344052" },
  bottomNavItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3, paddingVertical: 9, borderRadius: 22 },
  bottomNavItemActive: { backgroundColor: palette.yellow },
  bottomNavIcon: { color: "#9EA4AE", fontSize: 13, fontWeight: "900" },
  bottomNavIconActive: { color: "#111111" },
  bottomNavText: { color: "#9EA4AE", fontSize: 10, fontWeight: "900" },
  bottomNavTextActive: { color: "#111111" },
});
