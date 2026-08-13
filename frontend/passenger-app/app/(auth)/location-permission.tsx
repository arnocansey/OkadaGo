import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { Svg, Defs, LinearGradient, Stop, Circle, Path, Rect, Line } from "react-native-svg";
import { ChevronLeft, MapPin } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/Button";
import { radius, spacing } from "@/theme/tokens";

const LOCATION_PROMPTED_KEY = "@okadago_passenger_location_prompted";

/* ─── Map + Motorcycle Illustration ──────────────────────────────────────── */

function MapMotorcycleIllustration({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 240 240" fill="none">
      <Defs>
        <LinearGradient id="lmGrad" x1="0" y1="0" x2="240" y2="240">
          <Stop offset="0" stopColor="#facc15" />
          <Stop offset="1" stopColor="#ff6b00" />
        </LinearGradient>
        <LinearGradient id="pinGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#facc15" />
          <Stop offset="1" stopColor="#ff6b00" />
        </LinearGradient>
      </Defs>

      {/* ─── Map Base ─────────────────────────────────────── */}
      <Rect x="30" y="50" width="180" height="150" rx="16" stroke="url(#lmGrad)" strokeWidth="2.5" fill="none" opacity="0.25" />

      {/* Grid lines — streets */}
      <Line x1="30" y1="100" x2="210" y2="100" stroke="#facc15" strokeWidth="1" opacity="0.15" />
      <Line x1="30" y1="140" x2="210" y2="140" stroke="#facc15" strokeWidth="1" opacity="0.15" />
      <Line x1="90" y1="50" x2="90" y2="200" stroke="#facc15" strokeWidth="1" opacity="0.15" />
      <Line x1="150" y1="50" x2="150" y2="200" stroke="#facc15" strokeWidth="1" opacity="0.15" />

      {/* ─── Road Highlight ───────────────────────────────── */}
      <Path d="M30 120 L90 120 L90 80 L160 80 L160 120 L210 120" stroke="url(#lmGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.4" />

      {/* ─── Motorcycle (on the road) ─────────────────────── */}
      {/* Rear wheel */}
      <Circle cx="100" cy="155" r="14" stroke="url(#lmGrad)" strokeWidth="2.5" fill="none" />
      <Circle cx="100" cy="155" r="5" stroke="url(#lmGrad)" strokeWidth="1.5" fill="none" />
      {/* Front wheel */}
      <Circle cx="155" cy="155" r="14" stroke="url(#lmGrad)" strokeWidth="2.5" fill="none" />
      <Circle cx="155" cy="155" r="5" stroke="url(#lmGrad)" strokeWidth="1.5" fill="none" />
      {/* Frame */}
      <Path d="M100 155 L118 120 L145 120 L155 155" stroke="url(#lmGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Tank */}
      <Path d="M112 120 L130 108 L145 120" stroke="url(#lmGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Seat */}
      <Path d="M108 123 L95 132" stroke="url(#lmGrad)" strokeWidth="2.5" strokeLinecap="round" />
      {/* Handlebar */}
      <Path d="M145 120 L152 105 L158 100" stroke="url(#lmGrad)" strokeWidth="2" strokeLinecap="round" />
      {/* Headlight glow */}
      <Circle cx="160" cy="142" r="4" fill="#facc15" opacity="0.7" />

      {/* ─── Location Pin ─────────────────────────────────── */}
      <Path
        d="M120 55 C105 55 93 67 93 82 C93 102 120 125 120 125 C120 125 147 102 147 82 C147 67 135 55 120 55 Z"
        fill="url(#pinGrad)"
      />
      <Circle cx="120" cy="82" r="8" fill="#0B0F19" />
      <Circle cx="120" cy="82" r="4" fill="#facc15" />

      {/* ─── Pulse rings around pin ───────────────────────── */}
      <Circle cx="120" cy="82" r="16" stroke="#facc15" strokeWidth="1" fill="none" opacity="0.2" />
      <Circle cx="120" cy="82" r="24" stroke="#facc15" strokeWidth="0.8" fill="none" opacity="0.1" />
    </Svg>
  );
}

/* ─── Permission Explanation Item ────────────────────────────────────────── */

function ReasonItem({ icon, title, description, colors, typography }: {
  icon: string;
  title: string;
  description: string;
  colors: any;
  typography: any;
}) {
  return (
    <View style={{ flexDirection: "row", gap: spacing.md, alignItems: "flex-start" }}>
      <View style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.primaryLight,
        alignItems: "center",
        justifyContent: "center",
      }}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ ...typography.bodyMedium, color: colors.text }}>{title}</Text>
        <Text style={{ ...typography.caption, color: colors.textSecondary, lineHeight: 18 }}>{description}</Text>
      </View>
    </View>
  );
}

/* ─── Main Screen ────────────────────────────────────────────────────────── */

export default function LocationPermissionScreen() {
  const { colors, typography } = useTheme();
  const [loading, setLoading] = useState(false);
  const [prompted, setPrompted] = useState(false);

  /* Check if we've already prompted — skip if so */
  useEffect(() => {
    AsyncStorage.getItem(LOCATION_PROMPTED_KEY)
      .then((v) => {
        if (v === "seen") {
          setPrompted(true);
          router.replace("/(main)");
        }
      })
      .catch(() => {});
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        flex: { flex: 1 },
        scrollContent: {
          flexGrow: 1,
          paddingHorizontal: spacing.xxl,
          paddingBottom: spacing.xxl,
        },

        /* ─── Top Bar ────────────────────────────────────── */
        topBar: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        },
        backBtn: {
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.surfaceOverlay,
        },

        /* ─── Illustration ───────────────────────────────── */
        illustrationWrap: {
          alignItems: "center",
          paddingTop: spacing.xxl,
          paddingBottom: spacing.xl,
        },

        /* ─── Text Content ───────────────────────────────── */
        textSection: {
          gap: spacing.sm,
          marginBottom: spacing.xxl,
        },
        heading: {
          ...typography.h1,
          color: colors.text,
          textAlign: "center",
          marginBottom: spacing.xs,
        },
        subheading: {
          ...typography.body,
          color: colors.textSecondary,
          textAlign: "center",
          paddingHorizontal: spacing.sm,
          marginBottom: spacing.md,
        },

        /* ─── Reasons ────────────────────────────────────── */
        reasons: {
          gap: spacing.lg,
          marginBottom: spacing.xxxl,
        },

        /* ─── Actions ────────────────────────────────────── */
        actions: {
          gap: spacing.md,
          marginBottom: spacing.xl,
        },

        /* ─── Privacy Note ───────────────────────────────── */
        privacyNote: {
          alignItems: "center",
          paddingTop: spacing.xl,
          gap: spacing.xs,
        },
        privacyIcon: {
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: colors.surfaceOverlay,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing.xs,
        },
        privacyText: {
          ...typography.caption,
          color: colors.textMuted,
          textAlign: "center",
          lineHeight: 18,
          paddingHorizontal: spacing.md,
        },
      }),
    [colors, typography],
  );

  /* ─── Allow Location ────────────────────────────────────── */
  async function handleAllowLocation() {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      await AsyncStorage.setItem(LOCATION_PROMPTED_KEY, "seen");
      router.replace("/(main)");
    } catch {
      /* Even if permission denied, mark as prompted and continue */
      await AsyncStorage.setItem(LOCATION_PROMPTED_KEY, "seen");
      router.replace("/(main)");
    } finally {
      setLoading(false);
    }
  }

  /* ─── Enter Manually ────────────────────────────────────── */
  async function handleManualEntry() {
    await AsyncStorage.setItem(LOCATION_PROMPTED_KEY, "seen");
    router.replace("/(main)");
  }

  if (prompted) return null;

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {/* ─── Back Button ────────────────────────────────── */}
        <View style={styles.topBar}>
          <Pressable style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Go back">
            <ChevronLeft size={20} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─── Illustration ──────────────────────────── */}
          <View style={styles.illustrationWrap}>
            <MapMotorcycleIllustration size={200} />
          </View>

          {/* ─── Heading + Explanation ─────────────────── */}
          <View style={styles.textSection}>
            <Text style={styles.heading}>Enable Location</Text>
            <Text style={styles.subheading}>
              OkadaGo needs your location to provide the best ride experience.
            </Text>
          </View>

          {/* ─── Reasons ───────────────────────────────── */}
          <View style={styles.reasons}>
            <ReasonItem
              icon="📍"
              title="Find your exact pickup"
              description="Riders know precisely where to meet you — no confusion, no delays."
              colors={colors}
              typography={typography}
            />
            <ReasonItem
              icon="💰"
              title="Calculate accurate fares"
              description="Upfront pricing based on real distance so you always know the cost."
              colors={colors}
              typography={typography}
            />
            <ReasonItem
              icon="🏍️"
              title="Match with nearby riders"
              description="Connect with the closest available rider for the fastest pickup."
              colors={colors}
              typography={typography}
            />
          </View>

          {/* ─── Actions ───────────────────────────────── */}
          <View style={styles.actions}>
            <Button
              label={loading ? "Requesting..." : "Allow Location"}
              loading={loading}
              onPress={handleAllowLocation}
              fullWidth
              size="lg"
            />
            <Button
              label="Enter location manually"
              variant="ghost"
              onPress={handleManualEntry}
              fullWidth
              size="md"
            />
          </View>

          {/* ─── Privacy Note ──────────────────────────── */}
          <View style={styles.privacyNote}>
            <View style={styles.privacyIcon}>
              <MapPin size={16} color={colors.textMuted} />
            </View>
            <Text style={styles.privacyText}>
              Your location is only used while booking and riding. We never share it with third parties.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
