import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { ScreenWrapper } from "../../components/ScreenWrapper";

export function Wallet() {
  return (
    <ScreenWrapper edges={["top"]}>
      <View className="flex-row items-center justify-between px-4 py-3">
        <Text className="text-white font-bold text-lg">Wallet</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="mx-4 bg-[#F5B800] rounded-3xl p-5 mb-4">
          <Text className="text-[#111] text-sm font-semibold mb-2">Settlement Balance</Text>
          <Text className="text-[#111] text-3xl font-extrabold mb-2">No balance loaded</Text>
          <Text className="text-[#111]/70 text-xs mb-4">
            Render rider settlement wallet, locked payout amount, and deficit here.
          </Text>
          <TouchableOpacity className="w-full bg-[#111] py-3.5 rounded-2xl items-center">
            <Text className="text-white font-bold text-sm">Request payout</Text>
          </TouchableOpacity>
        </View>

        <View className="px-4 mb-4">
          <Text className="text-white font-bold text-sm mb-3">Transaction History</Text>
          <View className="bg-[#1a1a1a] rounded-3xl p-5 border border-[#252525]">
            <Text className="text-white font-bold text-sm">No wallet activity yet.</Text>
            <Text className="text-gray-400 text-xs mt-2 leading-5">
              Ride settlements, top-ups, and withdrawals should appear from backend wallet transactions.
            </Text>
          </View>
        </View>

        <View className="px-4 mb-4">
          <Text className="text-white font-bold text-sm mb-3">Payout Methods</Text>
          <View className="bg-[#1a1a1a] rounded-3xl p-5 border border-[#252525]">
            <Text className="text-white font-bold text-sm">No payout method selected.</Text>
            <Text className="text-gray-400 text-xs mt-2 leading-5">
              Add mobile money or bank destination labels when payout method endpoints are connected.
            </Text>
            <TouchableOpacity className="mt-4">
              <Text className="text-[#F5B800] text-sm font-semibold">+ Add payout method</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
