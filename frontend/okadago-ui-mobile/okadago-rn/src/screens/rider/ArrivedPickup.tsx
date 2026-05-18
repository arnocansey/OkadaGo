import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenWrapper } from "../../components/ScreenWrapper";

interface Props { navigation: NativeStackNavigationProp<any> }

export function ArrivedPickup({ navigation }: Props) {
  return (
    <ScreenWrapper>
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity onPress={() => navigation.goBack()} className="px-3 py-2 bg-[#1c1c1c] rounded-full">
          <Text className="text-white text-xs font-bold">Back</Text>
        </TouchableOpacity>
        <Text className="text-white font-bold">Arrived</Text>
        <View className="w-12" />
      </View>

      <View className="mx-4 bg-[#F5B800] rounded-3xl p-6 mb-4 items-center">
        <Text className="text-[#111] text-2xl font-extrabold mb-1">Arrived at pickup</Text>
        <Text className="text-[#111] opacity-70 text-sm mt-1">Pickup address should load from the ride.</Text>
      </View>

      <View className="mx-4 rounded-3xl bg-[#182818] items-center justify-center overflow-hidden" style={{ height: 190 }}>
        <Text className="text-gray-400 text-sm mt-2">Pickup location map</Text>
      </View>

      <View className="flex-1" />
      <View className="px-4 pb-4">
        <TouchableOpacity className="w-full bg-[#F5B800] py-4 rounded-2xl items-center" onPress={() => navigation.navigate("TripProgress")}>
          <Text className="text-[#111] text-base font-extrabold">Start Ride</Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}
