import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { WebView } from "react-native-webview";
import { useTheme } from "@/context/ThemeContext";

type Props = {
  authorizationUrl: string;
  visible: boolean;
  onSuccess: (reference: string) => void;
  onCancel: () => void;
};

export function PaystackCheckout({ authorizationUrl, visible, onSuccess, onCancel }: Props) {
  const { colors, typography, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);

  const topPadding = Platform.OS === "web" ? Math.max(insets.top, 16) : 8;

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      position: "relative",
      zIndex: 1000,
      elevation: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: topPadding,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    headerTitle: {
      ...typography.bodyMedium,
      color: colors.text,
      fontWeight: "700",
    },
    closeBtn: {
      position: "relative",
      zIndex: 1001,
      elevation: 11,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    loadingBar: {
      position: "relative",
      zIndex: 999,
      height: 3,
      backgroundColor: colors.border,
    },
    loadingFill: {
      height: "100%",
      backgroundColor: colors.primary,
      width: loading ? "60%" : "100%",
    },
    webViewContainer: {
      flex: 1,
      position: "relative",
      zIndex: 1,
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
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onCancel}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.surface} />
      <SafeAreaView style={styles.overlay} edges={["top", "left", "right", "bottom"]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Paystack Checkout</Text>
          <Pressable
            style={styles.closeBtn}
            onPress={onCancel}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            accessibilityLabel="Close checkout"
          >
            <X size={20} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.loadingBar}>
          <View style={styles.loadingFill} />
        </View>

        <View style={styles.webViewContainer}>
          {authorizationUrl ? (
            Platform.OS === "web" ? (
              <iframe
                src={authorizationUrl}
                style={{ flex: 1, width: "100%", height: "100%", border: "none" } as any}
                onLoad={() => setLoading(false)}
              />
            ) : (
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
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      marginLeft: -20,
                      marginTop: -20,
                    }}
                  />
                )}
              />
            )
          ) : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
