import { Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FileCheck, FileWarning } from "lucide-react-native";
import { Card } from "@/components/ui/Card";
import { colors, spacing, typography, stackHeaderOptions } from "@/theme/tokens";

const DOCS = [
  { id: "license", label: "Driver's license", status: "verified" },
  { id: "insurance", label: "Vehicle insurance", status: "verified" },
  { id: "registration", label: "Vehicle registration", status: "pending" },
  { id: "id", label: "National ID", status: "verified" },
];

export default function DocumentsScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Documents", ...stackHeaderOptions }} />
      <SafeAreaView style={styles.screen} edges={["bottom"]}>
        <Text style={styles.subtitle}>Keep documents up to date to stay active on the platform.</Text>
        {DOCS.map((doc) => (
          <Card key={doc.id} style={styles.card}>
            <View style={styles.row}>
              {doc.status === "verified" ? (
                <FileCheck size={22} color={colors.accent} />
              ) : (
                <FileWarning size={22} color={colors.warning} />
              )}
              <View style={styles.body}>
                <Text style={styles.label}>{doc.label}</Text>
                <Text style={[styles.status, doc.status === "verified" ? styles.verified : styles.pending]}>
                  {doc.status}
                </Text>
              </View>
            </View>
          </Card>
        ))}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: spacing.xl, gap: spacing.md },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg },
  card: { marginBottom: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  body: { flex: 1 },
  label: { ...typography.bodySemibold },
  status: { ...typography.captionMedium, marginTop: 2, textTransform: "capitalize" },
  verified: { color: colors.success },
  pending: { color: colors.warning },
});
