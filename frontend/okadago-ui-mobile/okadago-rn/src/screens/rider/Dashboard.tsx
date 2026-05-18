import React, { useState } from "react";
import { ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenWrapper } from "../../components/ScreenWrapper";

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

const quickActions = [
  { code: "EA", label: "My Earnings", route: "Earnings" },
  { code: "IN", label: "Incentives", route: "Incentives" },
  { code: "DO", label: "Documents", route: "Documents" },
  { code: "SU", label: "Support", route: "Settings" },
];

export function Dashboard({ navigation }: Props) {
  const [isOnline, setIsOnline] = useState(false);

  return (
    <ScreenWrapper edges={["top"]}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between px-5 py-3">
          <View className="flex-row items-center gap-3">
            <View className="w-11 h-11 rounded-full bg-[#F5B800] items-center justify-center">
              <Text className="text-[#111] font-black">R</Text>
            </View>
            <View>
              <Text className="text-gray-400 text-xs">Welcome back</Text>
              <Text className="text-white font-bold text-sm">Rider profile</Text>
            </View>
          </View>
          <TouchableOpacity className="w-9 h-9 bg-[#1c1c1c] rounded-full items-center justify-center">
            <Text className="text-[#F5B800] font-black">!</Text>
          </TouchableOpacity>
        </View>

        <View className="mx-4 bg-[#1a1a1a] rounded-2xl p-4 mb-3 flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-gray-400 text-xs mb-1">Settlement Balance</Text>
            <Text className="text-white text-xl font-extrabold">No balance loaded</Text>
            <Text className="text-gray-500 text-xs mt-1">Render rider settlement wallet here.</Text>
          </View>
          <TouchableOpacity className="w-9 h-9 bg-[#252525] rounded-xl items-center justify-center">
            <Text className="text-[#F5B800] font-black">W</Text>
          </TouchableOpacity>
        </View>

        <View className="mx-4 bg-[#1a1a1a] rounded-2xl p-4 mb-3 flex-row items-center justify-between">
          <View>
            <Text className="text-gray-400 text-xs mb-1">Today's Earnings</Text>
            <Text className="text-white text-xl font-bold">No completed rides</Text>
          </View>
          <View className="bg-[#F5B800]/20 rounded-full px-3 py-1">
            <Text className="text-[#F5B800] text-xs font-bold">0 Rides</Text>
          </View>
        </View>

        <View className="mx-4 bg-[#1c1c1c] rounded-2xl p-4 mb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-white font-bold text-sm">{isOnline ? "Online" : "Offline"}</Text>
            <Text className="text-gray-400 text-xs">Wire this toggle to rider availability.</Text>
          </View>
          <Switch
            value={isOnline}
            onValueChange={setIsOnline}
            trackColor={{ false: "#7f1d1d", true: "#14763B" }}
            thumbColor="white"
          />
        </View>

        <View className="px-4 mb-4">
          <View className="flex-row justify-between">
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.code}
                className="items-center gap-1.5"
                onPress={() => navigation.navigate(action.route)}
              >
                <View className="w-12 h-12 rounded-2xl bg-[#1c1c1c] items-center justify-center">
                  <Text className="text-[#F5B800] text-xs font-black">{action.code}</Text>
                </View>
                <Text className="text-gray-400 text-center" style={{ fontSize: 9 }}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="mx-4 bg-[#1a1a1a] rounded-2xl p-4 mb-4">
          <Text className="text-white font-bold text-sm mb-2">Current trip</Text>
          <View className="rounded-2xl border border-dashed border-[#333] p-4">
            <Text className="text-white font-bold text-sm">No active trip.</Text>
            <Text className="text-gray-400 text-xs mt-2 leading-5">
              Assigned ride requests should replace this empty state from backend data.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
