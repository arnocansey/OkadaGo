import { Pressable, StyleSheet, Text, View } from "react-native";
import { AlertTriangle, Settings } from "lucide-react-native";
import * as Linking from "expo-linking";
import { useTheme } from "@/context/ThemeContext";

type Props = {
  visible: boolean;
  type: "disabled" | "denied";
};

/**
 * GpsPermissionBanner — Shows when GPS is disabled or permission denied.
 * Prompts rider to enable location in device settings.
 */
export function GpsPermissionBanner({ visible, type }: Props) {
  const { colors, isDark } = useTheme();

  if (!visible) return null;

  const isDisabled = type === "disabled";

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: isDark ? "#1A1200" : "#FEF3C7",
          borderColor: isDisabled ? "#F59E0B" : "#EF4444",
        },
      ]}
    >
      <AlertTriangle
        size={20}
        color={isDisabled ? "#D97706" : "#DC2626"}
      />
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            { color: isDisabled ? "#92400E" : "#991B1B" },
          ]}
        >
          {isDisabled ? "Location Services Disabled" : "Location Permission Denied"}
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: isDisabled ? "#B45309" : "#B91C1C" },
          ]}
        >
          {isDisabled
            ? "Enable GPS to receive ride requests and navigate"
            : "Allow location access in settings to use OkadaGo"}
        </Text>
      </View>
      <Pressable
        style={[
          styles.btn,
          {
            backgroundColor: isDisabled ? "#F59E0B" : "#EF4444",
          },
        ]}
        onPress={() => Linking.openSettings()}
      >
        <Settings size={14} color="#FFFFFF" />
        <Text style={styles.btnText}>Settings</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 1,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
