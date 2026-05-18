import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenWrapper } from "../../components/ScreenWrapper";

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export function LiveTracking({ navigation }: Props) {
  return (
    <ScreenWrapper>
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity onPress={() => navigation.goBack()} className="px-3 py-2 rounded-full bg-[#1c1c1c]">
          <Text className="text-white text-xs font-bold">Back</Text>
        </TouchableOpacity>
        <Text className="text-white font-bold text-sm">Live Tracking</Text>
        <View className="flex-row gap-2">
          <TouchableOpacity className="w-8 h-8 rounded-full bg-[#1c1c1c] items-center justify-center">
            <Text className="text-[#F5B800] font-black">S</Text>
          </TouchableOpacity>
          <TouchableOpacity className="w-8 h-8 rounded-full bg-[#1c1c1c] items-center justify-center">
            <Text className="text-[#F5B800] font-black">C</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="mx-4 rounded-3xl bg-[#182818] items-center justify-center overflow-hidden" style={{ height: 280 }}>
        <View className="absolute left-8 right-8 top-1/2 h-1.5 rounded-full bg-[#F5B800] -rotate-12" />
        <View className="absolute top-3 bg-[#111]/90 rounded-xl px-4 py-2 items-center">
          <Text className="text-gray-300 text-xs">Driver status</Text>
          <Text className="text-[#F5B800] font-bold text-sm">Waiting for backend location</Text>
        </View>
      </View>

      <View className="flex-1" />

      <View className="bg-[#1a1a1a] mx-4 rounded-3xl p-4 mb-4">
        <Text className="text-white font-bold text-base">Rider details unavailable</Text>
        <Text className="text-gray-400 text-xs mt-2 leading-5">
          Rider name, rating, vehicle, plate number, chat, and call actions should be populated from
          the assigned ride payload.
        </Text>
      </View>
    </ScreenWrapper>
  );
}
