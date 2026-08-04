import { Stack } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { FileCheck, FileWarning, Upload } from "lucide-react-native";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";
import { spacing } from "@/theme/tokens";

type RiderDocument = {
  id: string;
  type: string;
  status: string;
  fileName: string;
  fileUrl?: string | null;
};

const DOC_TYPES: Array<{ id: string; label: string; apiType: string }> = [
  { id: "license", label: "Driver's license", apiType: "RIDER_LICENSE" },
  { id: "insurance", label: "Vehicle insurance", apiType: "INSURANCE" },
  { id: "registration", label: "Vehicle registration", apiType: "VEHICLE_REGISTRATION" },
  { id: "id", label: "National ID", apiType: "NATIONAL_ID" },
];

export default function DocumentsScreen() {
  const { session } = useApp();
  const { colors, typography, stackHeaderOptions } = useTheme();
  const [documents, setDocuments] = useState<RiderDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background, padding: spacing.xl, gap: spacing.md },
        subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg },
        card: { marginBottom: spacing.sm },
        row: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
        body: { flex: 1 },
        label: { ...typography.bodySemibold, color: colors.text },
        status: { ...typography.captionMedium, marginTop: 2, textTransform: "capitalize" },
        verified: { color: colors.success },
        pending: { color: colors.warning },
        rejected: { color: colors.danger },
        uploadBtn: { marginTop: spacing.sm },
      }),
    [colors, typography],
  );

  async function loadDocuments() {
    if (!session?.token) return;
    setLoading(true);
    try {
      const result = await api<RiderDocument[]>("/riders/documents", { token: session.token });
      setDocuments(Array.isArray(result) ? result : []);
    } catch {
      Alert.alert("Load failed", "Could not load your documents.");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, [session?.token]);

  function statusFor(type: string) {
    const doc = documents.find((item) => item.type === type);
    return doc?.status?.toLowerCase() ?? "missing";
  }

  async function uploadDocument(docType: (typeof DOC_TYPES)[number]) {
    if (!session?.token) return;

    const picked = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      base64: true,
      type: ["image/*", "application/pdf"],
    });

    if (picked.canceled || !picked.assets?.[0]?.base64) return;

    const asset = picked.assets[0];
    setUploading(docType.id);
    try {
      await api("/riders/documents", {
        method: "POST",
        token: session.token,
        body: {
          type: docType.apiType,
          fileName: asset.name ?? `${docType.id}.pdf`,
          contentType: asset.mimeType ?? "application/octet-stream",
          dataBase64: asset.base64,
        },
      });
      await loadDocuments();
      Alert.alert("Uploaded", `${docType.label} submitted for review.`);
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Could not upload document.");
    } finally {
      setUploading(null);
    }
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Documents", ...stackHeaderOptions }} />
      <SafeAreaView style={styles.screen} edges={["bottom"]}>
        <Text style={styles.subtitle}>
          Upload license, insurance, registration, and ID. Pending docs keep you offline until approved.
        </Text>
        {loading ? (
          <SkeletonList count={4} />
        ) : (
          DOC_TYPES.map((doc) => {
            const status = statusFor(doc.apiType);
            const isVerified = status === "approved";
            const isPending = status === "pending" || status === "submitted";
            return (
              <Card key={doc.id} style={styles.card}>
                <View style={styles.row}>
                  {isVerified ? (
                    <FileCheck size={22} color={colors.accent} />
                  ) : (
                    <FileWarning size={22} color={isPending ? colors.warning : colors.textMuted} />
                  )}
                  <View style={styles.body}>
                    <Text style={styles.label}>{doc.label}</Text>
                    <Text
                      style={[
                        styles.status,
                        isVerified ? styles.verified : isPending ? styles.pending : status === "rejected" ? styles.rejected : styles.pending,
                      ]}
                    >
                      {status.replace(/_/g, " ")}
                    </Text>
                  </View>
                  <Pressable onPress={() => uploadDocument(doc)} disabled={uploading === doc.id} hitSlop={12} accessibilityLabel={`Upload ${doc.label}`} accessibilityRole="button">
                    {uploading === doc.id ? (
                      <ActivityIndicator color={colors.primary} />
                    ) : (
                      <Upload size={20} color={colors.primary} />
                    )}
                  </Pressable>
                </View>
                {!isVerified ? (
                  <Button
                    label="Upload"
                    variant="outline"
                    size="md"
                    loading={uploading === doc.id}
                    style={styles.uploadBtn}
                    onPress={() => uploadDocument(doc)}
                  />
                ) : null}
              </Card>
            );
          })
        )}
      </SafeAreaView>
    </>
  );
}
