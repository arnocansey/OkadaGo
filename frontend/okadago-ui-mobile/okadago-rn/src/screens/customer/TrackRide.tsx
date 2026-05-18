import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenWrapper } from "../../components/ScreenWrapper";

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export function TrackRide({ navigation }: Props) {
  return (
    <ScreenWrapper>
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity onPress={() => navigation.goBack()} className="px-3 py-2 rounded-full bg-[#1c1c1c]">
          <Text className="text-white text-xs font-bold">Back</Text>
        </TouchableOpacity>
        <Text className="text-white font-bold text-sm">Track Ride</Text>
        <TouchableOpacity>
          <Text className="text-[#F5B800] text-xs font-semibold">Help</Text>
        </TouchableOpacity>
      </View>

      <View className="bg-[#1a1a1a] mx-4 rounded-2xl p-4 mb-3">
        <Text className="text-white font-bold text-sm">No active ride loaded</Text>
        <Text className="text-gray-400 text-xs mt-2 leading-5">
          Pickup, destination, fare, payment method, and rider details should come from the
          active ride endpoint.
        </Text>
      </View>

      <View className="flex-1 mx-4 rounded-3xl bg-[#182818] items-center justify-center overflow-hidden">
        <View className="absolute left-8 right-8 top-1/2 h-1.5 rounded-full bg-[#F5B800] -rotate-12" />
        <View className="absolute left-10 top-32 w-4 h-4 rounded-full bg-white" />
        <View className="absolute right-12 top-20 w-5 h-5 rounded-full bg-[#F5B800]" />
        <View className="absolute top-3 bg-[#111]/90 rounded-xl px-4 py-2 items-center">
          <Text className="text-gray-300 text-xs">Live map</Text>
          <Text className="text-[#F5B800] font-bold text-sm">Awaiting rider location</Text>
        </View>
      </View>

      <View className="px-4 py-4 flex-row gap-3">
        <TouchableOpacity className="flex-1 border border-red-500 py-3.5 rounded-2xl items-center">
          <Text className="text-red-400 font-bold text-sm">Cancel Ride</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 bg-[#1a1a1a] py-3.5 rounded-2xl items-center">
          <Text className="text-white font-bold text-sm">Share Trip</Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}
