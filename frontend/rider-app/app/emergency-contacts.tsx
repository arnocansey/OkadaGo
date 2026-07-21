import { Stack, router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pencil, Trash2 } from "lucide-react-native";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { api, phoneParts } from "@/lib/api";
import { spacing } from "@/theme/tokens";

type EmergencyContact = {
  id: string;
  name: string;
  phoneE164: string;
  relationship?: string | null;
  isPrimary?: boolean;
  isVerified?: boolean;
};

export default function EmergencyContactsScreen() {
  const { session } = useApp();
  const { colors, typography, stackHeaderOptions } = useTheme();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxxl },
        row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
        body: { flex: 1 },
        name: { ...typography.bodySemibold, color: colors.text },
        meta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
        primary: { ...typography.captionMedium, color: colors.primary, marginTop: 2 },
      }),
    [colors, typography],
  );

  const load = useCallback(async () => {
    if (!session?.token) return;
    setLoading(true);
    try {
      const overview = await api<{ contacts: EmergencyContact[] }>("/safety/overview", {
        token: session.token,
      });
      setContacts(overview.contacts ?? []);
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [session?.token]);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setEditingId(null);
    setName("");
    setPhone("");
    setRelationship("");
    setIsPrimary(false);
  }

  function startEdit(contact: EmergencyContact) {
    setEditingId(contact.id);
    setName(contact.name);
    setPhone(contact.phoneE164.replace("+233", "0"));
    setRelationship(contact.relationship ?? "");
    setIsPrimary(Boolean(contact.isPrimary));
  }

  async function saveContact() {
    if (!session?.token || !name.trim() || !phone.trim()) return;
    setSaving(true);
    try {
      const phoneData = phoneParts(phone);
      const body = {
        name: name.trim(),
        phoneE164: phoneData.phoneE164,
        relationship: relationship.trim() || undefined,
        isPrimary,
      };
      if (editingId) {
        await api(`/safety/contacts/${editingId}`, {
          method: "PATCH",
          token: session.token,
          body,
        });
      } else {
        await api("/safety/contacts", { method: "POST", token: session.token, body });
      }
      resetForm();
      await load();
    } catch (e) {
      Alert.alert("Save failed", e instanceof Error ? e.message : "Could not save contact.");
    } finally {
      setSaving(false);
    }
  }

  async function removeContact(contactId: string) {
    if (!session?.token) return;
    Alert.alert("Delete contact", "Remove this emergency contact?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void api(`/safety/contacts/${contactId}`, {
            method: "DELETE",
            token: session.token,
          })
            .then(load)
            .catch((e) =>
              Alert.alert("Delete failed", e instanceof Error ? e.message : "Could not delete contact."),
            );
        },
      },
    ]);
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Emergency contacts", ...stackHeaderOptions }} />
      <SafeAreaView style={styles.screen} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.content}>
          <Card stacked>
            <Text style={styles.name}>{editingId ? "Edit contact" : "Add contact"}</Text>
            <Input label="Name" value={name} onChangeText={setName} placeholder="Ama Mensah" />
            <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="024 123 4567" />
            <Input label="Relationship" value={relationship} onChangeText={setRelationship} placeholder="Sister" />
            <Button
              label={isPrimary ? "Primary contact ✓" : "Set as primary"}
              variant={isPrimary ? "secondary" : "outline"}
              onPress={() => setIsPrimary((v) => !v)}
              fullWidth
            />
            <Button label={editingId ? "Update contact" : "Add contact"} loading={saving} onPress={() => void saveContact()} fullWidth />
            {editingId ? <Button label="Cancel edit" variant="ghost" onPress={resetForm} fullWidth /> : null}
          </Card>

          {loading ? (
            <Text style={styles.meta}>Loading contacts…</Text>
          ) : contacts.length === 0 ? (
            <Text style={styles.meta}>No emergency contacts yet.</Text>
          ) : (
            contacts.map((contact) => (
              <Card key={contact.id} stacked>
                <View style={styles.row}>
                  <View style={styles.body}>
                    <Text style={styles.name}>{contact.name}</Text>
                    <Text style={styles.meta}>{contact.phoneE164}</Text>
                    {contact.relationship ? <Text style={styles.meta}>{contact.relationship}</Text> : null}
                    {contact.isPrimary ? <Text style={styles.primary}>Primary contact</Text> : null}
                  </View>
                  <Pressable onPress={() => startEdit(contact)}>
                    <Pencil size={18} color={colors.primary} />
                  </Pressable>
                  <Pressable onPress={() => void removeContact(contact.id)}>
                    <Trash2 size={18} color={colors.danger} />
                  </Pressable>
                </View>
              </Card>
            ))
          )}

          <Button label="Back to profile" variant="outline" onPress={() => router.back()} fullWidth />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
