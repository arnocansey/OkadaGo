import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenWrapper } from "../../components/ScreenWrapper";

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

const menuItems = [
  "Home",
  "My Trips",
  "My Wallet",
  "Payment Methods",
  "Promo Codes",
  "Saved Places",
  "Refer and Earn",
  "Safety Center",
  "Help and Support",
  "Settings",
];

export function SideMenu({ navigation }: Props) {
  return (
    <ScreenWrapper>
      <View className="flex-row items-center justify-between px-4 py-3 mb-2">
        <Text className="text-xl font-extrabold">
          <Text className="text-white">Okada</Text>
          <Text className="text-[#F5B800]">Go</Text>
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-8 h-8 bg-[#1c1c1c] rounded-full items-center justify-center">
          <Text className="text-white font-black">X</Text>
        </TouchableOpacity>
      </View>

      <View className="mx-4 bg-[#1a1a1a] rounded-3xl p-4 mb-4 flex-row items-center gap-3">
        <View className="w-14 h-14 rounded-full bg-[#F5B800] items-center justify-center">
          <Text className="text-[#111] font-black">P</Text>
        </View>
        <View className="flex-1">
          <Text className="text-white font-extrabold text-base">Passenger profile</Text>
          <Text className="text-gray-400 text-xs">No session loaded</Text>
        </View>
        <TouchableOpacity>
          <Text className="text-[#F5B800] text-xs font-semibold">View</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 mx-4" showsVerticalScrollIndicator={false}>
        <View className="bg-[#1a1a1a] rounded-3xl overflow-hidden mb-4">
          {menuItems.map((label, index) => (
            <TouchableOpacity
              key={label}
              className={`flex-row items-center gap-4 px-5 py-3.5 ${index < menuItems.length - 1 ? "border-b border-[#252525]" : ""}`}
            >
              <View className="w-9 h-9 bg-[#252525] rounded-xl items-center justify-center">
                <Text className="text-[#F5B800] text-xs font-black">{label.slice(0, 2).toUpperCase()}</Text>
              </View>
              <Text className="text-white text-sm font-medium flex-1">{label}</Text>
              <Text className="text-gray-600">&gt;</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity className="flex-row items-center gap-3 px-5 py-4 bg-[#1a1a1a] rounded-2xl mb-8">
          <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: "rgba(239,68,68,0.15)" }}>
            <Text className="text-red-400 font-black">LO</Text>
          </View>
          <Text className="text-red-400 text-sm font-semibold">Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  );
}
