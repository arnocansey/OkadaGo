import { Stack, router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { api, compactDate } from "@/lib/api";
import { spacing } from "@/theme/tokens";

type SupportTicket = {
  id: string;
  title: string;
  category: string;
  status: string;
  priority: string;
  description: string;
  createdAt: string;
};

export default function SupportScreen() {
  const { session } = useApp();
  const { colors, typography, stackHeaderOptions } = useTheme();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [description, setDescription] = useState("");

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxxl },
        title: { ...typography.bodySemibold, color: colors.text },
        meta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
        status: { ...typography.captionMedium, color: colors.primary, marginTop: 4, textTransform: "capitalize" },
      }),
    [colors, typography],
  );

  const load = useCallback(async () => {
    if (!session?.token) return;
    setLoading(true);
    try {
      setTickets(await api<SupportTicket[]>("/support/tickets", { token: session.token }));
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [session?.token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitTicket() {
    if (!session?.token || !title.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      await api("/support/tickets", {
        method: "POST",
        token: session.token,
        body: {
          title: title.trim(),
          category: category.trim() || "GENERAL",
          description: description.trim(),
        },
      });
      setTitle("");
      setDescription("");
      await load();
      Alert.alert("Ticket submitted", "Our support team will follow up soon.");
    } catch (e) {
      Alert.alert("Submission failed", e instanceof Error ? e.message : "Could not create ticket.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Support", ...stackHeaderOptions }} />
      <SafeAreaView style={styles.screen} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.content}>
          <Card stacked>
            <Input label="Subject" value={title} onChangeText={setTitle} placeholder="Issue with my last ride" />
            <Input label="Category" value={category} onChangeText={setCategory} placeholder="GENERAL" />
            <Input
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Tell us what happened"
              multiline
              numberOfLines={4}
            />
            <Button label="Submit ticket" loading={submitting} onPress={() => void submitTicket()} fullWidth />
          </Card>

          <Text style={styles.title}>Your tickets</Text>
          {loading ? (
            <Text style={styles.meta}>Loading tickets…</Text>
          ) : tickets.length === 0 ? (
            <Text style={styles.meta}>No support tickets yet.</Text>
          ) : (
            tickets.map((ticket) => (
              <Card key={ticket.id} stacked>
                <Text style={styles.title}>{ticket.title}</Text>
                <Text style={styles.meta}>{ticket.category} · {compactDate(ticket.createdAt)}</Text>
                <Text style={styles.status}>{ticket.status.replace(/_/g, " ").toLowerCase()}</Text>
                <Text style={styles.meta}>{ticket.description}</Text>
              </Card>
            ))
          )}

          <Button label="Back" variant="outline" onPress={() => router.back()} fullWidth />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
