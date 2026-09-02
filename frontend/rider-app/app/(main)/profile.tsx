import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronRight,
  FileText,
  Headphones,
  Pencil,
  PhoneCall,
  Shield,
  ShieldAlert,
  Settings,
  Star,
  Camera,
  Bell,
  CheckCircle2,
  Clock,
  Copy,
  Hash,
  CreditCard,
  Award,
  TrendingUp,
} from "lucide-react-native";
import { MotorcycleIcon } from "@/components/icons/MotorcycleIcon";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { NavigationHeader } from "@/components/ScreenHeader";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";
import { brand, layers } from "@/theme/design-system";

type RiderProfile = {
  id: string;
  okadaGoId: string;
  fullName: string;
  phone: string;
  avatarUrl?: string;
  rating?: number;
  totalTrips?: number;
  memberSince?: string;
  riderApprovalStatus?: string;
  isIdVerified?: boolean;
  isBackgroundChecked?: boolean;
  motorcycle?: {
    make: string;
    model: string;
    year: number;
    color: string;
    plateNumber: string;
    insuranceExpiry?: string;
  };
  accountStatus: "ACTIVE" | "SUSPENDED" | "PENDING_REVIEW";
};

type VerificationBadge = {
  id: string;
  label: string;
  description: string;
  verified: boolean;
  icon: React.ReactNode;
};

/**
 * RiderProfile — Professional rider profile screen.
 *
 * Layout:
 * ┌─────────────────────────────────┐
 * │  [←]  Profile           [🏠]   │
 * │  ─────────────────────────────  │
 * │                                 │
 * │         ┌─────────┐             │
 * │         │  Photo  │             │ ← Profile photo with camera button
 * │         └─────────┘             │
 * │         Kwame Asante            │
 * │         @OKD-7X4K9M            │ ← OkadaGo ID
 * │                                 │
 * │  ┌─────────────────────────────┐│
 * │  │  ⭐ 4.92  │  1,247 trips  ││ ← Stats row
 * │  └─────────────────────────────┘│
 * │                                 │
 * │  ┌─────────────────────────────┐│
 * │  │  🛡️ Verification Badges    ││ ← Trust badges
 * │  │  ───────────────────────   ││
 * │  │  ✅ Identity Verified      ││
 * │  │  ✅ Background Checked     ││
 * │  │  ✅ Phone Verified         ││
 * │  └─────────────────────────────┘│
 * │                                 │
 * │  ┌─────────────────────────────┐│
 * │  │  🏍️ Motorcycle Info        ││ ← Vehicle details
 * │  │  ───────────────────────   ││
 * │  │  Honda CB 125 (2022)       ││
 * │  │  Black • GR-1234-22        ││
 * │  │  Insurance: Valid          ││
 * │  └─────────────────────────────┘│
 * │                                 │
 * │  ┌─────────────────────────────┐│
 * │  │  📊 Account Status         ││ ← Account info
 * │  │  ───────────────────────   ││
 * │  │  Status: Active            ││
 * │  │  Member since: Jan 2024    ││
 * │  └─────────────────────────────┘│
 * │                                 │
 * │  ┌─────────────────────────────┐│
 * │  │  ⚙️ Settings & Support     ││ ← Menu items
 * │  └─────────────────────────────┘│
 * └─────────────────────────────────┘
 */
export default function ProfileScreen() {
  const { session, signOut, refreshSession } = useApp();
  const { colors, isDark, typography } = useTheme();
  const { t } = useTranslation();
  const user = session!.user;
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [riderProfile, setRiderProfile] = useState<RiderProfile | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refreshSession();
    }, [refreshSession]),
  );

  useEffect(() => {
    if (!session?.token) return;
    api<RiderProfile>("/auth/rider/profile", { token: session.token })
      .then(setRiderProfile)
      .catch(() => undefined);
  }, [session?.token]);

  // ─── Avatar Handlers ───────────────────────────────────────────
  async function pickAndUploadAvatar() {
    if (!session?.token) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo access to change your profile picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setUploadingAvatar(true);
    try {
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      await api("/auth/avatar", {
        method: "POST",
        token: session.token,
        body: { imageBase64: base64 },
      });
      refreshSession();
      Alert.alert("Photo updated", "Your profile photo was saved.");
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Could not update photo.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function takePhotoAndUpload() {
    if (!session?.token) return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow camera access to take a profile photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setUploadingAvatar(true);
    try {
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      await api("/auth/avatar", {
        method: "POST",
        token: session.token,
        body: { imageBase64: base64 },
      });
      refreshSession();
      Alert.alert("Photo updated", "Your profile photo was saved.");
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Could not update photo.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  function showAvatarOptions() {
    Alert.alert(t("profile.changePhoto"), t("profile.choosePhotoOption"), [
      { text: t("common.takePhoto"), onPress: takePhotoAndUpload },
      { text: t("common.chooseFromLibrary"), onPress: pickAndUploadAvatar },
      { text: t("common.cancel"), style: "cancel" },
    ]);
  }

  // ─── Copy OkadaGo ID ───────────────────────────────────────────
  function copyOkadaGoId() {
    if (!riderProfile?.okadaGoId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Copied", "OkadaGo ID copied to clipboard.");
  }

  // ─── Verification Badges ───────────────────────────────────────
  const verificationBadges: VerificationBadge[] = useMemo(
    () => [
      {
        id: "identity",
        label: "Identity Verified",
        description: "Government-issued ID verified",
        verified: riderProfile?.isIdVerified ?? false,
        icon: <Shield size={16} color={brand.primary} />,
      },
      {
        id: "background",
        label: "Background Checked",
        description: "Criminal background screening passed",
        verified: riderProfile?.isBackgroundChecked ?? false,
        icon: <ShieldAlert size={16} color={brand.primary} />,
      },
    ],
    [riderProfile, user],
  );

  const verifiedCount = verificationBadges.filter((b) => b.verified).length;

  // ─── Account Status Config ─────────────────────────────────────
  const accountStatusConfig = useMemo(() => {
    const status = riderProfile?.accountStatus ?? "ACTIVE";
    switch (status) {
      case "ACTIVE":
        return {
          label: "Active",
          color: "#22C55E",
          bgColor: "#22C55E15",
          description: "Your account is in good standing",
        };
      case "SUSPENDED":
        return {
          label: "Suspended",
          color: "#EF4444",
          bgColor: "#EF444415",
          description: "Your account has been suspended",
        };
      case "PENDING_REVIEW":
        return {
          label: "Pending Review",
          color: "#F59E0B",
          bgColor: "#F59E0B15",
          description: "Your account is under review",
        };
      default:
        return {
          label: status,
          color: colors.textMuted,
          bgColor: colors.surfaceOverlay,
          description: "",
        };
    }
  }, [riderProfile, colors]);

  // ─── Spacing (8px grid) ────────────────────────────────────────
  const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  };

  // ─── Styles ────────────────────────────────────────────────────
  const s = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        content: {
          padding: spacing.xl,
          gap: spacing.lg,
          paddingBottom: spacing.xxxl,
        },

        /* ─── Hero Section ──────────────────────────────────────── */
        hero: {
          alignItems: "center",
          paddingVertical: spacing.lg,
        },
        avatarWrap: {
          position: "relative",
          marginBottom: spacing.md,
        },
        avatar: {
          width: 96,
          height: 96,
          borderRadius: 48,
          borderWidth: 3,
          borderColor: brand.primary,
        },
        cameraBtn: {
          position: "absolute",
          bottom: 0,
          right: 0,
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: brand.primary,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 2,
          borderColor: colors.background,
        },
        name: {
          fontSize: 24,
          fontWeight: "700",
          color: colors.text,
          marginBottom: 4,
        },
        okadaGoId: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          backgroundColor: colors.surfaceOverlay,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 16,
          marginBottom: spacing.md,
        },
        okadaGoIdText: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.primary,
          fontFamily: "monospace",
        },
        copyIcon: {
          marginLeft: 4,
        },

        /* ─── Stats Row ─────────────────────────────────────────── */
        statsRow: {
          flexDirection: "row",
          gap: 12,
          marginBottom: spacing.sm,
        },
        statCard: {
          flex: 1,
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: spacing.lg,
          alignItems: "center",
          borderWidth: 1,
          borderColor: colors.border,
        },
        statIcon: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: brand.primary + "20",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing.sm,
        },
        statValue: {
          fontSize: 20,
          fontWeight: "700",
          color: colors.text,
          marginBottom: 2,
        },
        statLabel: {
          fontSize: 12,
          fontWeight: "500",
          color: colors.textSecondary,
        },

        /* ─── Section Card ──────────────────────────────────────── */
        sectionCard: {
          backgroundColor: colors.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: "hidden",
        },
        sectionHeader: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          padding: spacing.lg,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        sectionIcon: {
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: brand.primary + "20",
          alignItems: "center",
          justifyContent: "center",
        },
        sectionTitle: {
          flex: 1,
          fontSize: 16,
          fontWeight: "600",
          color: colors.text,
        },
        sectionBadge: {
          backgroundColor: brand.primary,
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: 10,
        },
        sectionBadgeText: {
          fontSize: 12,
          fontWeight: "700",
          color: "#000000",
        },
        sectionBody: {
          padding: spacing.lg,
        },

        /* ─── Verification Badges ───────────────────────────────── */
        badgeRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingVertical: 10,
        },
        badgeDivider: {
          height: 1,
          backgroundColor: colors.border,
          marginLeft: 44,
        },
        badgeIcon: {
          width: 32,
          height: 32,
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
        },
        badgeText: {
          flex: 1,
        },
        badgeLabel: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.text,
        },
        badgeDescription: {
          fontSize: 12,
          fontWeight: "400",
          color: colors.textSecondary,
          marginTop: 1,
        },
        badgeStatus: {
          width: 20,
          height: 20,
          borderRadius: 10,
          alignItems: "center",
          justifyContent: "center",
        },

        /* ─── Motorcycle Info ───────────────────────────────────── */
        motorcycleRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingVertical: 8,
        },
        motorcycleLabel: {
          fontSize: 12,
          fontWeight: "500",
          color: colors.textSecondary,
          width: 80,
        },
        motorcycleValue: {
          flex: 1,
          fontSize: 14,
          fontWeight: "600",
          color: colors.text,
        },

        /* ─── Account Status ────────────────────────────────────── */
        statusRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingVertical: 8,
        },
        statusDot: {
          width: 10,
          height: 10,
          borderRadius: 5,
        },
        statusLabel: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.text,
        },
        statusDescription: {
          fontSize: 12,
          fontWeight: "400",
          color: colors.textSecondary,
          marginTop: 2,
        },

        /* ─── Menu ──────────────────────────────────────────────── */
        menu: {
          padding: 0,
          overflow: "hidden",
        },
        menuRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.lg,
          padding: spacing.lg,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        menuLabel: {
          flex: 1,
          fontSize: 14,
          fontWeight: "500",
          color: colors.text,
        },
        menuIcon: {
          width: 28,
          height: 28,
          borderRadius: 8,
          backgroundColor: colors.surfaceOverlay,
          alignItems: "center",
          justifyContent: "center",
        },

        /* ─── Footer ────────────────────────────────────────────── */
        footer: {
          alignItems: "center",
          paddingTop: spacing.md,
        },
        footerText: {
          fontSize: 12,
          fontWeight: "500",
          color: colors.textMuted,
        },
      }),
    [colors, isDark, typography],
  );

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <NavigationHeader title={t("nav.profile")} showBack={false} />

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* HERO SECTION                                              */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <View style={s.hero}>
          <View style={s.avatarWrap}>
            <Avatar
              name={user.fullName}
              size={96}
              imageUri={riderProfile?.avatarUrl ?? user.avatarUrl ?? undefined}
            />
            <Pressable
              style={s.cameraBtn}
              onPress={showAvatarOptions}
              disabled={uploadingAvatar}
              hitSlop={8}
              accessibilityLabel="Change profile photo"
              accessibilityRole="button"
            >
              <Camera size={14} color="#000000" />
            </Pressable>
          </View>

          <Text style={s.name}>{riderProfile?.fullName ?? user.fullName}</Text>

          {riderProfile?.okadaGoId && (
            <Pressable style={s.okadaGoId} onPress={copyOkadaGoId}>
              <Hash size={12} color={colors.primary} />
              <Text style={s.okadaGoIdText}>{riderProfile.okadaGoId}</Text>
              <Copy size={12} color={colors.textMuted} style={s.copyIcon} />
            </Pressable>
          )}
        </View>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* STATS ROW                                                  */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <View style={s.statIcon}>
              <Star size={20} color={brand.primary} fill={brand.primary} />
            </View>
            <Text style={s.statValue}>
              {typeof riderProfile?.rating === "number" && Number.isFinite(riderProfile.rating) ? riderProfile.rating.toFixed(1) : "—"}
            </Text>
            <Text style={s.statLabel}>Rating</Text>
          </View>

          <View style={s.statCard}>
            <View style={s.statIcon}>
              <TrendingUp size={20} color={brand.primary} />
            </View>
            <Text style={s.statValue}>
              {riderProfile?.totalTrips?.toLocaleString() ?? "—"}
            </Text>
            <Text style={s.statLabel}>Trips</Text>
          </View>

          <View style={s.statCard}>
            <View style={s.statIcon}>
              <Award size={20} color={brand.primary} />
            </View>
            <Text style={s.statValue}>{verifiedCount}/3</Text>
            <Text style={s.statLabel}>Verified</Text>
          </View>
        </View>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* VERIFICATION BADGES                                        */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <View style={s.sectionCard}>
          <View style={s.sectionHeader}>
            <View style={s.sectionIcon}>
              <Shield size={16} color={brand.primary} />
            </View>
            <Text style={s.sectionTitle}>Verification</Text>
            <View style={s.sectionBadge}>
              <Text style={s.sectionBadgeText}>
                {verifiedCount}/3
              </Text>
            </View>
          </View>

          <View style={s.sectionBody}>
            {verificationBadges.map((badge, index) => (
              <View key={badge.id}>
                <View style={s.badgeRow}>
                  <View
                    style={[
                      s.badgeIcon,
                      {
                        backgroundColor: badge.verified
                          ? "#22C55E20"
                          : colors.surfaceOverlay,
                      },
                    ]}
                  >
                    {badge.icon}
                  </View>
                  <View style={s.badgeText}>
                    <Text style={s.badgeLabel}>{badge.label}</Text>
                    <Text style={s.badgeDescription}>{badge.description}</Text>
                  </View>
                  <View
                    style={[
                      s.badgeStatus,
                      {
                        backgroundColor: badge.verified
                          ? "#22C55E"
                          : colors.surfaceOverlay,
                      },
                    ]}
                  >
                    {badge.verified ? (
                      <CheckCircle2 size={14} color="#FFFFFF" />
                    ) : (
                      <Clock size={14} color={colors.textMuted} />
                    )}
                  </View>
                </View>
                {index < verificationBadges.length - 1 && (
                  <View style={s.badgeDivider} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* MOTORCYCLE INFORMATION                                     */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {riderProfile?.motorcycle && (
          <View style={s.sectionCard}>
            <View style={s.sectionHeader}>
              <View style={s.sectionIcon}>
                <MotorcycleIcon size={18} color={brand.primary} strokeWidth={2.2} />
              </View>
              <Text style={s.sectionTitle}>Motorcycle</Text>
            </View>

            <View style={s.sectionBody}>
              <View style={s.motorcycleRow}>
                <Text style={s.motorcycleLabel}>Make</Text>
                <Text style={s.motorcycleValue}>
                  {riderProfile.motorcycle.make}
                </Text>
              </View>
              <View style={s.motorcycleRow}>
                <Text style={s.motorcycleLabel}>Model</Text>
                <Text style={s.motorcycleValue}>
                  {riderProfile.motorcycle.model}
                </Text>
              </View>
              <View style={s.motorcycleRow}>
                <Text style={s.motorcycleLabel}>Year</Text>
                <Text style={s.motorcycleValue}>
                  {riderProfile.motorcycle.year}
                </Text>
              </View>
              <View style={s.motorcycleRow}>
                <Text style={s.motorcycleLabel}>Color</Text>
                <Text style={s.motorcycleValue}>
                  {riderProfile.motorcycle.color}
                </Text>
              </View>
              <View style={s.motorcycleRow}>
                <Text style={s.motorcycleLabel}>Plate</Text>
                <Text
                  style={[
                    s.motorcycleValue,
                    { fontFamily: "monospace", color: colors.primary },
                  ]}
                >
                  {riderProfile.motorcycle.plateNumber}
                </Text>
              </View>
              {riderProfile.motorcycle.insuranceExpiry && (
                <View style={s.motorcycleRow}>
                  <Text style={s.motorcycleLabel}>Insurance</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor:
                          new Date(riderProfile.motorcycle.insuranceExpiry) > new Date()
                            ? "#22C55E"
                            : "#EF4444",
                      }}
                    />
                    <Text style={s.motorcycleValue}>
                      {new Date(riderProfile.motorcycle.insuranceExpiry) > new Date()
                        ? `Valid until ${new Date(riderProfile.motorcycle.insuranceExpiry).toLocaleDateString()}`
                        : "Expired"}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* ACCOUNT STATUS                                             */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <View style={s.sectionCard}>
          <View style={s.sectionHeader}>
            <View style={s.sectionIcon}>
              <CreditCard size={16} color={brand.primary} />
            </View>
            <Text style={s.sectionTitle}>Account</Text>
          </View>

          <View style={s.sectionBody}>
            <View style={s.statusRow}>
              <View
                style={[s.statusDot, { backgroundColor: accountStatusConfig.color }]}
              />
              <View style={{ flex: 1 }}>
                <Text style={s.statusLabel}>{accountStatusConfig.label}</Text>
                <Text style={s.statusDescription}>
                  {accountStatusConfig.description}
                </Text>
              </View>
            </View>

            {riderProfile?.memberSince && (
              <View style={[s.motorcycleRow, { marginTop: 8 }]}>
                <Text style={s.motorcycleLabel}>Member</Text>
                <Text style={s.motorcycleValue}>
                  {new Date(riderProfile.memberSince).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* MENU ITEMS                                                 */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <View style={s.sectionCard}>
          <View style={s.sectionHeader}>
            <View style={s.sectionIcon}>
              <Settings size={16} color={brand.primary} />
            </View>
            <Text style={s.sectionTitle}>Settings & Support</Text>
          </View>

          <View style={{ padding: 0 }}>
            <Pressable
              style={s.menuRow}
              onPress={() => router.push("/notifications" as never)}
            >
              <View style={s.menuIcon}>
                <Bell size={16} color={colors.text} />
              </View>
              <Text style={s.menuLabel}>{t("profile.notifications")}</Text>
              <ChevronRight size={16} color={colors.textMuted} />
            </Pressable>

            <Pressable
              style={s.menuRow}
              onPress={() => router.push("/edit-profile")}
            >
              <View style={s.menuIcon}>
                <Pencil size={16} color={colors.text} />
              </View>
              <Text style={s.menuLabel}>{t("profile.editProfile")}</Text>
              <ChevronRight size={16} color={colors.textMuted} />
            </Pressable>

            <Pressable
              style={s.menuRow}
              onPress={() => router.push("/documents")}
            >
              <View style={s.menuIcon}>
                <FileText size={16} color={colors.text} />
              </View>
              <Text style={s.menuLabel}>{t("profile.documents")}</Text>
              <ChevronRight size={16} color={colors.textMuted} />
            </Pressable>

            <Pressable
              style={s.menuRow}
              onPress={() => router.push("/emergency-contacts")}
            >
              <View style={[s.menuIcon, { backgroundColor: "#EF444415" }]}>
                <ShieldAlert size={16} color="#EF4444" />
              </View>
              <Text style={s.menuLabel}>{t("profile.emergencyContacts")}</Text>
              <ChevronRight size={16} color={colors.textMuted} />
            </Pressable>

            <Pressable
              style={s.menuRow}
              onPress={() => router.push("/support")}
            >
              <View style={s.menuIcon}>
                <Headphones size={16} color={colors.text} />
              </View>
              <Text style={s.menuLabel}>{t("profile.supportTickets")}</Text>
              <ChevronRight size={16} color={colors.textMuted} />
            </Pressable>


            <Pressable
              style={s.menuRow}
              onPress={() => router.push("/(main)/achievements")}
            >
              <View style={[s.menuIcon, { backgroundColor: "#F59E0B15" }]}>
                <Award size={16} color="#F59E0B" />
              </View>
              <Text style={s.menuLabel}>Achievements</Text>
              <ChevronRight size={16} color={colors.textMuted} />
            </Pressable>

            <Pressable
              style={s.menuRow}
              onPress={() => router.push("/(main)/demand")}
            >
              <View style={[s.menuIcon, { backgroundColor: "#FF6B0015" }]}>
                <TrendingUp size={16} color="#FF6B00" />
              </View>
              <Text style={s.menuLabel}>Demand Map</Text>
              <ChevronRight size={16} color={colors.textMuted} />
            </Pressable>

            <Pressable
              style={s.menuRow}
              onPress={() => router.push("/(main)/performance")}
            >
              <View style={s.menuIcon}>
                <TrendingUp size={16} color={colors.text} />
              </View>
              <Text style={s.menuLabel}>Performance</Text>
              <ChevronRight size={16} color={colors.textMuted} />
            </Pressable>

            <Pressable
              style={[s.menuRow, { borderBottomWidth: 0 }]}
              onPress={() => router.push("/settings")}
            >
              <View style={s.menuIcon}>
                <Settings size={16} color={colors.text} />
              </View>
              <Text style={s.menuLabel}>{t("profile.settings")}</Text>
              <ChevronRight size={16} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SIGN OUT                                                    */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <Button
          label={t("profile.signOut")}
          variant="outline"
          fullWidth
          onPress={() => setShowLogoutConfirm(true)}
        />

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>OkadaGo Rider v1.0.0</Text>
        </View>

        {/* Confirm Dialog */}
        <ConfirmDialog
          visible={showLogoutConfirm}
          title="Sign out"
          message="Are you sure you want to sign out? You'll need to log in again to access your account."
          confirmLabel="Sign out"
          cancelLabel={t("common.cancel")}
          destructive
          onConfirm={async () => {
            setShowLogoutConfirm(false);
            await signOut();
            router.replace("/(auth)/login");
          }}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
