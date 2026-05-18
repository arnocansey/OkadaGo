import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenWrapper } from "../../components/ScreenWrapper";

interface Props { navigation: NativeStackNavigationProp<any> }

export function TripProgress({ navigation }: Props) {
  return (
    <ScreenWrapper>
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity onPress={() => navigation.goBack()} className="px-3 py-2 bg-[#1c1c1c] rounded-full">
          <Text className="text-white text-xs font-bold">Back</Text>
        </TouchableOpacity>
        <Text className="text-white font-bold">Trip in Progress</Text>
        <TouchableOpacity className="bg-red-600 rounded-full px-3 py-1">
          <Text className="text-white text-xs font-extrabold">SOS</Text>
        </TouchableOpacity>
      </View>

      <View className="mx-4 bg-[#1a1a1a] rounded-2xl px-4 py-3 mb-3">
        <Text className="text-gray-400 text-xs">Drop-off</Text>
        <Text className="text-white text-sm font-semibold">No destination loaded</Text>
      </View>

      <View className="flex-1 mx-4 rounded-3xl bg-[#182818] items-center justify-center overflow-hidden">
        <Text className="text-gray-400 text-sm mt-2">Trip route map</Text>
      </View>

      <View className="mx-4 mt-3 flex-row gap-2 mb-3">
        {["Time", "Distance", "Fare"].map((label) => (
          <View key={label} className="flex-1 bg-[#1a1a1a] rounded-2xl p-3 items-center">
            <Text className="text-gray-400 text-xs mb-1">{label}</Text>
            <Text className="font-extrabold text-sm text-white">--</Text>
          </View>
        ))}
      </View>

      <View className="px-4 pb-4">
        <TouchableOpacity className="w-full bg-[#F5B800] py-4 rounded-2xl items-center" onPress={() => navigation.navigate("TripCompleted")}>
          <Text className="text-[#111] text-base font-extrabold">Complete Trip</Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}
