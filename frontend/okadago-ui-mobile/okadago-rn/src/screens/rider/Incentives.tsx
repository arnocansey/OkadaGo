import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

interface Props { navigation: NativeStackNavigationProp<any> }

const ongoing = [
  { title: "5 Trips Bonus", desc: "Complete 5 trips today", reward: "GHS 20", progress: 3, total: 5 },
  { title: "10 Trips Bonus", desc: "Complete 10 trips today", reward: "GHS 40", progress: 3, total: 10 },
  { title: "Peak Hours Bonus", desc: "Complete 3 trips (5PM–8PM)", reward: "GHS 15", progress: 1, total: 3 },
];

export function Incentives({ navigation }: Props) {
  const [tab, setTab] = useState("Ongoing");

  return (
    <ScreenWrapper>
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity onPress={() => navigation.goBack()}
          className="w-8 h-8 bg-[#1c1c1c] rounded-full items-center justify-center">
          <Text className="text-white">←</Text>
        </TouchableOpacity>
        <Text className="text-white font-bold">Incentives</Text>
        <View className="w-8" />
      </View>

      {/* Hero */}
      <View className="mx-4 bg-[#F5B800] rounded-3xl p-5 mb-4 flex-row items-center gap-3">
        <View className="flex-1">
          <Text className="text-[#111] font-extrabold text-base">Complete more trips</Text>
          <Text className="text-[#111] font-extrabold text-base">earn more rewards!</Text>
          <Text className="text-[#111] opacity-70 text-xs mt-1">Keep riding to unlock bonuses</Text>
        </View>
        <Text className="text-5xl">🎁</Text>
      </View>

      <View className="flex-row gap-2 px-4 mb-4">
        {["Ongoing", "Completed"].map(t => (
          <TouchableOpacity key={t} onPress={() => setTab(t)}
            className={`px-5 py-2 rounded-full ${tab === t ? "bg-[#F5B800]" : "bg-[#1c1c1c]"}`}>
            <Text className={`text-sm font-bold ${tab === t ? "text-[#111]" : "text-gray-400"}`}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <View className="gap-3">
          {ongoing.map((item, i) => (
            <View key={i} className="bg-[#1a1a1a] rounded-2xl p-4">
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1">
                  <Text className="text-white font-bold text-sm">{item.title}</Text>
                  <Text className="text-gray-400 text-xs mt-0.5">{item.desc}</Text>
                </View>
                <View className="bg-[#F5B800] rounded-full px-3 py-1 ml-2">
                  <Text className="text-[#111] text-xs font-extrabold">{item.reward}</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-3">
                <View className="flex-1 bg-[#252525] rounded-full overflow-hidden" style={{ height: 8 }}>
                  <View className="h-full bg-[#F5B800] rounded-full" style={{ width: `${(item.progress / item.total) * 100}%` }} />
                </View>
                <Text className="text-gray-400 text-xs font-semibold">{item.progress}/{item.total}</Text>
              </View>
            </View>
          ))}
          <View className="bg-[#1a1a1a] rounded-2xl p-4 flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: "rgba(74,222,128,0.15)" }}>
              <Text>✅</Text>
            </View>
            <View className="flex-1">
              <Text className="text-white text-sm font-bold">Morning Rush</Text>
              <Text className="text-gray-400 text-xs">Today, 8AM</Text>
            </View>
            <Text className="text-green-400 font-bold text-sm">GHS 10</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
