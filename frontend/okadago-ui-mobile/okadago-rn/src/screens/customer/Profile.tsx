import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { ScreenWrapper } from "../../components/ScreenWrapper";

const sections = [
  { title: "Account", items: ["Personal Information", "Payment Methods", "Addresses"] },
  { title: "Preferences", items: ["Security", "Notifications", "Privacy"] },
];

export function Profile() {
  return (
    <ScreenWrapper edges={["top"]}>
      <View className="flex-row items-center justify-between px-4 py-3">
        <Text className="text-white font-bold text-lg">Profile</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="mx-4 bg-[#1a1a1a] rounded-3xl p-5 mb-4">
          <View className="flex-row items-center gap-4">
            <View className="w-16 h-16 rounded-full bg-[#F5B800] items-center justify-center">
              <Text className="text-[#111] font-black text-xl">P</Text>
            </View>
            <View className="flex-1">
              <Text className="text-white font-extrabold text-lg">Passenger profile</Text>
              <Text className="text-gray-400 text-xs">No session loaded</Text>
            </View>
          </View>
          <TouchableOpacity className="mt-4 w-full border border-[#F5B800] py-3 rounded-2xl items-center">
            <Text className="text-[#F5B800] font-bold text-sm">Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View className="px-4 gap-4">
          {sections.map((section) => (
            <View key={section.title}>
              <Text className="text-gray-500 text-xs font-semibold uppercase mb-2 px-1">{section.title}</Text>
              <View className="bg-[#1a1a1a] rounded-3xl overflow-hidden">
                {section.items.map((item, index) => (
                  <TouchableOpacity key={item} className={`flex-row items-center gap-4 px-5 py-4 ${index < section.items.length - 1 ? "border-b border-[#252525]" : ""}`}>
                    <View className="w-9 h-9 bg-[#252525] rounded-xl items-center justify-center">
                      <Text className="text-[#F5B800] text-xs font-black">{item.slice(0, 2).toUpperCase()}</Text>
                    </View>
                    <Text className="text-white text-sm font-medium flex-1">{item}</Text>
                    <Text className="text-gray-600">&gt;</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
