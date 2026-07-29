import { Stack, router } from "expo-router";
import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Bell } from "lucide-react-native";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { useNotifications, type AppNotification } from "@/hooks/useNotifications";
import { compactDate } from "@/lib/api";
import { riderPathForNotificationData } from "@/lib/push";
import { spacing } from "@/theme/tokens";

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const { session } = useApp();
  const { colors, typography, stackHeaderOptions } = useTheme();
  const { items, loading, error, unreadCount, refresh, markRead, markAllRead } = useNotifications(
    session?.token,
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        content: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xxxl },
        headerActions: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: spacing.sm,
        },
        unread: { ...typography.captionMedium, color: colors.primary },
        title: { ...typography.bodySemibold, color: colors.text },
        body: { ...typography.body, color: colors.textMuted, marginTop: 4 },
        meta: { ...typography.caption, color: colors.textMuted, marginTop: 6 },
        unreadDot: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.primary,
          marginTop: 6,
        },
        row: { flexDirection: "row", gap: spacing.md },
        rowBody: { flex: 1 },
        emptyWrap: { alignItems: "center", paddingVertical: spacing.xxl, gap: spacing.md },
        emptyIcon: {
          width: 56,
          height: 56,
          borderRadius: 28,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.surface,
        },
        emptyTitle: { ...typography.bodySemibold, color: colors.text, textAlign: "center" },
        emptyBody: { ...typography.caption, color: colors.textMuted, textAlign: "center" },
        error: { ...typography.caption, color: colors.danger },
      }),
    [colors, typography],
  );

  const openItem = useCallback(
    async (item: AppNotification) => {
      if (!item.readAt) await markRead(item.id);
      const path = riderPathForNotificationData(item.data);
      router.push(path as never);
    },
    [markRead],
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t("notifications.title"), ...stackHeaderOptions }} />
      <SafeAreaView style={styles.screen} edges={["bottom"]}>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void refresh()} />}
          ListHeaderComponent={
            <View style={styles.headerActions}>
              <Text style={styles.unread}>
                {unreadCount > 0 ? t("notifications.unreadCount", { count: unreadCount }) : t("notifications.allCaughtUp")}
              </Text>
              {unreadCount > 0 ? (
                <Button
                  label={t("notifications.markAllRead")}
                  variant="outline"
                  size="md"
                  onPress={() => void markAllRead()}
                />
              ) : null}
            </View>
          }
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : error ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.error}>{error}</Text>
                <Button label={t("common.retry")} onPress={() => void refresh()} />
              </View>
            ) : (
              <View style={styles.emptyWrap}>
                <View style={styles.emptyIcon}>
                  <Bell size={24} color={colors.textMuted} />
                </View>
                <Text style={styles.emptyTitle}>{t("notifications.emptyTitle")}</Text>
                <Text style={styles.emptyBody}>{t("notifications.emptyBody")}</Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => void openItem(item)}>
              <Card>
                <View style={styles.row}>
                  <View style={styles.rowBody}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.body}>{item.body}</Text>
                    <Text style={styles.meta}>{compactDate(item.createdAt)}</Text>
                  </View>
                  {!item.readAt ? <View style={styles.unreadDot} /> : null}
                </View>
              </Card>
            </Pressable>
          )}
        />
      </SafeAreaView>
    </>
  );
}
