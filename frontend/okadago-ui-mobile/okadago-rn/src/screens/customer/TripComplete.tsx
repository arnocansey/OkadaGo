import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenWrapper } from "../../components/ScreenWrapper";

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export function TripComplete({ navigation }: Props) {
  return (
    <ScreenWrapper>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="items-center pt-8 pb-6 px-4">
          <View className="w-20 h-20 rounded-full bg-[#F5B800] items-center justify-center mb-4">
            <Text className="text-[#111] text-4xl font-black">OK</Text>
          </View>
          <Text className="text-white text-2xl font-extrabold mb-1">Trip Completed</Text>
          <Text className="text-gray-400 text-sm">Thank you for riding with OkadaGo.</Text>
        </View>

        <View className="bg-[#1a1a1a] mx-4 rounded-3xl p-5 mb-4">
          <Text className="text-white font-bold text-base mb-4">Trip Details</Text>
          <View className="rounded-2xl border border-dashed border-[#333] p-4">
            <Text className="text-white font-bold text-sm">No completed trip loaded.</Text>
            <Text className="text-gray-400 text-xs mt-2 leading-5">
              Completed trip route, distance, duration, fare, and payment details should render here.
            </Text>
          </View>
        </View>

        <View className="bg-[#1a1a1a] mx-4 rounded-3xl p-5 mb-6">
          <Text className="text-white font-bold text-sm mb-3 text-center">Rate your ride</Text>
          <View className="flex-row justify-center gap-2">
            {[1, 2, 3, 4, 5].map((item) => (
              <Text key={item} style={{ color: "#333", fontSize: 32 }}>
                *
              </Text>
            ))}
          </View>
        </View>

        <View className="px-4 pb-8">
          <TouchableOpacity className="w-full bg-[#F5B800] py-4 rounded-2xl items-center" onPress={() => navigation.navigate("Main")}>
            <Text className="text-[#111] text-base font-extrabold">Done</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
