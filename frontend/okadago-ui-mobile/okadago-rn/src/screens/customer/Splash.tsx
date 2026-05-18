import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

interface Props { navigation: NativeStackNavigationProp<any> }

export function Splash({ navigation }: Props) {
  return (
    <View className="flex-1" style={{ backgroundColor: "#F5B800" }}>
      <View className="flex-1 bg-[#F5B800]">
        <View className="items-center pt-20 pb-8 px-6">
          <Text className="text-[#111] text-5xl font-extrabold">
            Okada<Text className="text-white">Go</Text>
          </Text>
          <Text className="text-[#111] text-sm font-semibold opacity-80 mt-1">Move, deliver, earn</Text>
          <Text className="text-[#111] text-xs opacity-60 mt-1">Every trip takes you forward</Text>
        </View>

        <View className="flex-1 items-center justify-center">
          <View className="w-40 h-40 rounded-full bg-[#111]/15 items-center justify-center">
            <Text className="text-[#111] text-5xl font-black">O</Text>
          </View>
          <View className="absolute left-8 top-1/3">
            {[60, 40, 70].map((width) => (
              <View key={width} className="bg-[#111] rounded-full mb-2 opacity-20" style={{ width, height: 2 }} />
            ))}
          </View>
        </View>

        <View className="px-6 pb-12 gap-3">
          <TouchableOpacity className="w-full bg-[#111] py-4 rounded-2xl items-center" onPress={() => navigation.navigate("Login")}>
            <Text className="text-white text-base font-extrabold">Get Started</Text>
          </TouchableOpacity>
          <TouchableOpacity className="w-full bg-white/20 border border-[#111]/30 py-4 rounded-2xl items-center" onPress={() => navigation.navigate("Login")}>
            <Text className="text-[#111] text-base font-bold">Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
