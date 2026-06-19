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
    !start && !end ? `pin-s+FF7A00(${center.longitude},${center.latitude})` : null,
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
  style,
  mode = "card",
}: {
  title: string;
  subtitle: string;
  start?: MapPoint | null;
  end?: MapPoint | null;
  style?: ViewStyle;
  mode?: "card" | "backdrop";
}) {
  const center = start ?? end ?? { latitude: 5.6037, longitude: -0.187 };
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

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.ink },
  content: { padding: 16, paddingBottom: 126, gap: 14 },
  mapChromeContent: { flex: 1 },
  authContent: { padding: 18, paddingBottom: 30, gap: 16 },
  authHero: { minHeight: 210, justifyContent: "flex-end", gap: 10, paddingBottom: 6 },
  brandMarkLarge: { width: 64, height: 64, borderRadius: 22, backgroundColor: palette.yellow, alignItems: "center", justifyContent: "center", shadowColor: palette.orange, shadowOpacity: 0.5, shadowRadius: 24 },
  brandIconLarge: { color: "#111111", fontSize: 30, fontWeight: "900" },
  authTitle: { color: "#FFFFFF", fontSize: 34, lineHeight: 37, fontWeight: "900", letterSpacing: -1.2 },
  modeTabs: { flexDirection: "row", padding: 4, backgroundColor: "#160B02", borderRadius: 999, borderWidth: 1, borderColor: "#4B2907" },
  modeTab: { flex: 1, paddingVertical: 11, borderRadius: 999, alignItems: "center" },
  modeTabActive: { backgroundColor: palette.yellow },
  modeTabText: { color: "#A8ADB6", fontWeight: "900" },
  modeTabTextActive: { color: "#111111" },
  apiText: { color: "#6F7682", fontSize: 11, textAlign: "center" },
  topBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#3D2207", backgroundColor: "#120900" },
  backButton: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: "#241505", borderWidth: 1, borderColor: "#6B3A08" },
  backButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  logoMark: { width: 42, height: 42, borderRadius: 16, backgroundColor: palette.yellow, alignItems: "center", justifyContent: "center", shadowColor: palette.orange, shadowOpacity: 0.45, shadowRadius: 18 },
  logoIcon: { color: "#111111", fontWeight: "900", fontSize: 20 },
  logoText: { color: "#FFFFFF", fontWeight: "900", fontSize: 19, letterSpacing: -0.5 },
  logoSub: { color: "#8B8F98", fontSize: 12, fontWeight: "700" },
  refreshButton: { marginLeft: "auto", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: "#241505", borderWidth: 1, borderColor: "#8A3D00" },
  refreshText: { color: "#FFD22E", fontWeight: "800" },
  inlineError: { marginHorizontal: 18, marginTop: 10, color: "#FFB4A8", fontWeight: "700" },
  hello: { color: "#B8BDC7", fontSize: 15, fontWeight: "700" },
  pageTitle: { color: "#FFFFFF", fontSize: 30, lineHeight: 34, fontWeight: "900", letterSpacing: -0.8 },
  card: { backgroundColor: palette.panel, borderRadius: 22, padding: 16, gap: 12, borderWidth: 1, borderColor: palette.stroke },
  yellowCard: { backgroundColor: palette.yellow, borderColor: palette.orange, shadowColor: palette.orange, shadowOpacity: 0.18, shadowRadius: 20 },
  heroLabel: { color: "#7A3200", fontSize: 12, fontWeight: "900", letterSpacing: 1.2, textTransform: "uppercase" },
  heroTitle: { color: "#111111", fontSize: 28, lineHeight: 32, fontWeight: "900" },
  heroCopy: { color: "#3A2500", fontSize: 15, lineHeight: 22 },
  grid: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, backgroundColor: palette.panelRaised, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: palette.stroke, gap: 8 },
  statLabel: { color: "#9096A0", fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  statValue: { color: "#FFFFFF", fontSize: 20, fontWeight: "900" },
  sectionHead: { gap: 6 },
  kicker: { color: palette.orange, fontSize: 12, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase" },
  sectionTitle: { color: "#FFFFFF", fontSize: 22, fontWeight: "900", letterSpacing: -0.4 },
  muted: { color: palette.muted, fontSize: 14, lineHeight: 20 },
  centerHeader: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8, marginBottom: 4 },
  centerHeaderTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" },
  blockHeaderSplit: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  linkText: { color: palette.orange, fontSize: 13, fontWeight: "900" },
  fieldWrap: { gap: 7 },
  fieldLabel: { color: "#DDE0E7", fontSize: 13, fontWeight: "800" },
  input: { minHeight: 52, borderRadius: 18, backgroundColor: "#120900", borderWidth: 1, borderColor: "#5A3208", color: "#FFFFFF", paddingHorizontal: 14, fontSize: 15, fontWeight: "700" },
  primaryButton: { minHeight: 54, borderRadius: 19, backgroundColor: palette.yellow, alignItems: "center", justifyContent: "center", paddingHorizontal: 18, shadowColor: palette.orange, shadowOpacity: 0.28, shadowRadius: 14 },
  primaryButtonDark: { backgroundColor: "#111111" },
  primaryButtonText: { color: "#111111", fontSize: 15, fontWeight: "900" },
  primaryButtonTextDark: { color: "#FFFFFF" },
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
  confirmDialogConfirmButton: { flex: 1, minHeight: 44, borderRadius: 12, backgroundColor: palette.yellow, alignItems: "center", justifyContent: "center" },
  confirmDialogConfirmButtonText: { color: "#111111", fontSize: 14, fontWeight: "900" },
  confirmDialogDangerButton: { backgroundColor: palette.red },
  confirmDialogDangerButtonText: { color: "#FFFFFF" },
  emptyState: { borderWidth: 1, borderColor: "#323232", borderStyle: "dashed", borderRadius: 22, padding: 16, gap: 6 },
  emptyTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  homeTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  locationCluster: { flexDirection: "row", alignItems: "center", gap: 5 },
  locationText: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" },
  circleButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#1C1C1E", borderWidth: 1, borderColor: "#252525", alignItems: "center", justifyContent: "center" },
  notificationDot: { position: "absolute", top: 9, right: 9, width: 9, height: 9, borderRadius: 5, backgroundColor: "#EF4444", borderWidth: 1.5, borderColor: "#252525" },
  orangeHeroCard: { minHeight: 172, backgroundColor: palette.orange, borderColor: palette.orange, overflow: "hidden" },
  heroShape: { position: "absolute", right: -35, bottom: -45, width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(17,17,17,0.12)" },
  orangeHeroTitle: { color: "#111111", fontSize: 25, lineHeight: 29, fontWeight: "900", width: "72%" },
  compactWalletCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  walletIconShell: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#252525", alignItems: "center", justifyContent: "center" },
  walletLabel: { color: palette.muted, fontSize: 12, fontWeight: "800" },
  walletAmount: { color: "#FFFFFF", fontSize: 18, fontWeight: "900", marginTop: 2 },
  walletBalanceHero: { alignItems: "center", paddingVertical: 24, overflow: "hidden" },
  walletGlowTop: { position: "absolute", top: -40, right: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(255,107,0,0.08)" },
  walletGlowBottom: { position: "absolute", bottom: -50, left: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(255,107,0,0.08)" },
  walletHeroLabel: { color: palette.muted, fontSize: 14, fontWeight: "800", marginBottom: 8 },
  walletHeroAmount: { color: "#FFFFFF", fontSize: 38, lineHeight: 43, fontWeight: "900", letterSpacing: -1.1, marginBottom: 22 },
  walletActionRow: { flexDirection: "row", justifyContent: "center", gap: 14 },
  walletAction: { alignItems: "center", gap: 8 },
  walletActionIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: "#252525", borderWidth: 1, borderColor: "#333333", alignItems: "center", justifyContent: "center" },
  walletActionIconActive: { backgroundColor: palette.orange, borderColor: palette.orange, shadowColor: palette.orange, shadowOpacity: 0.32, shadowRadius: 14 },
  walletActionLabel: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" },
  walletTxRow: { flexDirection: "row", alignItems: "center", gap: 13, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#252525" },
  walletTxIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#252525", alignItems: "center", justifyContent: "center" },
  walletTxTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  walletTxDate: { color: palette.muted, fontSize: 12, fontWeight: "700", marginTop: 3 },
  walletTxAmount: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  walletTxAmountCredit: { color: "#22C55E" },
  profileHero: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 12, marginBottom: 4 },
  profileAvatar: { width: 78, height: 78, borderRadius: 39, backgroundColor: palette.orange, borderWidth: 4, borderColor: "#252525", alignItems: "center", justifyContent: "center", shadowColor: palette.orange, shadowOpacity: 0.28, shadowRadius: 16 },
  profileAvatarText: { color: "#111111", fontSize: 24, fontWeight: "900" },
  profileName: { color: "#FFFFFF", fontSize: 25, fontWeight: "900", letterSpacing: -0.6 },
  profilePhone: { color: palette.muted, fontSize: 14, fontWeight: "700", marginTop: 3 },
  profileEditPill: { alignSelf: "flex-start", marginTop: 9, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 7, backgroundColor: "#1C1C1E", borderWidth: 1, borderColor: "rgba(255,107,0,0.35)" },
  profileEditText: { color: palette.orange, fontSize: 12, fontWeight: "900" },
  profileMenu: { gap: 9 },
  profileMenuRow: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 13, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 15, backgroundColor: "#1C1C1E", borderWidth: 1, borderColor: "#252525" },
  profileMenuIcon: { width: 30, alignItems: "center" },
  profileMenuTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  profileMenuMeta: { color: palette.muted, fontSize: 12, fontWeight: "700", marginTop: 2 },
  profileLogoutText: { color: "#EF4444", fontSize: 15, fontWeight: "900" },
  blockHeaderRow: { marginTop: 2 },
  blockTitle: { color: "#FFFFFF", fontSize: 19, fontWeight: "900" },
  serviceGridFour: { flexDirection: "row", gap: 10 },
  serviceIconTile: { flex: 1, alignItems: "center", gap: 8 },
  serviceIconBox: { width: 64, height: 64, borderRadius: 20, backgroundColor: "#1C1C1E", borderWidth: 1, borderColor: "#252525", alignItems: "center", justifyContent: "center" },
  serviceIconLabel: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  placeListCard: { padding: 0, overflow: "hidden" },
  placeRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderBottomWidth: 1, borderBottomColor: "#252525" },
  placeIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#252525", alignItems: "center", justifyContent: "center" },
  placeTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  placeSubtitle: { color: palette.muted, fontSize: 12, marginTop: 3, fontWeight: "700" },
  addPlaceText: { color: palette.orange, fontSize: 15, fontWeight: "900" },
  mapPanel: { height: 235, borderRadius: 28, overflow: "hidden", backgroundColor: "#111111", borderWidth: 1, borderColor: "#252525" },
  mapExperience: { flex: 1, minHeight: 680, backgroundColor: "#111111" },
  mapBackdrop: { ...StyleSheet.absoluteFillObject, height: undefined, borderRadius: 0, borderWidth: 0 },
  mapShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(16,8,0,0.18)" },
  mapTopOverlay: { position: "absolute", left: 16, right: 16, top: 48, gap: 14 },
  mapBackCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#1C1C1E", borderWidth: 1, borderColor: "#252525", alignItems: "center", justifyContent: "center", shadowColor: "#000000", shadowOpacity: 0.24, shadowRadius: 14 },
  routeInputCard: { backgroundColor: "#1C1C1E", borderRadius: 18, borderWidth: 1, borderColor: "#252525", padding: 16, shadowColor: "#000000", shadowOpacity: 0.24, shadowRadius: 18 },
  routeInputRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  routeDot: { width: 10, height: 10, borderRadius: 5 },
  routeInputText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900", flex: 1 },
  routeDivider: { height: 1, backgroundColor: "#252525", marginVertical: 13, marginLeft: 22 },
  mapSearchPill: { minHeight: 54, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.96)", paddingHorizontal: 16, justifyContent: "center", shadowColor: "#000000", shadowOpacity: 0.18, shadowRadius: 18 },
  mapSearchTitle: { color: "#111111", fontSize: 16, fontWeight: "900" },
  mapSearchSub: { color: "#5E6470", fontSize: 12, fontWeight: "700", marginTop: 2 },
  mapStatusRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  mapStatusPill: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "rgba(28,28,30,0.9)", borderWidth: 1, borderColor: "rgba(255,107,0,0.55)" },
  mapStatusText: { color: palette.yellow, fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.7 },
  mapCenterPin: { position: "absolute", left: "50%", top: "38%", width: 56, height: 56, marginLeft: -28, marginTop: -28, borderRadius: 28, backgroundColor: palette.yellow, borderWidth: 5, borderColor: "#FFFFFF", alignItems: "center", justifyContent: "center", shadowColor: "#000000", shadowOpacity: 0.25, shadowRadius: 18 },
  mapCenterPinText: { color: "#111111", fontSize: 18, fontWeight: "900" },
  mapBottomSheet: { position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "66%", borderTopLeftRadius: 32, borderTopRightRadius: 32, backgroundColor: "rgba(28,28,30,0.98)", borderWidth: 1, borderColor: "#252525", padding: 16, paddingBottom: 28, gap: 12, shadowColor: "#000000", shadowOpacity: 0.32, shadowRadius: 28 },
  mapSheetHandle: { alignSelf: "center", width: 52, height: 5, borderRadius: 999, backgroundColor: "#252525", marginBottom: 2 },
  mapSheetScroll: { flexGrow: 0 },
  mapSheetContent: { gap: 12, paddingBottom: 14 },
  bookFloatingCard: { backgroundColor: "rgba(28,16,4,0.97)", borderColor: "rgba(255,210,46,0.42)" },
  realMap: { ...StyleSheet.absoluteFillObject },
  mapScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(16,8,0,0.12)" },
  mapFallback: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#2A1805" },
  mapFallbackTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "900", textAlign: "center" },
  mapFallbackText: { color: "#FFDFA6", fontSize: 13, fontWeight: "700", lineHeight: 18, marginTop: 6, textAlign: "center" },
  mapPointStart: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#FFFFFF", borderWidth: 4, borderColor: palette.orange },
  mapPointEnd: { width: 26, height: 26, borderRadius: 13, backgroundColor: palette.yellow, borderWidth: 4, borderColor: "#FFFFFF" },
  mapGrid: { ...StyleSheet.absoluteFillObject, opacity: 0.13, backgroundColor: palette.yellow },
  mapRoadOne: { position: "absolute", left: -24, right: 28, top: 72, height: 5, borderRadius: 999, backgroundColor: "#A35A10", transform: [{ rotate: "10deg" }] },
  mapRoadTwo: { position: "absolute", left: 28, right: -30, top: 190, height: 5, borderRadius: 999, backgroundColor: "#A35A10", transform: [{ rotate: "-12deg" }] },
  mapRoadThree: { position: "absolute", left: 128, top: -20, bottom: -20, width: 5, borderRadius: 999, backgroundColor: "#A35A10", transform: [{ rotate: "18deg" }] },
  mapRoute: { position: "absolute", left: 70, right: 58, top: 130, height: 7, borderRadius: 999, backgroundColor: palette.orange, transform: [{ rotate: "-16deg" }] },
  mapDotStart: { position: "absolute", left: 64, top: 156, width: 18, height: 18, borderRadius: 9, backgroundColor: "#FFFFFF" },
  mapDotEnd: { position: "absolute", right: 54, top: 98, width: 22, height: 22, borderRadius: 11, backgroundColor: palette.yellow },
  mapPin: { position: "absolute", top: 22, right: 18, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#FFFFFF" },
  mapPinLarge: { top: 92, right: 18, backgroundColor: palette.yellow },
  mapPinText: { color: "#111111", fontSize: 11, fontWeight: "900" },
  mapCaption: { position: "absolute", left: 16, right: 16, bottom: 16, borderRadius: 20, padding: 14, backgroundColor: "rgba(14,14,14,0.86)" },
  mapTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" },
  mapSubtitle: { color: "#B8BDC7", fontSize: 13, marginTop: 4 },
  pill: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6, backgroundColor: "#241505", borderWidth: 1, borderColor: "#7A4209" },
  pillSuccess: { backgroundColor: "#3A1D05", borderColor: palette.orange },
  pillWarning: { backgroundColor: palette.yellow, borderColor: palette.orange },
  pillDanger: { backgroundColor: "#3D1712", borderColor: "#A9362C" },
  pillText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.7 },
  pillTextDark: { color: "#111111" },
  segmentedRow: { flexDirection: "row", gap: 10 },
  segmentedButton: { flex: 1, borderRadius: 16, paddingVertical: 13, alignItems: "center", backgroundColor: "#111111", borderWidth: 1, borderColor: "#252525" },
  segmentedButtonActive: { backgroundColor: "#252525", borderColor: palette.orange },
  segmentedText: { color: palette.muted, fontWeight: "900" },
  segmentedTextActive: { color: "#FFFFFF" },
  rideOptionCard: { flex: 1, minHeight: 78, backgroundColor: "#111111", borderRadius: 18, borderWidth: 1, borderColor: "#252525", padding: 12, gap: 8 },
  rideOptionTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  rideOptionMeta: { color: palette.muted, fontSize: 12, fontWeight: "700", textTransform: "capitalize" },
  rideOptionPrice: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  paymentSegmentRow: { flexDirection: "row", gap: 10 },
  paymentChip: { flex: 1, borderRadius: 15, paddingVertical: 12, alignItems: "center", backgroundColor: "transparent", borderWidth: 1, borderColor: "#252525" },
  paymentChipActive: { backgroundColor: "#252525", borderColor: "#252525" },
  paymentChipText: { color: palette.muted, fontWeight: "900", textTransform: "capitalize", fontSize: 12 },
  paymentChipTextActive: { color: palette.orange },
  listRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#3D2207" },
  listGlyph: { width: 42, height: 42, borderRadius: 17, backgroundColor: "#2B1808", borderWidth: 1, borderColor: "#7A3200" },
  listCopy: { flex: 1, paddingRight: 8 },
  listTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  listBody: { color: "#AAB2BF", fontSize: 13, marginTop: 4, lineHeight: 18 },
  listMeta: { color: "#737D8C", fontSize: 12, marginTop: 5, fontWeight: "700" },
  listAmount: { color: palette.orange, fontSize: 14, fontWeight: "900" },
  bottomNav: { position: "absolute", left: 12, right: 12, flexDirection: "row", gap: 6, padding: 7, borderRadius: 30, backgroundColor: "rgba(18,9,0,0.96)", borderWidth: 1, borderColor: "#7A4209" },
  bottomNavItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3, paddingVertical: 9, borderRadius: 22 },
  bottomNavItemActive: { backgroundColor: palette.yellow },
  bottomNavIcon: { color: palette.muted, fontSize: 13, fontWeight: "900" },
  bottomNavIconActive: { color: "#111111" },
  bottomNavText: { color: palette.muted, fontSize: 10, fontWeight: "900" },
  bottomNavTextActive: { color: "#111111" },
});
