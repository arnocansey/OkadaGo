import { Pressable, Text, View } from "react-native";
import type { PassengerScreen } from "../types";

export function BottomNav({ active, onChange }: { active: PassengerScreen; onChange: (screen: PassengerScreen) => void }) {
  const items: Array<{ key: PassengerScreen; label: string }> = [
    { key: "home", label: "Home" },
    { key: "book", label: "Book" },
    { key: "trips", label: "Trips" },
    { key: "wallet", label: "Wallet" },
    { key: "profile", label: "Profile" },
  ];
  return (
    <View style={{ position: "absolute", left: 14, right: 14, bottom: 16, flexDirection: "row", gap: 8, padding: 8, borderRadius: 28, backgroundColor: "#1B1B1B", borderWidth: 1, borderColor: "#2A2A2A" }}>
      {items.map((item) => (
        <Pressable key={item.key} style={{ flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 20, backgroundColor: active === item.key ? "#F5B800" : "transparent" }} onPress={() => onChange(item.key)}>
          <Text style={{ color: active === item.key ? "#111111" : "#9EA4AE", fontSize: 12, fontWeight: "900" }}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
