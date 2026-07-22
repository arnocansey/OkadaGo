import { useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { X } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";

type Props = {
  authorizationUrl: string;
  visible: boolean;
  onSuccess: (reference: string) => void;
  onCancel: () => void;
};

export function PaystackCheckout({ authorizationUrl, visible, onSuccess, onCancel }: Props) {
  const { colors, typography } = useTheme();
  const [loading, setLoading] = useState(true);

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    headerTitle: {
      ...typography.bodyMedium,
      color: colors.text,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    loadingBar: {
      height: 2,
      backgroundColor: colors.border,
    },
    loadingFill: {
      height: "100%",
      backgroundColor: colors.primary,
      width: loading ? "60%" : "100%",
    },
  });

  function handleNavigationChange(state: { url?: string }) {
    const url = state.url ?? "";

    if (url.includes("/wallets/top-up/paystack/callback")) {
      const match = url.match(/[?&](reference|trxref)=([^&]+)/);
      if (match?.[2]) {
        onSuccess(decodeURIComponent(match[2]));
      } else {
        onCancel();
      }
    }

    if (url.includes("checkout.paystack.com") || url.includes("/wallets/top-up/paystack")) {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onCancel}>
      <SafeAreaView style={styles.overlay} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Paystack Checkout</Text>
          <Pressable style={styles.closeBtn} onPress={onCancel} accessibilityLabel="Close checkout">
            <X size={18} color={colors.text} />
          </Pressable>
        </View>
        <View style={styles.loadingBar}>
          <View style={styles.loadingFill} />
        </View>
        {authorizationUrl ? (
          <WebView
            source={{ uri: authorizationUrl }}
            onNavigationStateChange={handleNavigationChange}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            style={{ flex: 1 }}
            renderLoading={() => (
              <ActivityIndicator
                size="large"
                color={colors.primary}
                style={{ position: "absolute", top: "50%", left: "50%", marginLeft: -20, marginTop: -20 }}
              />
            )}
          />
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}
