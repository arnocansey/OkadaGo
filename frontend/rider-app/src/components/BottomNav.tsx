import { Pressable, Text, View } from "react-native";
import { Bike, ChartNoAxesCombined, House, UserRound, WalletCards } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { styles } from "./ui";
import type { RiderScreen } from "../types";

export function BottomNav({ active, onChange }: { active: RiderScreen; onChange: (screen: RiderScreen) => void }) {
  const insets = useSafeAreaInsets();
  const items: Array<{ key: RiderScreen; label: string; Icon: typeof House }> = [
    { key: "dashboard", label: "Home", Icon: House },
    { key: "earnings", label: "Earn", Icon: ChartNoAxesCombined },
    { key: "trips", label: "Trips", Icon: Bike },
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
          <Text style={[styles.bottomNavText, selected && styles.bottomNavTextActive]}>{item.label}</Text>
        </Pressable>
      );})}
    </View>
  );
}
