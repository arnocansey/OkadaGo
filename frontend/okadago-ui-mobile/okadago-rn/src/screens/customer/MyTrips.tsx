import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { ScreenWrapper } from "../../components/ScreenWrapper";

export function MyTrips() {
  const [activeTab, setActiveTab] = useState("All");

  return (
    <ScreenWrapper edges={["top"]}>
      <View className="px-5 py-4">
        <Text className="text-white text-xl font-bold">My Trips</Text>
      </View>

      <View className="flex-row gap-2 px-4 mb-4">
        {["All", "Completed", "Cancelled"].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full ${activeTab === tab ? "bg-[#F5B800]" : "bg-[#1c1c1c]"}`}
          >
            <Text className={`text-sm font-semibold ${activeTab === tab ? "text-[#111]" : "text-gray-400"}`}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <View className="bg-[#1a1a1a] rounded-3xl p-5 border border-[#252525]">
          <Text className="text-white font-bold text-base">No trips yet.</Text>
          <Text className="text-gray-400 text-sm leading-6 mt-2">
            Passenger rides should be loaded from the backend and filtered by the selected status.
          </Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
