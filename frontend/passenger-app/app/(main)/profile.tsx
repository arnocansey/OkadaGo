import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Moon, Sun } from "lucide-react-native";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";
import { radius, spacing } from "@/theme/tokens";

type PassengerSettings = {
  referralCode?: string | null;
};

export default function ProfileScreen() {
  const { session, signOut, zones } = useApp();
  const { colors, typography, isDark, setTheme } = useTheme();
  const user = session!.user;
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [friendCode, setFriendCode] = useState("");
  const [applyingReferral, setApplyingReferral] = useState(false);

  useEffect(() => {
    if (!session?.token) return;
    api<PassengerSettings>("/auth/passenger/settings", { token: session.token })
      .then((settings) => setReferralCode(settings.referralCode ?? null))
      .catch(() => setReferralCode(null));
  }, [session?.token]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxxl },
        header: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.lg },
        name: { ...typography.h2 },
        phone: { ...typography.body, color: colors.textSecondary },
        infoCard: { padding: 0, overflow: "hidden" },
        infoRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        noBorder: { borderBottomWidth: 0 },
        infoLabel: { ...typography.caption, color: colors.textMuted },
        infoValue: { ...typography.bodySemibold, color: colors.text },
        themeCard: { padding: 0, overflow: "hidden" },
        themeRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          padding: spacing.lg,
        },
        themeIcon: {
          width: 40,
          height: 40,
          borderRadius: radius.md,
          alignItems: "center",
          justifyContent: "center",
        },
        lightIconBg: { backgroundColor: colors.accentLight },
        darkIconBg: { backgroundColor: colors.borderStrong },
        themeLabel: { ...typography.bodySemibold, color: colors.text },
        themeHint: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
        referralHint: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
      }),
    [colors, typography],
  );

  async function applyReferral() {
    if (!session || !friendCode.trim()) return;
    setApplyingReferral(true);
    try {
      await api("/referrals/apply", {
        method: "POST",
        token: session.token,
        body: { referralCode: friendCode.trim() },
      });
      Alert.alert("Referral applied", "Your referral code was linked successfully.");
      setFriendCode("");
    } catch (e) {
      Alert.alert("Referral failed", e instanceof Error ? e.message : "Could not apply referral code.");
    } finally {
      setApplyingReferral(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Avatar name={user.fullName} size={80} />
          <Text style={styles.name}>{user.fullName}</Text>
          <Text style={styles.phone}>{user.phoneE164}</Text>
        </View>

        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Preferred currency</Text>
            <Text style={styles.infoValue}>{user.preferredCurrency}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Service zone</Text>
            <Text style={styles.infoValue}>{zones[0]?.name ?? "Accra"}</Text>
          </View>
          <View style={[styles.infoRow, styles.noBorder]}>
            <Text style={styles.infoLabel}>Your referral code</Text>
            <Text style={styles.infoValue}>{referralCode ?? "—"}</Text>
          </View>
        </Card>

        <Card>
          <Text style={styles.themeLabel}>Safety & account</Text>
          <Button label="Emergency contacts" variant="outline" fullWidth onPress={() => router.push("/emergency-contacts")} />
          <Button label="Saved places" variant="outline" fullWidth onPress={() => router.push("/saved-places")} />
          <Button label="Support tickets" variant="outline" fullWidth onPress={() => router.push("/support")} />
          {user.isPhoneVerified === false ? (
            <Button label="Verify phone number" fullWidth onPress={() => router.push("/(auth)/verify-phone")} />
          ) : null}
        </Card>

        <Card>
          <Text style={styles.themeLabel}>Have a friend's code?</Text>
          <Text style={styles.referralHint}>Enter a referral code to unlock rewards.</Text>
          <Input label="Referral code" value={friendCode} onChangeText={setFriendCode} autoCapitalize="characters" />
          <Button label="Apply referral" loading={applyingReferral} onPress={applyReferral} fullWidth />
        </Card>

        <Card style={styles.themeCard}>
          <View style={styles.themeRow}>
            <View style={[styles.themeIcon, isDark ? styles.darkIconBg : styles.lightIconBg]}>
              {isDark ? <Moon size={18} color={colors.text} /> : <Sun size={18} color={colors.primary} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.themeLabel}>{isDark ? "Dark mode" : "Light mode"}</Text>
              <Text style={styles.themeHint}>Toggle app appearance</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={(enabled) => setTheme(enabled ? "dark" : "light")}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor={isDark ? colors.primary : colors.surface}
            />
          </View>
        </Card>

        <Button
          label="Sign out"
          variant="outline"
          fullWidth
          onPress={async () => {
            await signOut();
            router.replace("/(auth)/login");
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
