import { Pressable, Text, View } from "react-native";
import { Home, MapPinned, ReceiptText, UserRound, WalletCards } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { styles } from "./ui";
import type { PassengerScreen } from "../types";

export function BottomNav({ active, onChange }: { active: PassengerScreen; onChange: (screen: PassengerScreen) => void }) {
  const insets = useSafeAreaInsets();
  const items: Array<{ key: PassengerScreen; label: string; Icon: typeof Home }> = [
    { key: "home", label: "Home", Icon: Home },
    { key: "book", label: "Book", Icon: MapPinned },
    { key: "trips", label: "Trips", Icon: ReceiptText },
    { key: "wallet", label: "Wallet", Icon: WalletCards },
    { key: "profile", label: "Profile", Icon: UserRound },
  ];
  return (
    <View style={[styles.bottomNav, { bottom: Math.max(insets.bottom, 10) + 8 }]}>
      {items.map((item) => {
        const selected = active === item.key;
        const Icon = item.Icon;

        return (
        <Pressable key={item.key} style={[styles.bottomNavItem, selected && styles.bottomNavItemActive]} onPress={() => onChange(item.key)}>
          <Icon size={20} color={selected ? "#111111" : "#9EA4AE"} strokeWidth={2.4} />
          <Text style={[styles.bottomNavText, active === item.key && styles.bottomNavTextActive]}>{item.label}</Text>
        </Pressable>
      );})}
    </View>
  );
}
