import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { ScreenWrapper } from "../../components/ScreenWrapper";

export function Earnings() {
  const [period, setPeriod] = useState("Daily");

  return (
    <ScreenWrapper edges={["top"]}>
      <View className="flex-row items-center justify-between px-4 py-3">
        <Text className="text-white font-bold text-lg">Earnings</Text>
        <TouchableOpacity className="w-8 h-8 bg-[#1c1c1c] rounded-full items-center justify-center">
          <Text className="text-[#F5B800] font-black">F</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row gap-2 px-4 mb-4">
        {["Daily", "Weekly", "Monthly"].map((item) => (
          <TouchableOpacity
            key={item}
            onPress={() => setPeriod(item)}
            className={`px-5 py-2 rounded-full ${period === item ? "bg-[#F5B800]" : "bg-[#1c1c1c]"}`}
          >
            <Text className={`text-sm font-bold ${period === item ? "text-[#111]" : "text-gray-400"}`}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="mx-4 bg-[#1a1a1a] rounded-3xl p-5 mb-4">
          <Text className="text-gray-400 text-xs mb-2">Total Earnings</Text>
          <Text className="text-white text-3xl font-extrabold mb-1">No earnings loaded</Text>
          <Text className="text-gray-400 text-xs">Completed backend rides should populate this view.</Text>

          <View className="mt-5 gap-3">
            {["Ride earnings", "Tips", "Bonuses"].map((label) => (
              <View key={label} className="flex-row items-center justify-between py-2 border-t border-[#252525]">
                <Text className="text-gray-300 text-sm">{label}</Text>
                <Text className="text-white font-bold text-sm">--</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="mx-4 bg-[#1a1a1a] rounded-3xl p-4 mb-4">
          <Text className="text-white font-bold text-sm mb-3">Deficit policy</Text>
          <Text className="text-gray-400 text-xs leading-5">
            Show the rider settlement deficit here. When deficit reaches the configured backend
            threshold, the rider should be forced offline until they pay it down.
          </Text>
          <View className="h-3 bg-[#252525] rounded-full overflow-hidden mt-4">
            <View className="h-full bg-[#F5B800]" style={{ width: "0%" }} />
          </View>
        </View>

        <View className="px-4 pb-4">
          <TouchableOpacity className="w-full border border-[#F5B800] py-3.5 rounded-2xl items-center">
            <Text className="text-[#F5B800] font-bold text-sm">View Earnings History</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
