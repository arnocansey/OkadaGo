import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenWrapper } from "../../components/ScreenWrapper";

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

const services = [
  { code: "IR", label: "Instant\nRide" },
  { code: "SR", label: "Schedule\nRide" },
  { code: "IC", label: "Intercity\nRide" },
  { code: "SH", label: "Shared\nRide" },
  { code: "PR", label: "Premium\nRide" },
];

export function Home({ navigation }: Props) {
  return (
    <ScreenWrapper edges={["top"]}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="flex-row justify-between items-center px-5 py-3">
          <TouchableOpacity
            className="w-8 h-8 items-center justify-center"
            onPress={() => navigation.navigate("SideMenu")}
          >
            <View className="gap-1.5">
              <View className="w-5 h-0.5 bg-white" />
              <View className="w-5 h-0.5 bg-white" />
              <View className="w-3 h-0.5 bg-white" />
            </View>
          </TouchableOpacity>
          <Text className="text-xl font-extrabold">
            <Text className="text-white">Okada</Text>
            <Text className="text-[#F5B800]">Go</Text>
          </Text>
          <TouchableOpacity className="w-8 h-8 items-center justify-center rounded-full bg-[#1c1c1c]">
            <Text className="text-[#F5B800] font-black">!</Text>
          </TouchableOpacity>
        </View>

        <View className="mx-4 rounded-3xl bg-[#F5B800] p-5 mb-4 overflow-hidden" style={{ minHeight: 156 }}>
          <Text className="text-[#111] text-xs font-semibold mb-1">Fast, safe, affordable</Text>
          <Text className="text-[#111] text-3xl font-extrabold leading-tight mb-3">
            Move smarter{"\n"}every day
          </Text>
          <TouchableOpacity
            className="bg-[#111] rounded-full px-4 py-2 self-start"
            onPress={() => navigation.navigate("BookRide")}
          >
            <Text className="text-white text-sm font-semibold">Book a ride</Text>
          </TouchableOpacity>
          <View className="absolute right-5 top-5 w-20 h-20 rounded-full bg-[#111]/10" />
          <View className="absolute right-10 bottom-5 w-12 h-12 rounded-full bg-[#111]/10" />
        </View>

        <View className="px-4 mb-4">
          <View className="flex-row justify-between">
            {services.map((service) => (
              <View key={service.code} className="items-center gap-1.5">
                <View className="w-12 h-12 rounded-2xl bg-[#F5B800] items-center justify-center">
                  <Text className="text-[#111] text-xs font-black">{service.code}</Text>
                </View>
                <Text className="text-xs text-gray-300 text-center" style={{ fontSize: 9 }}>
                  {service.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className="px-4 mb-4">
          <Text className="text-gray-400 text-xs mb-2 font-medium">Where to?</Text>
          <TouchableOpacity
            className="bg-[#1c1c1c] rounded-2xl p-4 flex-row items-center gap-3"
            onPress={() => navigation.navigate("BookRide")}
          >
            <View className="w-10 h-10 bg-[#2a2a2a] rounded-xl items-center justify-center">
              <Text className="text-[#F5B800] font-black">+</Text>
            </View>
            <View className="flex-1">
              <Text className="text-white text-sm font-semibold">Set pickup and destination</Text>
              <Text className="text-gray-500 text-xs mt-1">
                No saved places loaded. Add route details from the booking screen.
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View className="px-4 mb-6">
          <View className="bg-[#1c1c1c] rounded-2xl p-4 flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-[#F5B800] text-xs font-semibold mb-1">Wallet Balance</Text>
              <Text className="text-white text-xl font-bold">Connect wallet data</Text>
              <Text className="text-gray-500 text-xs mt-1">
                The app should render the backend wallet balance here.
              </Text>
            </View>
            <TouchableOpacity
              className="bg-[#F5B800] px-5 py-2.5 rounded-xl"
              onPress={() => navigation.navigate("Wallet")}
            >
              <Text className="text-[#111] text-sm font-bold">Open</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
