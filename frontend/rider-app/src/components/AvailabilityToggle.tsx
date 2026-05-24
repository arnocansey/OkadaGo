import { Pressable, Text, View } from "react-native";

export function AvailabilityToggle({ online, disabled, onToggle }: { online: boolean; disabled?: boolean; onToggle: () => void }) {
  return (
    <Pressable
      style={{ marginLeft: "auto", width: 116, height: 42, borderRadius: 999, paddingHorizontal: 7, flexDirection: "row", alignItems: "center", backgroundColor: online ? "#FF7A00" : "#9B1C1C", opacity: disabled ? 0.55 : 1 }}
      onPress={onToggle}
      disabled={disabled}
    >
      {!online ? <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "#FFFFFF" }} /> : null}
      <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "900", flex: 1, textAlign: "center" }}>{online ? "ONLINE" : "OFFLINE"}</Text>
      {online ? <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "#FFFFFF" }} /> : null}
    </Pressable>
  );
}
