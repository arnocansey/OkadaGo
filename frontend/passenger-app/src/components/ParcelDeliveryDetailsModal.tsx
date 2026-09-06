import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  Box,
  Check,
  FileText,
  KeyRound,
  Package,
  Phone,
  ShoppingBag,
  User,
  Utensils,
  X,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";

export type ParcelCategory = "document" | "parcel" | "food" | "medium";

export type ParcelDetails = {
  category: ParcelCategory;
  recipientName: string;
  recipientPhone: string;
  deliveryInstructions: string;
  requirePin: boolean;
  handoverPin: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (details: ParcelDetails) => void;
  initialDetails?: Partial<ParcelDetails>;
};

const CATEGORIES = [
  {
    id: "document" as const,
    label: "Documents",
    desc: "Letters, files & passports",
    icon: FileText,
  },
  {
    id: "parcel" as const,
    label: "Small Box",
    desc: "Shoes, gadgets, gifts (< 5kg)",
    icon: Box,
  },
  {
    id: "food" as const,
    label: "Food & Fragile",
    desc: "Takeout, pastries, cake (upright)",
    icon: Utensils,
  },
  {
    id: "medium" as const,
    label: "Medium Bag",
    desc: "Clothes, groceries (< 15kg)",
    icon: ShoppingBag,
  },
];

function generateRandomPin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export function ParcelDeliveryDetailsModal({
  visible,
  onClose,
  onConfirm,
  initialDetails,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [category, setCategory] = useState<ParcelCategory>(initialDetails?.category ?? "parcel");
  const [recipientName, setRecipientName] = useState<string>(initialDetails?.recipientName ?? "");
  const [recipientPhone, setRecipientPhone] = useState<string>(initialDetails?.recipientPhone ?? "");
  const [instructions, setInstructions] = useState<string>(
    initialDetails?.deliveryInstructions ?? "",
  );
  const [requirePin, setRequirePin] = useState<boolean>(initialDetails?.requirePin ?? true);
  const [handoverPin, setHandoverPin] = useState<string>(
    initialDetails?.handoverPin || generateRandomPin(),
  );

  useEffect(() => {
    if (initialDetails?.recipientName) setRecipientName(initialDetails.recipientName);
    if (initialDetails?.recipientPhone) setRecipientPhone(initialDetails.recipientPhone);
    if (initialDetails?.category) setCategory(initialDetails.category);
    if (initialDetails?.deliveryInstructions) setInstructions(initialDetails.deliveryInstructions);
    if (typeof initialDetails?.requirePin === "boolean") setRequirePin(initialDetails.requirePin);
  }, [initialDetails, visible]);

  const handlePhoneChange = (val: string) => {
    // Keep digits and leading +
    const cleaned = val.replace(/[^\d+]/g, "");
    setRecipientPhone(cleaned);
  };

  const handleDone = () => {
    onConfirm({
      category,
      recipientName: recipientName.trim(),
      recipientPhone: recipientPhone.trim(),
      deliveryInstructions: instructions.trim(),
      requirePin,
      handoverPin: requirePin ? handoverPin : "",
    });
    onClose();
  };

  const isComplete = recipientName.trim().length >= 2 && recipientPhone.trim().length >= 9;

  const s = useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          justifyContent: "flex-end",
        },
        sheet: {
          backgroundColor: isDark ? "#111827" : "#FFFFFF",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          maxHeight: "88%",
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: Math.max(insets.bottom + 16, 24),
          borderTopWidth: 1,
          borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)",
        },
        handle: {
          width: 42,
          height: 5,
          borderRadius: 3,
          backgroundColor: colors.borderStrong,
          alignSelf: "center",
          marginBottom: 12,
        },
        header: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        },
        headerLeft: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        },
        headerIcon: {
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: isDark ? "rgba(250, 204, 21, 0.18)" : "rgba(250, 204, 21, 0.25)",
          alignItems: "center",
          justifyContent: "center",
        },
        title: {
          fontSize: 18,
          fontWeight: "800",
          color: colors.text,
        },
        subtitle: {
          fontSize: 12,
          color: colors.textMuted,
          marginTop: 2,
        },
        closeBtn: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.surfaceOverlay,
          alignItems: "center",
          justifyContent: "center",
        },
        sectionTitle: {
          fontSize: 12,
          fontWeight: "700",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 10,
        },
        categoryGrid: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 18,
        },
        catCard: {
          flex: 1,
          minWidth: "47%",
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          padding: 12,
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: colors.border,
          backgroundColor: isDark ? "#1F2937" : "#F9FAFB",
        },
        catCardActive: {
          borderColor: colors.primary,
          backgroundColor: isDark ? "rgba(250, 204, 21, 0.1)" : "rgba(250, 204, 21, 0.08)",
        },
        catLabel: {
          fontSize: 13,
          fontWeight: "700",
          color: colors.text,
        },
        catDesc: {
          fontSize: 10,
          color: colors.textMuted,
          marginTop: 1,
        },
        inputGroup: {
          gap: 12,
          marginBottom: 18,
        },
        inputWrap: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          backgroundColor: isDark ? "#1F2937" : "#F9FAFB",
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderWidth: 1.5,
          borderColor: colors.border,
        },
        inputField: {
          flex: 1,
          fontSize: 14,
          fontWeight: "600",
          color: colors.text,
          padding: 0,
        },
        securityCard: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: isDark ? "#1F2937" : "#F9FAFB",
          borderRadius: 14,
          padding: 14,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 20,
        },
        securityLeft: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          flex: 1,
        },
        pinDisplay: {
          backgroundColor: colors.primary,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 8,
        },
        pinText: {
          fontSize: 13,
          fontWeight: "800",
          color: "#000000",
          letterSpacing: 1.5,
        },
        confirmBtn: {
          backgroundColor: colors.primary,
          paddingVertical: 15,
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 4,
        },
        confirmBtnDisabled: {
          opacity: 0.5,
        },
        confirmText: {
          fontSize: 15,
          fontWeight: "800",
          color: "#000000",
        },
      }),
    [colors, isDark, insets],
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={s.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={s.sheet}>
          <View style={s.handle} />

          {/* Header */}
          <View style={s.header}>
            <View style={s.headerLeft}>
              <View style={s.headerIcon}>
                <Package size={20} color="#CA8A04" />
              </View>
              <View>
                <Text style={s.title}>Okada Parcel Courier</Text>
                <Text style={s.subtitle}>Express motorcycle delivery</Text>
              </View>
            </View>
            <Pressable style={s.closeBtn} onPress={onClose} accessibilityLabel="Close modal">
              <X size={18} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Category Selector */}
            <Text style={s.sectionTitle}>What are you sending?</Text>
            <View style={s.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const active = category === cat.id;
                const Icon = cat.icon;
                return (
                  <Pressable
                    key={cat.id}
                    style={[s.catCard, active && s.catCardActive]}
                    onPress={() => setCategory(cat.id)}
                  >
                    <Icon size={20} color={active ? colors.primary : colors.textMuted} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.catLabel}>{cat.label}</Text>
                      <Text style={s.catDesc}>{cat.desc}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Recipient Details */}
            <Text style={s.sectionTitle}>Recipient Details (Ghana)</Text>
            <View style={s.inputGroup}>
              <View style={s.inputWrap}>
                <User size={18} color={colors.textMuted} />
                <TextInput
                  style={s.inputField}
                  placeholder="Recipient Full Name"
                  placeholderTextColor={colors.textMuted}
                  value={recipientName}
                  onChangeText={setRecipientName}
                />
              </View>

              <View style={s.inputWrap}>
                <Phone size={18} color={colors.textMuted} />
                <TextInput
                  style={s.inputField}
                  keyboardType="phone-pad"
                  placeholder="Recipient Phone (e.g. 0244 123 456)"
                  placeholderTextColor={colors.textMuted}
                  value={recipientPhone}
                  onChangeText={handlePhoneChange}
                />
              </View>

              <View style={s.inputWrap}>
                <FileText size={18} color={colors.textMuted} />
                <TextInput
                  style={s.inputField}
                  placeholder="Gate / Drop-off Note (optional)"
                  placeholderTextColor={colors.textMuted}
                  value={instructions}
                  onChangeText={setInstructions}
                />
              </View>
            </View>

            {/* Security Handover PIN */}
            <Pressable
              style={s.securityCard}
              onPress={() => setRequirePin(!requirePin)}
              accessibilityRole="checkbox"
            >
              <View style={s.securityLeft}>
                <KeyRound size={20} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
                    Delivery Handover PIN
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>
                    Recipient must give this 4-digit code to driver
                  </Text>
                </View>
              </View>
              {requirePin ? (
                <View style={s.pinDisplay}>
                  <Text style={s.pinText}>{handoverPin}</Text>
                </View>
              ) : (
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted }}>
                  Disabled
                </Text>
              )}
            </Pressable>

            {/* Confirm Button */}
            <Pressable
              style={[s.confirmBtn, !isComplete && s.confirmBtnDisabled]}
              disabled={!isComplete}
              onPress={handleDone}
            >
              <Text style={s.confirmText}>
                {isComplete ? "Confirm Parcel Details" : "Enter Recipient Name & Phone"}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
