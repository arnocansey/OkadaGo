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
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-[#111] text-sm font-semibold">OkadaGo Wallet</Text>
            <Text className="text-[#111] font-black">W</Text>
          </View>
          <Text className="text-[#111] text-3xl font-extrabold mb-2">No balance loaded</Text>
          <Text className="text-[#111]/70 text-xs mb-5">
            Render the backend passenger wallet balance and locked balance here.
          </Text>
          <View className="flex-row gap-2">
            {["Top Up", "Send", "Request", "More"].map((label) => (
              <TouchableOpacity
                key={label}
                className="flex-1 rounded-2xl py-3 items-center gap-1"
                style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
              >
                <Text className="text-[#111] font-semibold" style={{ fontSize: 9 }}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="px-4">
          <Text className="text-white font-bold text-sm mb-3">Recent Transactions</Text>
          <View className="bg-[#1a1a1a] rounded-3xl p-5 border border-[#252525]">
            <Text className="text-white font-bold text-sm">No wallet activity yet.</Text>
            <Text className="text-gray-400 text-xs mt-2 leading-5">
              Top-ups, ride payments, refunds, and promo credits should appear here from the
              wallet transactions endpoint.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
