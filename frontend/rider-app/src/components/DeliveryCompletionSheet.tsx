import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Camera,
  CheckCircle2,
  Image as ImageIcon,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { brand } from "@/theme/design-system";

type PackageData = {
  type: string;
  size: string;
  description?: string;
  weight?: string;
  fragile?: boolean;
};

type Props = {
  visible: boolean;
  deliveryId: string;
  recipientName?: string;
  recipientPhone?: string;
  dropoffAddress?: string;
  dropoffLandmark?: string;
  package?: PackageData;
  onVerified: (photoBase64?: string) => void;
  onSkip?: () => void;
  onVerify?: (pin: string) => Promise<boolean>;
};

export function DeliveryCompletionSheet({
  visible,
  deliveryId,
  recipientName,
  recipientPhone,
  dropoffAddress,
  dropoffLandmark,
  package: pkg,
  onVerified,
  onSkip,
  onVerify,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [capturingPhoto, setCapturingPhoto] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const displayName = recipientName ?? "recipient";

  useEffect(() => {
    if (visible) {
      setPin(["", "", "", ""]);
      setError(false);
      setVerified(false);
      setVerifying(false);
      setPhotoUri(null);
      setPhotoBase64(null);
    }
  }, [visible]);

  async function takePhoto() {
    setCapturingPhoto(true);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Camera access is needed to take a proof of delivery photo.",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setPhotoUri(asset.uri);
        if (asset.base64) {
          setPhotoBase64(asset.base64);
        } else {
          // Convert to base64 via fetch if not provided directly
          const response = await fetch(asset.uri);
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            const res = reader.result as string;
            setPhotoBase64(res.split(",")[1] || res);
          };
          reader.readAsDataURL(blob);
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) {
      Alert.alert("Camera Error", "Could not capture photo.");
    } finally {
      setCapturingPhoto(false);
    }
  }

  async function pickGalleryImage() {
    setCapturingPhoto(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setPhotoUri(asset.uri);
        if (asset.base64) {
          setPhotoBase64(asset.base64);
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) {
      Alert.alert("Gallery Error", "Could not select image.");
    } finally {
      setCapturingPhoto(false);
    }
  }

  function handleChange(text: string, index: number) {
    if (text.length > 1) text = text.slice(-1);
    if (!/^\d*$/.test(text)) return;

    const newPin = [...pin];
    newPin[index] = text;
    setPin(newPin);
    setError(false);

    if (text && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(key: string, index: number) {
    if (key === "Backspace" && !pin[index] && index > 0) {
      const newPin = [...pin];
      newPin[index - 1] = "";
      setPin(newPin);
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function verifyPin() {
    const code = pin.join("");
    if (code.length !== 4) {
      setError(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setVerifying(true);
    try {
      let valid = false;
      if (onVerify) {
        valid = await onVerify(code);
      } else {
        valid = true;
      }

      if (valid) {
        setVerified(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setError(true);
        setPin(["", "", "", ""]);
        inputRefs.current[0]?.focus();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {
      setError(true);
      setPin(["", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  }

  useEffect(() => {
    const code = pin.join("");
    if (code.length === 4 && !verified && !verifying) {
      verifyPin();
    }
  }, [pin]);

  function handleComplete() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onVerified(photoBase64 ?? undefined);
  }

  function handleCallRecipient() {
    if (recipientPhone) {
      const { Linking } = require("react-native");
      Linking.openURL(`tel:${recipientPhone}`);
    }
  }

  const s = useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: "rgba(0,0,0,0.6)",
        },
        sheet: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: "85%",
          backgroundColor: isDark ? "#111827" : "#FFFFFF",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.35,
          shadowRadius: 24,
          elevation: 16,
          paddingBottom: insets.bottom + 16,
        },
        content: {
          paddingHorizontal: 20,
          paddingTop: 12,
          gap: 14,
        },
        handle: {
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)",
          alignSelf: "center",
          marginBottom: 6,
        },
        header: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        headerTitle: {
          fontSize: 17,
          fontWeight: "800",
          color: colors.text,
        },
        closeBtn: {
          padding: 6,
        },

        /* ─── Recipient & Package Info ────────────────────────── */
        infoCard: {
          backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F9FAFB",
          borderRadius: 16,
          padding: 14,
          gap: 10,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "#E5E7EB",
        },
        recipientRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        recipientDetails: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          flex: 1,
        },
        avatar: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: brand.primary,
          alignItems: "center",
          justifyContent: "center",
        },
        recipientNameText: {
          fontSize: 14,
          fontWeight: "700",
          color: colors.text,
        },
        callBtn: {
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 10,
          backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB",
        },
        callText: {
          fontSize: 12,
          fontWeight: "700",
          color: brand.primary,
        },
        dropoffText: {
          fontSize: 13,
          fontWeight: "500",
          color: colors.textSecondary,
        },

        /* ─── Proof of Delivery Photo Section ─────────────────── */
        photoSection: {
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#F3F4F6",
          borderRadius: 18,
          padding: 14,
          gap: 10,
          borderWidth: 1.5,
          borderColor: photoUri ? "#22C55E" : isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB",
        },
        photoHeader: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        photoTitle: {
          fontSize: 13,
          fontWeight: "700",
          color: colors.text,
        },
        photoBadge: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
        },
        photoBadgeText: {
          fontSize: 11,
          fontWeight: "700",
          color: "#22C55E",
        },
        previewContainer: {
          height: 140,
          borderRadius: 12,
          overflow: "hidden",
          backgroundColor: "#000000",
          alignItems: "center",
          justifyContent: "center",
        },
        previewImage: {
          width: "100%",
          height: "100%",
          resizeMode: "cover",
        },
        photoActionRow: {
          flexDirection: "row",
          gap: 8,
        },
        photoBtn: {
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          paddingVertical: 10,
          borderRadius: 12,
          backgroundColor: brand.primary,
        },
        photoBtnSecondary: {
          backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB",
        },
        photoBtnText: {
          fontSize: 12,
          fontWeight: "800",
          color: "#000000",
        },
        photoBtnTextSecondary: {
          color: colors.text,
        },

        /* ─── PIN Section (Optional) ──────────────────────────── */
        pinSection: {
          alignItems: "center",
          gap: 8,
          paddingVertical: 4,
        },
        pinLabel: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.textSecondary,
        },
        pinInputs: {
          flexDirection: "row",
          gap: 8,
        },
        pinBox: {
          width: 44,
          height: 48,
          borderRadius: 12,
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6",
          borderWidth: 1.5,
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "#D1D5DB",
          fontSize: 20,
          fontWeight: "800",
          textAlign: "center",
          color: colors.text,
        },
        pinBoxActive: {
          borderColor: brand.primary,
        },
        pinBoxSuccess: {
          borderColor: "#22C55E",
          backgroundColor: isDark ? "rgba(34, 197, 94, 0.15)" : "#DCFCE7",
        },
        pinBoxError: {
          borderColor: "#EF4444",
        },

        /* ─── Final Confirmation CTA ──────────────────────────── */
        completeBtn: {
          height: 56,
          borderRadius: 18,
          backgroundColor: brand.primary,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          shadowColor: brand.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 14,
          elevation: 8,
          marginTop: 6,
        },
        completeBtnText: {
          fontSize: 16,
          fontWeight: "900",
          color: "#000000",
          letterSpacing: 0.2,
        },
      }),
    [colors, isDark, insets, photoUri],
  );

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      <Pressable style={s.backdrop} onPress={onSkip} />
      <View style={s.sheet}>
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {/* Handle */}
          <View style={s.handle} />

          {/* Header */}
          <View style={s.header}>
            <Text style={s.headerTitle}>Confirm Drop-off & Proof</Text>
            {onSkip && (
              <Pressable style={s.closeBtn} onPress={onSkip}>
                <XCircle size={20} color={colors.textMuted} />
              </Pressable>
            )}
          </View>

          {/* Recipient Card */}
          <View style={s.infoCard}>
            <View style={s.recipientRow}>
              <View style={s.recipientDetails}>
                <View style={s.avatar}>
                  <User size={16} color="#000000" />
                </View>
                <View>
                  <Text style={s.recipientNameText}>{displayName}</Text>
                  <Text style={s.dropoffText} numberOfLines={1}>
                    {dropoffAddress || "Drop-off Location"}
                  </Text>
                </View>
              </View>

              {recipientPhone && (
                <Pressable style={s.callBtn} onPress={handleCallRecipient}>
                  <Phone size={13} color={brand.primary} />
                  <Text style={s.callText}>Call</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* ─── 📸 Proof of Delivery Photo Section ───────────── */}
          <View style={s.photoSection}>
            <View style={s.photoHeader}>
              <Text style={s.photoTitle}>Proof-of-Delivery Photo</Text>
              {photoUri && (
                <View style={s.photoBadge}>
                  <CheckCircle2 size={14} color="#22C55E" />
                  <Text style={s.photoBadgeText}>Photo Ready</Text>
                </View>
              )}
            </View>

            {photoUri ? (
              <View style={s.previewContainer}>
                <Image source={{ uri: photoUri }} style={s.previewImage} />
              </View>
            ) : null}

            <View style={s.photoActionRow}>
              <Pressable
                style={s.photoBtn}
                onPress={takePhoto}
                disabled={capturingPhoto}
              >
                {capturingPhoto ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <>
                    <Camera size={16} color="#000000" />
                    <Text style={s.photoBtnText}>
                      {photoUri ? "Retake Photo" : "Take Photo (Camera)"}
                    </Text>
                  </>
                )}
              </Pressable>

              <Pressable
                style={[s.photoBtn, s.photoBtnSecondary]}
                onPress={pickGalleryImage}
                disabled={capturingPhoto}
              >
                <ImageIcon size={16} color={colors.text} />
                <Text style={[s.photoBtnText, s.photoBtnTextSecondary]}>Gallery</Text>
              </Pressable>
            </View>
          </View>

          {/* ─── 4-Digit PIN (Optional Alternative) ───────────── */}
          <View style={s.pinSection}>
            <Text style={s.pinLabel}>Or enter 4-digit recipient PIN (optional):</Text>
            <View style={s.pinInputs}>
              {[0, 1, 2, 3].map((idx) => (
                <TextInput
                  key={idx}
                  ref={(ref) => {
                    inputRefs.current[idx] = ref;
                  }}
                  style={[
                    s.pinBox,
                    pin[idx] ? s.pinBoxActive : undefined,
                    verified ? s.pinBoxSuccess : undefined,
                    error ? s.pinBoxError : undefined,
                  ]}
                  value={pin[idx]}
                  onChangeText={(text) => handleChange(text, idx)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, idx)}
                  keyboardType="number-pad"
                  maxLength={1}
                />
              ))}
            </View>
          </View>

          {/* ─── Complete Delivery Primary Button ─────────────── */}
          <Pressable style={s.completeBtn} onPress={handleComplete}>
            <CheckCircle2 size={20} color="#000000" />
            <Text style={s.completeBtnText}>CONFIRM & COMPLETE DELIVERY</Text>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}
