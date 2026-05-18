import React, { useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenWrapper } from "../../components/ScreenWrapper";

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

const rideOptions = ["Standard bike", "Express bike", "Premium bike"];

export function BookRide({ navigation }: Props) {
  const [selected, setSelected] = useState(0);

  return (
    <ScreenWrapper>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="bg-[#1a1a1a] px-4 py-4 gap-3">
          <View className="flex-row items-center gap-3">
            <View className="w-3 h-3 rounded-full bg-[#F5B800]" />
            <TextInput
              className="flex-1 bg-[#252525] rounded-xl px-3 py-3 text-white text-sm font-medium"
              placeholder="Pickup address"
              placeholderTextColor="#777"
            />
          </View>
          <View className="flex-row items-center gap-3">
            <View className="w-3 h-3 rounded-full bg-red-500" />
            <TextInput
              className="flex-1 bg-[#252525] rounded-xl px-3 py-3 text-white text-sm font-medium"
              placeholder="Destination address"
              placeholderTextColor="#777"
            />
          </View>
        </View>

        <View className="mx-4 mt-3 rounded-3xl bg-[#182818] overflow-hidden items-center justify-center" style={{ height: 220 }}>
          <View className="absolute left-8 right-8 top-1/2 h-1.5 rounded-full bg-[#F5B800] -rotate-12" />
          <View className="absolute left-10 top-32 w-4 h-4 rounded-full bg-white" />
          <View className="absolute right-12 top-20 w-5 h-5 rounded-full bg-[#F5B800]" />
          <Text className="text-white text-base font-extrabold">Route preview</Text>
          <Text className="text-gray-400 text-xs mt-2">Resolve addresses from backend before confirming</Text>
        </View>

        <View className="px-4 mt-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-white font-bold text-base">Choose a ride</Text>
            <Text className="text-gray-500 text-xs">Fare appears after route estimate</Text>
          </View>
          <View className="gap-2">
            {rideOptions.map((name, i) => (
              <TouchableOpacity
                key={name}
                onPress={() => setSelected(i)}
                className={`flex-row items-center gap-3 p-3 rounded-2xl border ${
                  selected === i ? "border-[#F5B800] bg-[#1a1a1a]" : "border-[#252525] bg-[#1a1a1a]"
                }`}
              >
                <View className="w-11 h-11 rounded-2xl bg-[#252525] items-center justify-center">
                  <Text className="text-[#F5B800] font-black">{i + 1}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white text-sm font-semibold">{name}</Text>
                  <Text className="text-gray-500 text-xs">Backend fare estimate required</Text>
                </View>
                <Text className="text-gray-400 text-xs">--</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="px-4 py-5">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center bg-[#1a1a1a] rounded-xl px-3 py-2 gap-2">
              <Text className="text-[#F5B800] font-black">C</Text>
              <Text className="text-white text-sm font-medium">Cash</Text>
            </View>
            <TouchableOpacity>
              <Text className="text-[#F5B800] text-sm font-semibold">Change</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            className="w-full bg-[#F5B800] py-4 rounded-2xl items-center"
            onPress={() => navigation.navigate("LiveTracking")}
          >
            <Text className="text-[#111] text-base font-extrabold">Confirm ride</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
