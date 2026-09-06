import { useMemo, useState } from "react";
import { X, Plus } from "lucide-react-native";
import {
  ActivityIndicator,
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
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  Edit3,
  MapPin,
  Navigation,
  Package,
  Phone,
  Sparkles,
  Tag,
  User,
  Zap,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { StandardBike } from "@/components/vehicles/StandardBike";
import { ExpressBike } from "@/components/vehicles/ExpressBike";
import { CargoTrike } from "@/components/vehicles/CargoTrike";
import { PaymentSelectionSheet } from "@/components/PaymentSelectionSheet";
import type { PaymentMethod } from "@/types";

export type RideTierId = "standard" | "express" | "cargo";

export type RideTier = {
  id: RideTierId;
  label: string;
  subtitle: string;
  fare: number;
  /** Original price before promo/discount — always shown struck-through when set */
  originalFare?: number;
  etaMinutes: number;
  capacity: string;
  /** Shows yellow RECOMMENDED chip */
  recommended?: boolean;
  /** Shows green FASTER chip */
  faster?: boolean;
  /** Greys out the card and blocks selection */
  busy?: boolean;
};

type Props = {
  pickupAddress: string;
  destinationAddress: string;
  onEditPickup?: () => void;
  onEditDestination?: () => void;
  /** Optional close/back handler for the route header ✕ button */
  onClose?: () => void;
  tiers: RideTier[];
  selectedTier: RideTierId;
  onSelectTier: (id: RideTierId) => void;
  isDelivery: boolean;
  currency: string;
  paymentMethod: PaymentMethod;
  onSelectPaymentMethod: (method: PaymentMethod) => void;
  promoCode?: string;
  onPromoCodeChange?: (code: string) => void;
  promoDiscount?: number;
  promoMessage?: string;
  pickupLandmark: string;
  onPickupLandmarkChange: (text: string) => void;
  recipientName: string;
  onRecipientNameChange: (text: string) => void;
  recipientPhone: string;
  onRecipientPhoneChange: (text: string) => void;
  packageType: string;
  onPackageTypeChange: (type: string) => void;
  onConfirm: () => void;
  loading?: boolean;
  confirmDisabled?: boolean;
};

function getVehicleComponent(id: RideTierId) {
  switch (id) {
    case "standard":
      return <StandardBike width={64} height={44} color="#facc15" />;
    case "express":
      return <ExpressBike width={64} height={44} color="#facc15" />;
    case "cargo":
      return <CargoTrike width={70} height={48} color="#facc15" />;
  }
}

export function RideBookingSheet({
  pickupAddress,
  destinationAddress,
  onEditPickup,
  onEditDestination,
  onClose,
  tiers,
  selectedTier,
  onSelectTier,
  isDelivery,
  currency,
  paymentMethod,
  onSelectPaymentMethod,
  promoCode = "",
  onPromoCodeChange,
  promoDiscount = 0,
  promoMessage = "",
  pickupLandmark,
  onPickupLandmarkChange,
  recipientName,
  onRecipientNameChange,
  recipientPhone,
  onRecipientPhoneChange,
  packageType,
  onPackageTypeChange,
  onConfirm,
  loading = false,
  confirmDisabled = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [showLandmarkInput, setShowLandmarkInput] = useState(false);

  const activeTier = tiers.find((t) => t.id === selectedTier) ?? tiers[0];
  const finalFare = Math.max(0, (activeTier?.fare ?? 0) - promoDiscount);

  const paymentLabel = useMemo(() => {
    switch (paymentMethod) {
      case "mobile_money":
        return "MTN MoMo";
      case "cash":
        return "Cash";
      case "wallet":
        return "Wallet";
      case "card":
        return "Card";
    }
  }, [paymentMethod]);

  const PACKAGE_TYPES = [
    { id: "parcel", label: "Small (< 2kg)" },
    { id: "medium", label: "Medium (< 10kg)" },
    { id: "food", label: "Food / Fragile" },
    { id: "document", label: "Document" },
  ];

  const s = useMemo(
    () =>
      StyleSheet.create({
        sheetContainer: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: isDark ? "rgba(17, 24, 39, 0.98)" : "rgba(255, 255, 255, 0.99)",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: isDark ? 0.5 : 0.12,
          shadowRadius: 20,
          elevation: 14,
          borderWidth: 1,
          borderBottomWidth: 0,
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          maxHeight: isDelivery ? "72%" : "62%",
        },
        scrollContent: {
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: insets.bottom + 16,
          gap: 10,
        },
        handleBar: {
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)",
          alignSelf: "center",
          marginBottom: 6,
        },

        /* ─── Route Capsule (Pickup -> Dropoff) ─────────────── */
        routeCapsule: {
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 10,
          gap: 6,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
        },
        routeRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        },
        dotPickup: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.primary,
        },
        dotDropoff: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.danger,
        },
        routeText: {
          flex: 1,
          fontSize: 13,
          fontWeight: "600",
          color: colors.text,
        },
        routeDivider: {
          height: 1,
          backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
          marginLeft: 18,
        },

        /* ─── Promo Banner Strip ──────────────────────────── */
        promoBannerStrip: {
          backgroundColor: isDark ? "rgba(22, 163, 74, 0.15)" : "#F0FDF4",
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "rgba(34, 197, 94, 0.2)" : "#BBF7D0",
        },
        promoBannerText: {
          fontSize: 12,
          fontWeight: "700",
          color: isDark ? "#4ADE80" : "#15803D",
        },

        /* ─── Route Header Bar ───────────────────────────── */
        routeHeader: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
          paddingVertical: 10,
          gap: 8,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
        },
        routeHeaderBtn: {
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          alignItems: "center",
          justifyContent: "center",
        },
        routeHeaderCenter: {
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
        },
        routeHeaderPickup: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.primary,
          flex: 1,
        },
        routeHeaderArrow: {
          fontSize: 14,
          color: colors.textMuted,
        },
        routeHeaderDest: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.text,
          flex: 1,
        },

        /* ─── Tiers List ────────────────────────────────── */
        tiersList: {
          gap: 8,
        },
        tierCard: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#FFFFFF",
          borderRadius: 16,
          padding: 12,
          borderWidth: 1.5,
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "#E9ECEF",
          gap: 12,
        },
        tierCardActive: {
          borderColor: colors.primary,
          backgroundColor: isDark ? "rgba(250, 204, 21, 0.06)" : "rgba(250, 204, 21, 0.04)",
        },
        tierCardBusy: {
          opacity: 0.4,
        },
        tierVehicleBox: {
          width: 68,
          alignItems: "center",
          justifyContent: "center",
        },
        tierInfo: {
          flex: 1,
          gap: 3,
        },
        tierTitleRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
        },
        tierName: {
          fontSize: 15,
          fontWeight: "700",
          color: colors.text,
        },
        /* RECOMMENDED chip */
        recBadge: {
          backgroundColor: colors.primary,
          paddingHorizontal: 7,
          paddingVertical: 2,
          borderRadius: 6,
        },
        recText: {
          fontSize: 9,
          fontWeight: "800",
          color: "#000000",
          textTransform: "uppercase",
          letterSpacing: 0.3,
        },
        /* FASTER chip */
        fasterBadge: {
          backgroundColor: "#22C55E",
          paddingHorizontal: 7,
          paddingVertical: 2,
          borderRadius: 6,
        },
        fasterText: {
          fontSize: 9,
          fontWeight: "800",
          color: "#FFFFFF",
          textTransform: "uppercase",
          letterSpacing: 0.3,
        },
        /* BUSY chip */
        busyBadge: {
          backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#E9ECEF",
          paddingHorizontal: 7,
          paddingVertical: 2,
          borderRadius: 6,
        },
        busyText: {
          fontSize: 9,
          fontWeight: "700",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.3,
        },
        tierEta: {
          fontSize: 12,
          fontWeight: "500",
          color: colors.textSecondary,
        },
        tierPriceBox: {
          alignItems: "flex-end",
          gap: 2,
        },
        tierPrice: {
          fontSize: 16,
          fontWeight: "800",
          color: colors.text,
        },
        tierOriginalPrice: {
          fontSize: 12,
          color: colors.textMuted,
          textDecorationLine: "line-through",
        },

        /* ─── Delivery Recipient Section ────────────────────── */
        deliverySection: {
          backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#F9FAFB",
          borderRadius: 14,
          padding: 12,
          gap: 10,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.05)" : "#E9ECEF",
        },
        deliveryTitle: {
          fontSize: 12,
          fontWeight: "700",
          color: colors.textSecondary,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
        deliveryInputRow: {
          flexDirection: "row",
          gap: 8,
        },
        inputBox: {
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FFFFFF",
          borderRadius: 10,
          paddingHorizontal: 10,
          paddingVertical: 8,
          gap: 6,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "#E9ECEF",
        },
        textInput: {
          flex: 1,
          fontSize: 13,
          color: colors.text,
          padding: 0,
        },
        packageChipsRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 6,
        },
        packageChip: {
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 10,
          backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F3F4F6",
          borderWidth: 1,
          borderColor: "transparent",
        },
        packageChipActive: {
          backgroundColor: isDark ? "rgba(250, 204, 21, 0.12)" : "rgba(250, 204, 21, 0.1)",
          borderColor: colors.primary,
        },
        packageChipText: {
          fontSize: 11,
          fontWeight: "600",
          color: colors.textMuted,
        },
        packageChipTextActive: {
          color: colors.primary,
        },

        /* ─── Quick Bar (Payment / Promo / Note) ──────────── */
        quickBar: {
          flexDirection: "row",
          gap: 8,
          marginTop: 2,
        },
        quickChip: {
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F3F4F6",
          paddingVertical: 9,
          paddingHorizontal: 10,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "#E9ECEF",
        },
        quickChipHighlight: {
          borderColor: colors.primary,
          backgroundColor: isDark ? "rgba(250, 204, 21, 0.08)" : "rgba(250, 204, 21, 0.06)",
        },
        quickChipText: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.text,
        },

        /* ─── Landmark Note Input ───────────────────────────── */
        landmarkInputBox: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FFFFFF",
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 8,
          gap: 8,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "#E9ECEF",
        },

        /* ─── Primary CTA Button ────────────────────────────── */
        confirmBtn: {
          height: 56,
          borderRadius: 14,
          backgroundColor: colors.primary,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 8,
          marginTop: 4,
        },
        confirmBtnDisabled: {
          opacity: 0.5,
        },
        confirmBtnText: {
          fontSize: 16,
          fontWeight: "800",
          color: "#000000",
          letterSpacing: 0.2,
        },
      }),
    [colors, isDark, insets, isDelivery],
  );

  return (
    <>
      <KeyboardAvoidingView
        style={s.sheetContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 10 : 0}
      >
        {/* ─── Promo Banner Strip (Feature 9) ─────────────── */}
        {promoDiscount > 0 ? (
          <View style={s.promoBannerStrip}>
            <Check size={14} color={isDark ? "#4ADE80" : "#16A34A"} strokeWidth={2.5} />
            <Text style={s.promoBannerText}>
              {promoMessage || `${currency} ${promoDiscount.toFixed(2)} promo discount applied`}
            </Text>
          </View>
        ) : null}

        {/* ─── Handle ─────────────────────────────────────── */}
        <View style={s.handleBar} />

        {/* ─── Route Header Bar ───────────────────────────── */}
        <View style={s.routeHeader}>
          <Pressable
            style={s.routeHeaderBtn}
            onPress={onClose ?? onEditPickup}
            accessibilityLabel="Close"
          >
            <X size={16} color={colors.text} />
          </Pressable>

          <Pressable style={s.routeHeaderCenter} onPress={onEditPickup}>
            <Text style={s.routeHeaderPickup} numberOfLines={1}>
              {pickupAddress ? pickupAddress.split(",")[0] : "Pickup"}
            </Text>
            <Text style={s.routeHeaderArrow}>→</Text>
            <Text style={s.routeHeaderDest} numberOfLines={1}>
              {destinationAddress ? destinationAddress.split(",")[0] : "Destination"}
            </Text>
          </Pressable>

          <Pressable
            style={s.routeHeaderBtn}
            onPress={onEditDestination}
            accessibilityLabel="Add stop"
          >
            <Plus size={16} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true}
        >

          {/* ─── Vehicle Tiers (Bolt style) ──────────────────── */}
          <View style={s.tiersList}>
            {tiers.map((tier) => {
              const isSelected = tier.id === selectedTier;
              const tierFinalFare = Math.max(0, tier.fare - (isSelected ? promoDiscount : 0));
              const showStrike = tier.originalFare != null || (promoDiscount > 0 && isSelected);
              const strikePrice = tier.originalFare ?? tier.fare;

              return (
                <Pressable
                  key={tier.id}
                  style={[
                    s.tierCard,
                    isSelected && s.tierCardActive,
                    tier.busy && s.tierCardBusy,
                  ]}
                  onPress={() => !tier.busy && onSelectTier(tier.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected, disabled: tier.busy }}
                >
                  <View style={s.tierVehicleBox}>{getVehicleComponent(tier.id)}</View>
                  <View style={s.tierInfo}>
                    <View style={s.tierTitleRow}>
                      <Text style={s.tierName}>{tier.label}</Text>
                      {tier.recommended && (
                        <View style={s.recBadge}>
                          <Text style={s.recText}>Recommended</Text>
                        </View>
                      )}
                      {tier.faster && (
                        <View style={s.fasterBadge}>
                          <Text style={s.fasterText}>Faster</Text>
                        </View>
                      )}
                      {tier.busy && (
                        <View style={s.busyBadge}>
                          <Text style={s.busyText}>Busy</Text>
                        </View>
                      )}
                    </View>
                    <Text style={s.tierEta}>
                      {tier.busy
                        ? tier.subtitle
                        : `⏱ ~${tier.etaMinutes} min • ${tier.subtitle}`}
                    </Text>
                  </View>
                  <View style={s.tierPriceBox}>
                    <Text style={s.tierPrice}>
                      {currency} {tierFinalFare.toFixed(2)}
                    </Text>
                    {showStrike && (
                      <Text style={s.tierOriginalPrice}>
                        {currency} {strikePrice.toFixed(2)}
                      </Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* ─── Delivery Mode: Recipient details ───────────── */}
          {isDelivery && (
            <View style={s.deliverySection}>
              <Text style={s.deliveryTitle}>Recipient & Package</Text>
              <View style={s.deliveryInputRow}>
                <View style={s.inputBox}>
                  <User size={14} color={colors.textSecondary} />
                  <TextInput
                    style={s.textInput}
                    placeholder="Recipient Name"
                    placeholderTextColor={colors.textMuted}
                    value={recipientName}
                    onChangeText={onRecipientNameChange}
                  />
                </View>
                <View style={s.inputBox}>
                  <Phone size={14} color={colors.textSecondary} />
                  <TextInput
                    style={s.textInput}
                    placeholder="Phone (024...)"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                    value={recipientPhone}
                    onChangeText={onRecipientPhoneChange}
                  />
                </View>
              </View>

              {/* Package sizes */}
              <View style={s.packageChipsRow}>
                {PACKAGE_TYPES.map((pt) => (
                  <Pressable
                    key={pt.id}
                    style={[s.packageChip, packageType === pt.id && s.packageChipActive]}
                    onPress={() => onPackageTypeChange(pt.id)}
                  >
                    <Text
                      style={[
                        s.packageChipText,
                        packageType === pt.id && s.packageChipTextActive,
                      ]}
                    >
                      {pt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* ─── Yango-Style Quick Bar ──────────────────────── */}
          <View style={s.quickBar}>
            {/* Payment Method */}
            <Pressable
              style={s.quickChip}
              onPress={() => setShowPaymentSheet(true)}
              accessibilityRole="button"
            >
              <Text style={s.quickChipText}>{paymentLabel}</Text>
              <ChevronDown size={14} color={colors.textMuted} />
            </Pressable>

            {/* Promo Code */}
            <Pressable
              style={[s.quickChip, promoDiscount > 0 && s.quickChipHighlight]}
              onPress={() => setShowPaymentSheet(true)}
              accessibilityRole="button"
            >
              <Tag size={13} color={promoDiscount > 0 ? colors.primary : colors.textMuted} />
              <Text
                style={[
                  s.quickChipText,
                  promoDiscount > 0 && { color: colors.primary, fontWeight: "700" },
                ]}
                numberOfLines={1}
              >
                {promoDiscount > 0 ? `-${currency} ${promoDiscount}` : "Promo"}
              </Text>
            </Pressable>

            {/* Note / Landmark */}
            <Pressable
              style={[s.quickChip, Boolean(pickupLandmark) && s.quickChipHighlight]}
              onPress={() => setShowLandmarkInput((prev) => !prev)}
              accessibilityRole="button"
            >
              <MapPin size={13} color={pickupLandmark ? colors.primary : colors.textMuted} />
              <Text style={s.quickChipText} numberOfLines={1}>
                {pickupLandmark ? "Landmark ✓" : "Note"}
              </Text>
            </Pressable>
          </View>

          {/* ─── Optional Landmark Input ────────────────────── */}
          {showLandmarkInput && (
            <View style={s.landmarkInputBox}>
              <MapPin size={16} color={colors.primary} />
              <TextInput
                style={s.textInput}
                placeholder="Landmark (e.g., Near Total filling station)"
                placeholderTextColor={colors.textMuted}
                value={pickupLandmark}
                onChangeText={onPickupLandmarkChange}
                autoFocus
              />
            </View>
          )}

          {/* ─── Primary Confirm CTA ────────────────────────── */}
          <Pressable
            style={[s.confirmBtn, (loading || confirmDisabled) && s.confirmBtnDisabled]}
            onPress={onConfirm}
            disabled={loading || confirmDisabled}
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <>
                <Text style={s.confirmBtnText}>
                  {isDelivery
                    ? `Request Delivery • ${currency} ${finalFare.toFixed(2)}`
                    : `Confirm ${activeTier?.label ?? "OkadaGo"} • ${currency} ${finalFare.toFixed(2)}`}
                </Text>
                <ArrowRight size={18} color="#000000" />
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ─── Payment & Promo Modal ────────────────────────── */}
      <Modal
        visible={showPaymentSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentSheet(false)}
      >
        <PaymentSelectionSheet
          fare={`${currency} ${finalFare.toFixed(2)}`}
          originalFare={promoDiscount > 0 ? `${currency} ${(activeTier?.fare ?? 0).toFixed(2)}` : undefined}
          selected={paymentMethod}
          onSelect={(method) => {
            onSelectPaymentMethod(method);
          }}
          onConfirm={() => setShowPaymentSheet(false)}
          promoCode={promoCode}
          onPromoCodeChange={onPromoCodeChange}
          promoDiscount={promoDiscount}
          promoMessage={promoMessage}
        />
      </Modal>
    </>
  );
}
