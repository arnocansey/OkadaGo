import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

interface Props { navigation: NativeStackNavigationProp<any> }

export function Splash({ navigation }: Props) {
  return (
    <View className="flex-1 bg-[#F5B800]">
      <View className="items-center pt-20 pb-4 px-6">
        <Text className="text-[#111] text-5xl font-extrabold">
          Okada<Text className="text-white">Go</Text>
        </Text>
        <View className="bg-[#111] rounded-full px-4 py-1 mt-2">
          <Text className="text-[#F5B800] text-xs font-extrabold tracking-widest uppercase">Rider App</Text>
        </View>
        <Text className="text-[#111] text-xs opacity-70 mt-2">Move, deliver, earn</Text>
      </View>

      <View className="flex-1 items-center justify-center px-8">
        <View className="w-40 h-40 rounded-full bg-[#111]/15 items-center justify-center">
          <Text className="text-[#111] text-5xl font-black">R</Text>
        </View>
        <Text className="text-[#111] text-center text-base font-bold mt-6">
          Go online, receive trips, and manage settlement from one rider app.
        </Text>
      </View>

      <View className="px-6 pb-12 gap-3">
        <TouchableOpacity className="w-full bg-[#111] py-4 rounded-2xl items-center" onPress={() => navigation.navigate("Main")}>
          <Text className="text-[#F5B800] text-base font-extrabold">Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="w-full py-4 rounded-2xl items-center border border-[#111]/30"
          style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
          onPress={() => navigation.navigate("Main")}
        >
          <Text className="text-[#111] text-base font-bold">Sign Up as Rider</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
