import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenWrapper } from "../../components/ScreenWrapper";

interface Props { navigation: NativeStackNavigationProp<any> }

export function OnTheWay({ navigation }: Props) {
  return (
    <ScreenWrapper>
      <View className="flex-row items-center justify-between px-4 py-3">
        <Text className="text-white font-bold text-base">On The Way</Text>
        <TouchableOpacity className="w-8 h-8 bg-[#1c1c1c] rounded-full items-center justify-center">
          <Text className="text-[#F5B800] font-black">C</Text>
        </TouchableOpacity>
      </View>

      <View className="bg-[#1a1a1a] mx-4 rounded-2xl p-4 mb-3">
        <Text className="text-white font-bold text-sm">No pickup route loaded</Text>
        <Text className="text-gray-400 text-xs mt-2 leading-5">Render pickup and drop-off from the assigned ride.</Text>
      </View>

      <View className="mx-4 rounded-3xl bg-[#182818] items-center justify-center overflow-hidden" style={{ height: 220 }}>
        <View className="absolute left-8 right-8 top-1/2 h-1.5 rounded-full bg-[#F5B800] -rotate-12" />
        <Text className="text-gray-400 text-sm mt-2">En route map</Text>
      </View>

      <View className="mx-4 mt-3 bg-[#1a1a1a] rounded-2xl p-4 mb-3">
        <Text className="text-white font-bold">Customer details unavailable</Text>
        <Text className="text-gray-400 text-xs mt-2">Load customer name, rating, call, and chat from backend.</Text>
      </View>

      <View className="flex-1" />
      <View className="px-4 pb-4">
        <TouchableOpacity className="w-full bg-[#F5B800] py-4 rounded-2xl items-center" onPress={() => navigation.navigate("ArrivedPickup")}>
          <Text className="text-[#111] text-base font-extrabold">Navigate</Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}
