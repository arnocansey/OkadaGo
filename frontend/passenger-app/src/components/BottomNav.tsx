import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { styles } from "./ui";
import type { PassengerScreen } from "../types";

export function BottomNav({ active, onChange }: { active: PassengerScreen; onChange: (screen: PassengerScreen) => void }) {
  const insets = useSafeAreaInsets();
  const items: Array<{ key: PassengerScreen; label: string }> = [
    { key: "home", label: "Home" },
    { key: "book", label: "Book" },
    { key: "trips", label: "Trips" },
    { key: "wallet", label: "Wallet" },
    { key: "profile", label: "Profile" },
  ];
  return (
    <View style={[styles.bottomNav, { bottom: Math.max(insets.bottom, 10) + 8 }]}>
      {items.map((item) => (
        <Pressable key={item.key} style={[styles.bottomNavItem, active === item.key && styles.bottomNavItemActive]} onPress={() => onChange(item.key)}>
          <Text style={[styles.bottomNavIcon, active === item.key && styles.bottomNavIconActive]}>{item.label.slice(0, 1)}</Text>
          <Text style={[styles.bottomNavText, active === item.key && styles.bottomNavTextActive]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
