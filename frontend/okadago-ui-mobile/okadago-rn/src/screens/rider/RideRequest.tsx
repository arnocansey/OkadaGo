import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenWrapper } from "../../components/ScreenWrapper";

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export function RideRequest({ navigation }: Props) {
  return (
    <ScreenWrapper>
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-8 h-8 bg-[#1c1c1c] rounded-full items-center justify-center"
        >
          <Text className="text-white">Back</Text>
        </TouchableOpacity>
        <Text className="text-white font-bold">New Ride Request</Text>
        <View className="w-8" />
      </View>

      <View className="mx-4 rounded-3xl bg-[#182818] items-center justify-center overflow-hidden" style={{ height: 230 }}>
        <View className="absolute left-8 right-8 top-1/2 h-1.5 rounded-full bg-[#F5B800] -rotate-12" />
        <View className="absolute left-10 top-32 w-4 h-4 rounded-full bg-white" />
        <View className="absolute right-12 top-20 w-5 h-5 rounded-full bg-[#F5B800]" />
        <Text className="text-white text-base font-extrabold">Route map</Text>
        <Text className="text-gray-400 text-xs mt-2">Backend request details should populate this map.</Text>
      </View>

      <View className="mx-4 mt-4 bg-[#1a1a1a] rounded-3xl p-5 flex-1">
        <View className="rounded-2xl border border-dashed border-[#333] p-4 mb-5">
          <Text className="text-white font-bold text-base">No pending ride request.</Text>
          <Text className="text-gray-400 text-sm leading-6 mt-2">
            Pickup, drop-off, passenger, fare, distance, payment method, and timeout should be
            rendered from the live ride request payload.
          </Text>
        </View>

        <View className="flex-row gap-3 mt-auto">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="flex-1 bg-[#252525] py-4 rounded-2xl items-center"
          >
            <Text className="text-white font-bold">Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-[#F5B800] py-4 rounded-2xl items-center"
            onPress={() => navigation.navigate("OnTheWay")}
          >
            <Text className="text-[#111] text-base font-extrabold">Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
}
