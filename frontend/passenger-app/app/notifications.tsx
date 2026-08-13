import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Bell,
  Clock,
  Gift,
  MapPin,
  Shield,
  Tag,
} from "lucide-react-native";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";

type Notification = {
  id: string;
  title: string;
  body: string;
  category: "ride" | "promotion" | "account" | "safety";
  readAt?: string | null;
  createdAt: string;
  data?: Record<string, any>;
};

const CATEGORIES = [
  { key: "all", label: "All", icon: Bell },
  { key: "ride", label: "Rides", icon: MapPin },
  { key: "promotion", label: "Promos", icon: Tag },
  { key: "account", label: "Account", icon: Shield },
] as const;

function categoryIcon(cat: string, colors: any) {
  switch (cat) {
    case "ride":
      return { icon: MapPin, color: "#3B82F6", bg: "#EFF6FF" };
    case "safety":
      return { icon: Shield, color: "#EF4444", bg: "#FEF2F2" };
    case "promotion":
      return { icon: Gift, color: "#A855F7", bg: "#FAF5FF" };
    case "account":
      return { icon: Bell, color: "#F59E0B", bg: "#FFFBEB" };
    default:
      return { icon: Bell, color: colors.textMuted, bg: colors.surfaceOverlay };
  }
}

import { useNotifications } from "@/hooks/useNotifications";

export default function NotificationsScreen() {
  const { session } = useApp();
  const { colors, isDark } = useTheme();
  const { items: notifications, loading, unreadCount, refresh, markRead, markAllRead } = useNotifications(session?.token);
  const [filter, setFilter] = useState<string>("all");

  const onRefresh = async () => {
    await refresh();
  };

  const filtered = useMemo(() => {
    if (filter === "all") return notifications;
    return notifications.filter((n) => (n.data?.category ?? n.channel?.toLowerCase()) === filter);
  }, [notifications, filter]);

  function formatTime(iso: string): string {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return "Just now";
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      const diffDay = Math.floor(diffHr / 24);
      if (diffDay < 7) return `${diffDay}d ago`;
      return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    } catch {
      return "";
    }
  }

  const s = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        scroll: { flex: 1 },
        content: { paddingBottom: 40 },

        /* ─── Filter Tabs ──────────────────────────────── */
        filterRow: {
          flexDirection: "row",
          paddingHorizontal: 20,
          gap: 8,
          marginBottom: 16,
        },
        filterTab: {
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 10,
          backgroundColor: isDark ? colors.surfaceOverlay : "#F3F4F6",
        },
        filterTabActive: {
          backgroundColor: isDark ? "rgba(250,204,21,0.12)" : "rgba(250,204,21,0.1)",
          borderWidth: 1,
          borderColor: colors.primary,
        },
        filterText: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.textMuted,
        },
        filterTextActive: {
          color: colors.primary,
        },

        /* ─── Notification Card ────────────────────────── */
        notifList: {
          paddingHorizontal: 20,
          gap: 8,
        },
        notifCard: {
          flexDirection: "row",
          backgroundColor: isDark ? colors.surface : "#FFFFFF",
          borderRadius: 14,
          padding: 14,
          gap: 12,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
        },
        notifUnread: {
          borderColor: isDark ? "rgba(250,204,21,0.2)" : "rgba(250,204,21,0.3)",
          backgroundColor: isDark ? "rgba(250,204,21,0.03)" : "rgba(250,204,21,0.02)",
        },
        notifIconWrap: {
          width: 36,
          height: 36,
          borderRadius: 10,
          alignItems: "center",
          justifyContent: "center",
        },
        notifContent: {
          flex: 1,
        },
        notifTitle: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.text,
        },
        notifBody: {
          fontSize: 13,
          color: colors.textSecondary,
          marginTop: 2,
          lineHeight: 18,
        },
        notifTime: {
          fontSize: 11,
          color: colors.textMuted,
          marginTop: 4,
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
        },
        unreadDot: {
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.primary,
          marginLeft: 4,
        },
      }),
    [colors, isDark],
  );

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <ScreenHeader title="Notifications" onBack={() => router.back()} />

        {/* ─── Header Action Row ────────────────────────── */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.primary }}>
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </Text>
          {unreadCount > 0 ? (
            <Pressable
              onPress={() => void markAllRead()}
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: isDark ? "rgba(250,204,21,0.12)" : "rgba(250,204,21,0.1)" }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.primary }}>Mark all read</Text>
            </Pressable>
          ) : null}
        </View>

        {/* ─── Filter Tabs ──────────────────────────────── */}
        <View style={s.filterRow}>
          {CATEGORIES.map(({ key, label, icon: Icon }) => {
            const isActive = filter === key;
            return (
              <Pressable
                key={key}
                style={[s.filterTab, isActive && s.filterTabActive]}
                onPress={() => setFilter(key)}
              >
                <Icon
                  size={12}
                  color={isActive ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[s.filterText, isActive && s.filterTextActive]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ─── Notifications ────────────────────────────── */}
        {loading ? (
          <SkeletonList count={4} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Bell size={28} color={colors.primary} />}
            title="No notifications"
            message="You're all caught up!"
          />
        ) : (
          <View style={s.notifList}>
            {filtered.map((notif) => {
              const categoryKey = String(notif.data?.category ?? notif.channel ?? "system").toLowerCase();
              const { icon: Icon, color, bg } = categoryIcon(categoryKey, colors);
              const isRead = !!notif.readAt;
              return (
                <Pressable
                  key={notif.id}
                  onPress={() => {
                    if (!isRead) void markRead(notif.id);
                  }}
                  style={[s.notifCard, !isRead && s.notifUnread]}
                >
                  <View style={[s.notifIconWrap, { backgroundColor: bg }]}>
                    <Icon size={16} color={color} />
                  </View>
                  <View style={s.notifContent}>
                    <Text style={s.notifTitle}>{notif.title}</Text>
                    <Text style={s.notifBody} numberOfLines={2}>
                      {notif.body}
                    </Text>
                    <View style={s.notifTime}>
                      <Clock size={10} color={colors.textMuted} />
                      <Text style={{ fontSize: 11, color: colors.textMuted }}>
                        {formatTime(notif.createdAt)}
                      </Text>
                      {!isRead ? <View style={s.unreadDot} /> : null}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
