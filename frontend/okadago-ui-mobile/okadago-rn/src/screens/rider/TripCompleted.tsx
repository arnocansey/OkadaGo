import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenWrapper } from "../../components/ScreenWrapper";

interface Props { navigation: NativeStackNavigationProp<any> }

export function TripCompleted({ navigation }: Props) {
  return (
    <ScreenWrapper>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 py-3">
          <TouchableOpacity onPress={() => navigation.goBack()} className="px-3 py-2 bg-[#1c1c1c] rounded-full self-start">
            <Text className="text-white text-xs font-bold">Back</Text>
          </TouchableOpacity>
        </View>

        <View className="items-center pt-4 pb-6 px-4">
          <View className="w-24 h-24 rounded-full bg-[#F5B800] items-center justify-center mb-5">
            <Text className="text-[#111] text-3xl font-black">OK</Text>
          </View>
          <Text className="text-white text-2xl font-extrabold mb-1">Trip Completed</Text>
          <Text className="text-gray-400 text-sm">Settlement should be calculated from backend fare data.</Text>
        </View>

        <View className="mx-4 bg-[#1a1a1a] rounded-3xl p-5 mb-4">
          <Text className="text-white font-bold text-base mb-2">Summary unavailable</Text>
          <Text className="text-gray-400 text-xs leading-5">Completed trip fare, route, duration, payment, and settlement data should render here.</Text>
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
