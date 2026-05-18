import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenWrapper } from "../../components/ScreenWrapper";

interface Props { navigation: NativeStackNavigationProp<any> }

const menuItems = ["Personal Information", "Vehicle Information", "Documents", "Bank Details", "Help and Support"];

export function Profile({ navigation }: Props) {
  return (
    <ScreenWrapper edges={["top"]}>
      <View className="flex-row items-center justify-between px-4 py-3">
        <Text className="text-white font-bold text-lg">Profile</Text>
        <TouchableOpacity className="w-8 h-8 bg-[#1c1c1c] rounded-full items-center justify-center" onPress={() => navigation.navigate("Settings")}>
          <Text className="text-[#F5B800] font-black">S</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="mx-4 bg-[#1a1a1a] rounded-3xl p-5 mb-4 items-center">
          <View className="w-20 h-20 rounded-full bg-[#F5B800] items-center justify-center mb-3">
            <Text className="text-[#111] font-black text-2xl">R</Text>
          </View>
          <Text className="text-white font-extrabold text-xl">Rider profile</Text>
          <Text className="text-gray-400 text-sm mb-3">No session loaded</Text>
          <TouchableOpacity className="border border-[#F5B800] px-6 py-2 rounded-full">
            <Text className="text-[#F5B800] text-sm font-bold">View Profile</Text>
          </TouchableOpacity>
        </View>

        <View className="mx-4 bg-[#1a1a1a] rounded-3xl overflow-hidden mb-4">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item}
              className={`flex-row items-center gap-4 px-5 py-4 ${index < menuItems.length - 1 ? "border-b border-[#252525]" : ""}`}
              onPress={() => item === "Documents" && navigation.navigate("Documents")}
            >
              <View className="w-9 h-9 bg-[#252525] rounded-xl items-center justify-center">
                <Text className="text-[#F5B800] text-xs font-black">{item.slice(0, 2).toUpperCase()}</Text>
              </View>
              <Text className="text-white text-sm font-medium flex-1">{item}</Text>
              <Text className="text-gray-600">&gt;</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
