import type { ReactNode } from "react";
import { ImageBackground, Pressable, StyleSheet, Text, TextInput, View, type ViewStyle } from "react-native";

type MapPoint = { latitude: number; longitude: number; label?: string };

const mapboxAccessToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";
const mapboxStyleURL = process.env.EXPO_PUBLIC_MAPBOX_STYLE_URL ?? "mapbox://styles/mapbox/streets-v12";

function mapboxStylePath(styleURL: string) {
  const mapboxPrefix = "mapbox://styles/";
  if (styleURL.startsWith(mapboxPrefix)) return styleURL.slice(mapboxPrefix.length);

  const match = styleURL.match(/styles\/v1\/([^/?#]+\/[^/?#]+)/);
  return match?.[1] ?? "mapbox/streets-v12";
}

function mapboxStaticImageUrl({
  center,
  end,
  height,
  start,
  width,
}: {
  center: MapPoint;
  end?: MapPoint | null;
  height: number;
  start?: MapPoint | null;
  width: number;
}) {
  if (!mapboxAccessToken) return "";

  const overlays = [
    start && end ? `path-6+FF7A00-0.85(${start.longitude},${start.latitude};${end.longitude},${end.latitude})` : null,
    start ? `pin-s-p+FF7A00(${start.longitude},${start.latitude})` : null,
    end ? `pin-s-d+FFD22E(${end.longitude},${end.latitude})` : null,
    !start && !end ? `pin-s-r+FF7A00(${center.longitude},${center.latitude})` : null,
  ].filter(Boolean);
  const overlaySegment = overlays.length ? `${overlays.join(",")}/` : "";
  const zoom = start && end ? 12 : 13;

  return `https://api.mapbox.com/styles/v1/${mapboxStylePath(mapboxStyleURL)}/static/${overlaySegment}${center.longitude},${center.latitude},${zoom},0/${width}x${height}@2x?access_token=${encodeURIComponent(mapboxAccessToken)}&attribution=false&logo=false`;
}

export const palette = {
  ink: "#111111",
  panel: "#1C1C1E",
  panelRaised: "#252525",
  stroke: "#252525",
  muted: "#A3A3A3",
  yellow: "#FACC15",
  orange: "#FF6B00",
  green: "#22C55E",
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
      <TextInput
        placeholderTextColor="#8B8F98"
        style={styles.input}
        accessible={true}
        accessibilityLabel={label}
        accessibilityRole="text"
        accessibilityHint={rest.placeholder?.toString()}
        {...rest}
      />
    </View>
  );
}

export function PrimaryButton({ label, onPress, disabled, dark }: { label: string; onPress: () => void; disabled?: boolean; dark?: boolean }) {
  return (
    <Pressable
      style={[styles.primaryButton, dark && styles.primaryButtonDark, disabled && styles.disabledButton]}
      onPress={onPress}
      disabled={disabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={label}
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

export function ErrorCard({ error, onRetry, dismissible, onDismiss }: { error: string; onRetry?: () => void; dismissible?: boolean; onDismiss?: () => void }) {
  return (
    <View style={styles.errorCard}>
      <View style={styles.errorContent}>
        <Text style={styles.errorCardTitle}>Error</Text>
        <Text style={styles.errorCardMessage}>{error}</Text>
      </View>
      <View style={styles.errorActions}>
        {onRetry && (
          <Pressable style={styles.errorRetryButton} onPress={onRetry} accessible={true} accessibilityRole="button" accessibilityLabel="Retry">
            <Text style={styles.errorRetryButtonText}>Retry</Text>
          </Pressable>
        )}
        {dismissible && onDismiss && (
          <Pressable style={styles.errorDismissButton} onPress={onDismiss} accessible={true} accessibilityRole="button" accessibilityLabel="Dismiss error">
            <Text style={styles.errorDismissButtonText}>×</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export function ConfirmDialog({ visible, title, message, confirmText, cancelText, onConfirm, onCancel, isDangerous }: { visible: boolean; title: string; message: string; confirmText: string; cancelText?: string; onConfirm: () => void; onCancel?: () => void; isDangerous?: boolean }) {
  if (!visible) return null;
  return (
    <View style={styles.confirmDialogOverlay}>
      <View style={styles.confirmDialog}>
        <Text style={styles.confirmDialogTitle}>{title}</Text>
        <Text style={styles.confirmDialogMessage}>{message}</Text>
        <View style={styles.confirmDialogActions}>
          <Pressable style={styles.confirmDialogCancelButton} onPress={onCancel} accessible={true} accessibilityRole="button" accessibilityLabel={cancelText || "Cancel"}>
            <Text style={styles.confirmDialogCancelButtonText}>{cancelText || "Cancel"}</Text>
          </Pressable>
          <Pressable style={[styles.confirmDialogConfirmButton, isDangerous && styles.confirmDialogDangerButton]} onPress={onConfirm} accessible={true} accessibilityRole="button" accessibilityLabel={confirmText}>
            <Text style={[styles.confirmDialogConfirmButtonText, isDangerous && styles.confirmDialogDangerButtonText]}>{confirmText}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export function MapPanel({
  title,
  subtitle,
  position,
  start,
  end,
  style,
  mode = "card",
}: {
  title: string;
  subtitle: string;
  position?: MapPoint | null;
  start?: MapPoint | null;
  end?: MapPoint | null;
  style?: ViewStyle;
  mode?: "card" | "backdrop";
}) {
  const center = start ?? end ?? position ?? { latitude: 5.6037, longitude: -0.187 };
  const staticMapUrl = mapboxStaticImageUrl({
    center,
    end,
    height: mode === "backdrop" ? 900 : 360,
    start,
    width: 900,
  });

  return (
    <View style={[styles.mapPanel, style]}>
      {staticMapUrl ? (
        <ImageBackground source={{ uri: staticMapUrl }} resizeMode="cover" style={styles.realMap}>
          <View style={styles.mapScrim} />
        </ImageBackground>
      ) : (
        <View style={styles.mapFallback}>
          <View style={styles.mapGrid} />
          <Text style={styles.mapFallbackTitle}>Mapbox token needed</Text>
          <Text style={styles.mapFallbackText}>Set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN to show the live map.</Text>
        </View>
      )}
      <View style={[styles.mapPin, mode === "backdrop" && styles.mapPinLarge]}>
        <Text style={styles.mapPinText}>GPS</Text>
      </View>
      {mode === "card" ? (
        <View style={styles.mapCaption}>
          <Text style={styles.mapTitle}>{title}</Text>
          <Text style={styles.mapSubtitle}>{subtitle}</Text>
        </View>
      ) : null}
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.ink },
  content: { padding: 16, paddingBottom: 126, gap: 14 },
  mapChromeContent: { flex: 1 },
  authContent: { padding: 18, paddingBottom: 30, gap: 16 },
  authHero: { minHeight: 210, justifyContent: "flex-end", gap: 10, paddingBottom: 6 },
  brandMarkLarge: { width: 64, height: 64, borderRadius: 22, backgroundColor: palette.orange, alignItems: "center", justifyContent: "center", shadowColor: palette.orange, shadowOpacity: 0.35, shadowRadius: 22 },
  brandIconLarge: { color: "#111111", fontSize: 30, fontWeight: "900" },
  authTitle: { color: "#FFFFFF", fontSize: 34, lineHeight: 37, fontWeight: "900", letterSpacing: -1.2 },
  modeTabs: { flexDirection: "row", padding: 4, backgroundColor: "#0D1117", borderRadius: 999, borderWidth: 1, borderColor: "#252D39" },
  modeTab: { flex: 1, paddingVertical: 11, borderRadius: 999, alignItems: "center" },
  modeTabActive: { backgroundColor: palette.orange },
  modeTabText: { color: "#A8ADB6", fontWeight: "900" },
  modeTabTextActive: { color: "#111111" },
  apiText: { color: "#6F7682", fontSize: 11, textAlign: "center" },
  liveStrip: { height: 34, backgroundColor: palette.orange, flexDirection: "row", alignItems: "center", paddingHorizontal: 18, gap: 10 },
  liveStripText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900", letterSpacing: 1 },
  liveDot: { width: 9, height: 9, borderRadius: 5, marginLeft: "auto" },
  liveDotOnline: { backgroundColor: palette.yellow },
  liveDotOffline: { backgroundColor: "#FFB4A8" },
  topBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#1E2530", backgroundColor: "#0B0F14" },
  backButton: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: "#171D26", borderWidth: 1, borderColor: "#303846" },
  backButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  logoMark: { width: 42, height: 42, borderRadius: 16, backgroundColor: palette.orange, alignItems: "center", justifyContent: "center", shadowColor: palette.orange, shadowOpacity: 0.35, shadowRadius: 18 },
  logoIcon: { color: "#111111", fontWeight: "900", fontSize: 20 },
  logoText: { color: "#FFFFFF", fontWeight: "900", fontSize: 19, letterSpacing: -0.5 },
  logoSub: { color: "#8B8F98", fontSize: 12, fontWeight: "700" },
  inlineError: { marginHorizontal: 18, marginTop: 10, color: "#FFB4A8", fontWeight: "700" },
  syncPill: { position: "absolute", alignSelf: "center", bottom: 88, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: "#1B1B1B", borderWidth: 1, borderColor: "#2A2A2A" },
  syncPillText: { color: palette.yellow, fontWeight: "900" },
  hello: { color: "#B8BDC7", fontSize: 15, fontWeight: "700" },
  pageTitle: { color: "#FFFFFF", fontSize: 30, lineHeight: 34, fontWeight: "900", letterSpacing: -0.8 },
  card: { backgroundColor: palette.panel, borderRadius: 22, padding: 16, gap: 12, borderWidth: 1, borderColor: palette.stroke },
  lockedCard: { borderColor: "#9B1C1C", backgroundColor: "#251515" },
  grid: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, backgroundColor: palette.panelRaised, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: palette.stroke, gap: 8 },
  statLabel: { color: "#9096A0", fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  statValue: { color: "#FFFFFF", fontSize: 20, fontWeight: "900" },
  sectionHead: { gap: 6 },
  kicker: { color: palette.orange, fontSize: 12, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase" },
  sectionTitle: { color: "#FFFFFF", fontSize: 22, fontWeight: "900", letterSpacing: -0.4 },
  muted: { color: palette.muted, fontSize: 14, lineHeight: 20 },
  blockHeaderSplit: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  blockTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" },
  linkText: { color: palette.orange, fontSize: 13, fontWeight: "900" },
  fieldWrap: { gap: 7 },
  fieldLabel: { color: "#DDE0E7", fontSize: 13, fontWeight: "800" },
  input: { minHeight: 52, borderRadius: 18, backgroundColor: "#0D1117", borderWidth: 1, borderColor: "#303846", color: "#FFFFFF", paddingHorizontal: 14, fontSize: 15, fontWeight: "700" },
  primaryButton: { minHeight: 54, borderRadius: 19, backgroundColor: palette.orange, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  primaryButtonText: { color: "#111111", fontSize: 15, fontWeight: "900", textTransform: "capitalize" },
  primaryButtonDark: { backgroundColor: "#111111" },
  primaryButtonTextDark: { color: palette.orange },
  disabledButton: { opacity: 0.55 },
  errorText: { color: "#FFB4A8", fontSize: 13, fontWeight: "700", lineHeight: 19 },
  errorCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, backgroundColor: "#3D1712", borderWidth: 1, borderColor: "#A9362C" },
  errorContent: { flex: 1 },
  errorCardTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  errorCardMessage: { color: "#FFB4A8", fontSize: 12, fontWeight: "700", marginTop: 4, lineHeight: 16 },
  errorActions: { flexDirection: "row", gap: 8, alignItems: "center" },
  errorRetryButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: "#252525", borderWidth: 1, borderColor: "#A9362C" },
  errorRetryButtonText: { color: "#FFB4A8", fontSize: 12, fontWeight: "900" },
  errorDismissButton: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#252525", alignItems: "center", justifyContent: "center" },
  errorDismissButtonText: { color: "#FFB4A8", fontSize: 18, fontWeight: "900", lineHeight: 20 },
  confirmDialogOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  confirmDialog: { backgroundColor: palette.panel, borderRadius: 20, padding: 20, width: "85%", maxWidth: 320, gap: 16, borderWidth: 1, borderColor: palette.stroke },
  confirmDialogTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" },
  confirmDialogMessage: { color: palette.muted, fontSize: 14, fontWeight: "700", lineHeight: 20 },
  confirmDialogActions: { flexDirection: "row", gap: 12 },
  confirmDialogCancelButton: { flex: 1, minHeight: 44, borderRadius: 12, backgroundColor: "#252525", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: palette.stroke },
  confirmDialogCancelButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  confirmDialogConfirmButton: { flex: 1, minHeight: 44, borderRadius: 12, backgroundColor: palette.orange, alignItems: "center", justifyContent: "center" },
  confirmDialogConfirmButtonText: { color: "#111111", fontSize: 14, fontWeight: "900" },
  confirmDialogDangerButton: { backgroundColor: palette.red },
  confirmDialogDangerButtonText: { color: "#FFFFFF" },
  emptyState: { borderWidth: 1, borderColor: "#323232", borderStyle: "dashed", borderRadius: 22, padding: 16, gap: 6 },
  emptyTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  circleButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#27272A", borderWidth: 1, borderColor: "#252525", alignItems: "center", justifyContent: "center" },
  notificationDot: { position: "absolute", top: 9, right: 9, width: 9, height: 9, borderRadius: 5, backgroundColor: "#EF4444", borderWidth: 1.5, borderColor: "#252525" },
  riderDashTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 },
  riderBrandPill: { flexDirection: "row", alignItems: "center", gap: 7 },
  logoMiniMark: { width: 30, height: 30, borderRadius: 9, backgroundColor: palette.orange, alignItems: "center", justifyContent: "center" },
  logoMiniText: { color: "#111111", fontSize: 15, fontWeight: "900" },
  riderBrandText: { color: "#FFFFFF", fontSize: 19, fontWeight: "900" },
  riderGreetingRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 10 },
  statusInline: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  statusGlowDot: { width: 9, height: 9, borderRadius: 5 },
  statusGlowOnline: { backgroundColor: "#22C55E", shadowColor: "#22C55E", shadowOpacity: 0.8, shadowRadius: 8 },
  statusGlowOffline: { backgroundColor: "#6B7280" },
  riderSwitch: { width: 56, height: 32, borderRadius: 16, backgroundColor: "#27272A", padding: 4, justifyContent: "center" },
  riderSwitchOnline: { backgroundColor: palette.orange },
  riderSwitchKnob: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#111111" },
  riderSwitchKnobOnline: { transform: [{ translateX: 24 }] },
  goOnlineCard: { flexDirection: "row", alignItems: "center", gap: 14, minHeight: 104 },
  goOnlineCardDark: { backgroundColor: "#27272A" },
  goOnlineCardOrange: { backgroundColor: palette.orange, borderColor: palette.orange },
  goOnlineTitle: { color: "#FFFFFF", fontSize: 21, fontWeight: "900" },
  goOnlineTitleDark: { color: "#111111" },
  goOnlineSub: { color: palette.muted, fontSize: 14, fontWeight: "700", marginTop: 4 },
  goOnlineSubDark: { color: "rgba(17,17,17,0.78)" },
  powerButton: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  powerButtonOnline: { backgroundColor: "rgba(239,68,68,0.18)" },
  powerButtonOffline: { backgroundColor: "#111111" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  performanceBars: { height: 112, flexDirection: "row", alignItems: "flex-end", gap: 8, marginTop: 6 },
  performanceBarTrack: { flex: 1, height: "100%", justifyContent: "flex-end" },
  performanceBar: { width: "100%", borderTopLeftRadius: 5, borderTopRightRadius: 5, backgroundColor: "#3F3F46" },
  performanceBarActive: { backgroundColor: palette.orange },
  performanceDays: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  performanceDay: { color: "#6B7280", fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
  earningsTabs: { flexDirection: "row", padding: 4, borderRadius: 12, backgroundColor: "#27272A", gap: 4 },
  earningsTab: { flex: 1, alignItems: "center", borderRadius: 9, paddingVertical: 9 },
  earningsTabActive: { backgroundColor: "#111111" },
  earningsTabText: { color: palette.muted, fontSize: 13, fontWeight: "900" },
  earningsTabTextActive: { color: "#FFFFFF" },
  earningsDateRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  earningsDateText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  earningsHero: { alignItems: "center", backgroundColor: "#27272A", paddingVertical: 24 },
  earningsHeroLabel: { color: palette.muted, fontSize: 12, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1 },
  earningsHeroAmount: { color: palette.orange, fontSize: 38, lineHeight: 44, fontWeight: "900", letterSpacing: -1.1, marginTop: 7 },
  earningsRideCount: { marginTop: 8, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#111111" },
  earningsRideCountText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  requestScreen: { flex: 1, minHeight: 640, marginHorizontal: -16, marginVertical: -16, backgroundColor: "#111111", justifyContent: "flex-end" },
  requestPulsePill: { position: "absolute", top: 38, alignSelf: "center", zIndex: 2, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999, backgroundColor: "rgba(17,17,17,0.92)", borderWidth: 1, borderColor: "rgba(255,107,0,0.5)" },
  requestPulseText: { color: palette.orange, fontSize: 14, fontWeight: "900" },
  fakeMapGrid: { ...StyleSheet.absoluteFillObject, backgroundColor: "#0A0A0A", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  fakeRouteLine: { width: 250, height: 5, borderRadius: 999, backgroundColor: palette.orange, transform: [{ rotate: "-38deg" }], opacity: 0.92 },
  fakeRouteStart: { position: "absolute", left: "27%", top: "58%", width: 16, height: 16, borderRadius: 8, backgroundColor: palette.orange },
  fakeRouteEnd: { position: "absolute", right: "28%", top: "32%", width: 16, height: 16, borderRadius: 8, backgroundColor: "#EF4444" },
  requestSheet: { borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: "#111111", borderTopWidth: 1, borderTopColor: "#252525", padding: 20, paddingBottom: 30, gap: 20 },
  requestFareRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  requestFare: { color: palette.orange, fontSize: 31, fontWeight: "900", marginTop: 4 },
  requestStops: { gap: 16 },
  requestStopRow: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  requestStopTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  requestStopMeta: { color: palette.muted, fontSize: 13, fontWeight: "700", marginTop: 4 },
  requestActions: { flexDirection: "row", gap: 12 },
  declineButton: { flex: 1, minHeight: 56, borderRadius: 16, borderWidth: 2, borderColor: "#252525", alignItems: "center", justifyContent: "center" },
  declineButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  acceptButton: { flex: 2, minHeight: 56, borderRadius: 16, backgroundColor: palette.orange, alignItems: "center", justifyContent: "center" },
  acceptButtonText: { color: "#111111", fontSize: 16, fontWeight: "900" },
  walletLabel: { color: palette.muted, fontSize: 13, fontWeight: "800" },
  riderWalletHero: { backgroundColor: palette.orange, borderColor: palette.orange, overflow: "hidden", padding: 22 },
  riderWalletWatermark: { position: "absolute", right: -12, bottom: -12 },
  riderWalletLabel: { color: "rgba(17,17,17,0.72)", fontSize: 12, fontWeight: "900", letterSpacing: 0.8, textTransform: "uppercase" },
  riderWalletAmount: { color: "#111111", fontSize: 37, lineHeight: 43, fontWeight: "900", letterSpacing: -1.1, marginVertical: 14 },
  payoutMethodActive: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, padding: 14, backgroundColor: "#27272A", borderWidth: 1, borderColor: "rgba(255,107,0,0.35)" },
  payoutMethodRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, padding: 14, backgroundColor: "#27272A", borderWidth: 1, borderColor: "#252525" },
  payoutMethodIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#111111", alignItems: "center", justifyContent: "center" },
  payoutMethodTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  payoutMethodMeta: { color: palette.muted, fontSize: 12, fontWeight: "700", marginTop: 3 },
  segmentedRow: { flexDirection: "row", gap: 10 },
  segmentedButton: { flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: "center", backgroundColor: "#111111", borderWidth: 1, borderColor: "#252525" },
  segmentedButtonActive: { backgroundColor: "#252525", borderColor: palette.orange },
  segmentedText: { color: palette.muted, fontSize: 11, fontWeight: "900" },
  segmentedTextActive: { color: "#FFFFFF" },
  profileHero: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 12, marginBottom: 4 },
  profileAvatar: { width: 78, height: 78, borderRadius: 39, backgroundColor: palette.orange, borderWidth: 4, borderColor: "#252525", alignItems: "center", justifyContent: "center", shadowColor: palette.orange, shadowOpacity: 0.28, shadowRadius: 16 },
  profileAvatarText: { color: "#111111", fontSize: 24, fontWeight: "900" },
  profileName: { color: "#FFFFFF", fontSize: 25, fontWeight: "900", letterSpacing: -0.6 },
  profilePhone: { color: palette.muted, fontSize: 14, fontWeight: "700", marginTop: 3, marginBottom: 8 },
  profileMenu: { gap: 9 },
  profileMenuRow: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 13, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 15, backgroundColor: "#1C1C1E", borderWidth: 1, borderColor: "#252525" },
  profileMenuIcon: { width: 30, alignItems: "center" },
  profileMenuTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  profileMenuMeta: { color: palette.muted, fontSize: 12, fontWeight: "700", marginTop: 2 },
  profileLogoutText: { color: "#EF4444", fontSize: 15, fontWeight: "900" },
  profileEditPill: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#252525" },
  profileEditText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  mapPanel: { height: 235, borderRadius: 28, overflow: "hidden", backgroundColor: "#1E2633", borderWidth: 1, borderColor: "#3A4657" },
  mapExperience: { flex: 1, minHeight: 680, backgroundColor: "#2A1805" },
  mapBackdrop: { ...StyleSheet.absoluteFillObject, height: undefined, borderRadius: 0, borderWidth: 0 },
  mapShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(7,10,14,0.16)" },
  mapTopOverlay: { position: "absolute", left: 16, right: 16, top: 14, gap: 10 },
  mapSearchPill: { minHeight: 54, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.96)", paddingHorizontal: 16, justifyContent: "center", shadowColor: "#000000", shadowOpacity: 0.18, shadowRadius: 18 },
  mapSearchTitle: { color: "#111111", fontSize: 16, fontWeight: "900" },
  mapSearchSub: { color: "#5E6470", fontSize: 12, fontWeight: "700", marginTop: 2 },
  mapStatusRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  mapStatusPill: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "rgba(13,17,23,0.9)", borderWidth: 1, borderColor: "rgba(255,210,46,0.55)" },
  mapStatusText: { color: palette.yellow, fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.7 },
  mapCenterPin: { position: "absolute", left: "50%", top: "38%", width: 56, height: 56, marginLeft: -28, marginTop: -28, borderRadius: 28, backgroundColor: palette.orange, borderWidth: 5, borderColor: "#FFFFFF", alignItems: "center", justifyContent: "center", shadowColor: "#000000", shadowOpacity: 0.25, shadowRadius: 18 },
  mapCenterPinText: { color: "#111111", fontSize: 18, fontWeight: "900" },
  mapBottomSheet: { position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "60%", borderTopLeftRadius: 32, borderTopRightRadius: 32, backgroundColor: "rgba(23,18,11,0.98)", borderWidth: 1, borderColor: "rgba(255,210,46,0.35)", padding: 16, paddingBottom: 28, gap: 12, shadowColor: "#000000", shadowOpacity: 0.24, shadowRadius: 24 },
  mapBottomSheetWithNav: { bottom: 92, maxHeight: "54%" },
  mapSheetHandle: { alignSelf: "center", width: 52, height: 5, borderRadius: 999, backgroundColor: "rgba(255,210,46,0.55)", marginBottom: 2 },
  mapSheetScroll: { flexGrow: 0 },
  mapSheetContent: { gap: 12, paddingBottom: 14 },
  realMap: { ...StyleSheet.absoluteFillObject },
  mapScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(7,10,14,0.16)" },
  mapFallback: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#2A1805" },
  mapFallbackTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "900", textAlign: "center" },
  mapFallbackText: { color: "#FFDFA6", fontSize: 13, fontWeight: "700", lineHeight: 18, marginTop: 6, textAlign: "center" },
  mapPointStart: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#FFFFFF", borderWidth: 4, borderColor: palette.orange },
  mapPointEnd: { width: 26, height: 26, borderRadius: 13, backgroundColor: palette.yellow, borderWidth: 4, borderColor: "#FFFFFF" },
  mapPointRider: { width: 28, height: 28, borderRadius: 14, backgroundColor: palette.orange, borderWidth: 5, borderColor: "#FFFFFF" },
  mapGrid: { ...StyleSheet.absoluteFillObject, opacity: 0.16, backgroundColor: palette.orange },
  mapRoute: { position: "absolute", left: 70, right: 58, top: 130, height: 7, borderRadius: 999, backgroundColor: palette.orange, transform: [{ rotate: "-16deg" }] },
  mapDotStart: { position: "absolute", left: 64, top: 156, width: 18, height: 18, borderRadius: 9, backgroundColor: "#FFFFFF" },
  mapDotEnd: { position: "absolute", right: 54, top: 98, width: 22, height: 22, borderRadius: 11, backgroundColor: palette.yellow },
  mapPin: { position: "absolute", top: 22, right: 18, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#FFFFFF" },
  mapPinLarge: { top: 92, right: 18, backgroundColor: palette.yellow },
  mapPinText: { color: "#111111", fontSize: 11, fontWeight: "900" },
  mapCaption: { position: "absolute", left: 16, right: 16, bottom: 16, borderRadius: 20, padding: 14, backgroundColor: "rgba(14,14,14,0.86)" },
  mapTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" },
  mapSubtitle: { color: "#B8BDC7", fontSize: 13, marginTop: 4 },
  pill: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6, backgroundColor: "#202733", borderWidth: 1, borderColor: "#344052" },
  pillSuccess: { backgroundColor: "#3A1D05", borderColor: palette.orange },
  pillWarning: { backgroundColor: palette.yellow, borderColor: palette.orange },
  pillDanger: { backgroundColor: "#3D1712", borderColor: "#A9362C" },
  pillText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.7 },
  pillTextDark: { color: "#111111" },
  listRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#29313D" },
  listGlyph: { width: 42, height: 42, borderRadius: 17, backgroundColor: "#2B1808", borderWidth: 1, borderColor: "#7A3200" },
  listCopy: { flex: 1, paddingRight: 8 },
  listTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  listBody: { color: "#AAB2BF", fontSize: 13, marginTop: 4, lineHeight: 18 },
  listMeta: { color: "#737D8C", fontSize: 12, marginTop: 5, fontWeight: "700" },
  listAmount: { color: palette.orange, fontSize: 14, fontWeight: "900" },
  bottomNav: { position: "absolute", left: 12, right: 12, flexDirection: "row", gap: 6, padding: 7, borderRadius: 30, backgroundColor: "rgba(13,17,23,0.96)", borderWidth: 1, borderColor: "#344052" },
  bottomNavItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3, paddingVertical: 9, borderRadius: 22 },
  bottomNavItemActive: { backgroundColor: palette.orange },
  bottomNavIcon: { color: "#9EA4AE", fontSize: 13, fontWeight: "900" },
  bottomNavIconActive: { color: "#111111" },
  bottomNavText: { color: "#9EA4AE", fontSize: 10, fontWeight: "900" },
  bottomNavTextActive: { color: "#111111" },
  quickActionGrid: { flexDirection: "row", gap: 10, marginVertical: 12 },
  quickActionButton: { flex: 1, backgroundColor: "#1C1C1E", borderWidth: 1, borderColor: "#252525", borderRadius: 16, paddingVertical: 14, paddingHorizontal: 6, alignItems: "center", justifyContent: "center", gap: 6 },
  quickActionIcon: { fontSize: 22 },
  quickActionLabel: { color: "#BBBBBB", fontSize: 10, fontWeight: "600", textAlign: "center" },
  incentiveCard: { padding: 16, backgroundColor: "#1C1C1E", borderWidth: 1, borderColor: "#252525", borderRadius: 16, gap: 8, marginBottom: 12 },
  incentiveHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  incentiveTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  incentiveReward: { color: "#FACC15", fontSize: 14, fontWeight: "900" },
  incentiveDesc: { color: "#A3A3A3", fontSize: 12 },
  progressBarTrack: { height: 6, backgroundColor: "#252525", borderRadius: 999, overflow: "hidden", marginVertical: 4 },
  progressBarFill: { height: "100%", backgroundColor: "#FACC15", borderRadius: 999 },
  incentiveProgressText: { color: "#A3A3A3", fontSize: 11, fontWeight: "700" },
  payoutMethodDashed: { borderStyle: "dashed", borderWidth: 1.5, borderColor: "#252525", borderRadius: 16, padding: 14, alignItems: "center", justifyContent: "center", marginTop: 12 },
  payoutMethodDashedText: { color: "#FACC15", fontSize: 13, fontWeight: "600" },
  rowSetting: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 15, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: "#252525" },
  rowSettingText: { color: "#FFFFFF", fontSize: 14 },
  rowSettingRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowSettingVal: { color: "#A3A3A3", fontSize: 13 },
});
