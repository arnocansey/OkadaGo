import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Bell,
  ChevronRight,
  CreditCard,
  Globe,
  HelpCircle,
  Home,
  LogOut,
  MapPin,
  Moon,
  Phone,
  Shield,
  Sun,
  User,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { Avatar } from "@/components/ui/Avatar";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";

type PassengerSettings = {
  fullName: string;
  email: string | null;
  phoneE164: string;
  preferredCurrency: string;
  defaultServiceCity: string | null;
  referralCode?: string | null;
};

function Row({
  icon: Icon,
  iconBg,
  label,
  value,
  onPress,
  colors,
  isDark,
}: {
  icon: any;
  iconBg: string;
  label: string;
  value?: string;
  onPress: () => void;
  colors: any;
  isDark: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
        opacity: pressed ? 0.6 : 1,
      })}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: iconBg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={16} color={colors.text} />
      </View>
      <Text style={{ flex: 1, fontSize: 15, fontWeight: "500", color: colors.text }}>
        {label}
      </Text>
      {value ? (
        <Text style={{ fontSize: 13, color: colors.textSecondary }}>{value}</Text>
      ) : null}
      <ChevronRight size={16} color={colors.textMuted} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { session, signOut, refreshSession } = useApp();
  const { colors, isDark, setTheme } = useTheme();
  const user = session!.user;
  const [settings, setSettings] = useState<PassengerSettings | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadSettings = useCallback(async () => {
    if (!session?.token) return;
    try {
      const data = await api<PassengerSettings>(`/passengers/users/${user.id}`, { token: session.token });
      setSettings(data);
    } catch {
      // silently fail
    }
  }, [session?.token, user.id]);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings]),
  );

  async function pickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !session?.token) return;
    const asset = result.assets[0];
    const form = new FormData();
    form.append("avatar", {
      uri: asset.uri,
      name: "avatar.jpg",
      type: "image/jpeg",
    } as any);
    try {
      await api(`/passengers/users/${user.id}/avatar`, {
        method: "POST",
        token: session.token,
        body: form,
      });
      await refreshSession();
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Could not upload avatar.");
    }
  }

  const s = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        scroll: { flex: 1 },
        content: { paddingBottom: 40 },

        /* ─── Profile Header ──────────────────────────── */
        headerCard: {
          marginHorizontal: 20,
          marginTop: 4,
          marginBottom: 20,
          backgroundColor: isDark ? colors.surface : "#FFFFFF",
          borderRadius: 20,
          padding: 20,
          alignItems: "center",
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
        },
        avatarWrap: { marginBottom: 12 },
        profileName: {
          fontSize: 20,
          fontWeight: "700",
          color: colors.text,
        },
        profilePhone: {
          fontSize: 14,
          color: colors.textSecondary,
          marginTop: 2,
        },
        verifiedBadge: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          marginTop: 6,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 12,
          backgroundColor: colors.successLight,
        },
        verifiedText: {
          fontSize: 11,
          fontWeight: "600",
          color: "#22C55E",
        },

        /* ─── Section Groups ───────────────────────────── */
        group: {
          marginHorizontal: 20,
          marginBottom: 16,
          backgroundColor: isDark ? colors.surface : "#FFFFFF",
          borderRadius: 14,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          overflow: "hidden",
        },
        groupBorder: {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
        },
        groupLabel: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 6,
        },

        /* ─── Dark Mode Row ────────────────────────────── */
        toggleRow: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 14,
          gap: 12,
        },
        toggleLabel: {
          flex: 1,
          fontSize: 15,
          fontWeight: "500",
          color: colors.text,
        },

        /* ─── Logout ────────────────────────────────────── */
        logoutRow: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 14,
          gap: 12,
        },
        logoutLabel: {
          fontSize: 15,
          fontWeight: "500",
          color: colors.danger,
        },
      }),
    [colors, isDark],
  );

  const iconBg = (c: string) => c;

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await loadSettings();
              setRefreshing(false);
            }}
            tintColor={colors.primary}
          />
        }
      >
        <ScreenHeader title="Profile" onBack={() => router.replace("/(main)")} />

        {/* ─── Profile Header ──────────────────────────── */}
        <View style={s.headerCard}>
          <Pressable style={s.avatarWrap} onPress={pickAvatar}>
            <Avatar name={user.fullName} size={72} imageUri={user.avatarUrl ?? undefined} />
          </Pressable>
          <Text style={s.profileName}>{user.fullName}</Text>
          <Text style={s.profilePhone}>{settings?.phoneE164 ?? ""}</Text>
        </View>

        {/* ─── Account ──────────────────────────────────── */}
        <Text style={s.groupLabel}>Account</Text>
        <View style={s.group}>
          <Row
            icon={User}
            iconBg="#EFF6FF"
            label="Edit profile"
            onPress={() => router.push("/edit-profile")}
            colors={colors}
            isDark={isDark}
          />
          <View style={s.groupBorder} />
          <Row
            icon={Phone}
            iconBg="#F0FDF4"
            label="Phone number"
            value={settings?.phoneE164}
            onPress={() => router.push("/edit-profile")}
            colors={colors}
            isDark={isDark}
          />
          <View style={s.groupBorder} />
          <Row
            icon={Home}
            iconBg="#FEF3C7"
            label="Saved places"
            onPress={() => router.push("/saved-places")}
            colors={colors}
            isDark={isDark}
          />
        </View>

        {/* ─── Payments ─────────────────────────────────── */}
        <Text style={s.groupLabel}>Payments</Text>
        <View style={s.group}>
          <Row
            icon={CreditCard}
            iconBg="#EDE9FE"
            label="Payment methods"
            onPress={() => router.push("/wallet")}
            colors={colors}
            isDark={isDark}
          />
          <View style={s.groupBorder} />
          <Row
            icon={Globe}
            iconBg="#F0FDF4"
            label="Currency"
            value={settings?.preferredCurrency ?? "GHS"}
            onPress={() => router.push("/edit-profile")}
            colors={colors}
            isDark={isDark}
          />
        </View>

        {/* ─── Safety ───────────────────────────────────── */}
        <Text style={s.groupLabel}>Safety</Text>
        <View style={s.group}>
          <Row
            icon={Shield}
            iconBg="#FEF2F2"
            label="Emergency contacts"
            onPress={() => router.push("/emergency-contacts")}
            colors={colors}
            isDark={isDark}
          />
          <View style={s.groupBorder} />
          <Row
            icon={MapPin}
            iconBg="#EFF6FF"
            label="Trusted contacts"
            onPress={() => {}}
            colors={colors}
            isDark={isDark}
          />
        </View>

        {/* ─── Notifications ────────────────────────────── */}
        <Text style={s.groupLabel}>Notifications</Text>
        <View style={s.group}>
          <Row
            icon={Bell}
            iconBg="#FEF3C7"
            label="Notification settings"
            onPress={() => router.push("/notifications")}
            colors={colors}
            isDark={isDark}
          />
        </View>

        {/* ─── Support ──────────────────────────────────── */}
        <Text style={s.groupLabel}>Support</Text>
        <View style={s.group}>
          <Row
            icon={HelpCircle}
            iconBg="#EDE9FE"
            label="Help center"
            onPress={() => router.push("/support")}
            colors={colors}
            isDark={isDark}
          />
        </View>

        {/* ─── Preferences ──────────────────────────────── */}
        <Text style={s.groupLabel}>Preferences</Text>
        <View style={s.group}>
          <View style={s.toggleRow}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isDark ? (
                <Moon size={16} color={colors.primary} />
              ) : (
                <Sun size={16} color="#D97706" />
              )}
            </View>
            <Text style={s.toggleLabel}>Dark mode</Text>
            <Switch
              value={isDark}
              onValueChange={(v) => setTheme(v ? "dark" : "light")}
              trackColor={{ false: "#D1D5DB", true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* ─── Logout ────────────────────────────────────── */}
        <View style={s.group}>
          <Pressable
            style={s.logoutRow}
            onPress={() => setShowLogoutConfirm(true)}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: colors.dangerLight,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LogOut size={16} color={colors.danger} />
            </View>
            <Text style={s.logoutLabel}>Sign out</Text>
          </Pressable>
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={showLogoutConfirm}
        title="Sign out?"
        message="You'll need to sign in again to use the app."
        confirmLabel="Sign out"
        destructive
        onConfirm={() => {
          setShowLogoutConfirm(false);
          signOut();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </SafeAreaView>
  );
}
