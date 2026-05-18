import "./global.css";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { CustomerNavigator } from "./src/navigation/CustomerNavigator";
import { RiderNavigator } from "./src/navigation/RiderNavigator";

export default function App() {
  const [mode, setMode] = useState<"customer" | "rider" | null>(null);

  if (!mode) {
    return (
      <SafeAreaProvider>
        <View className="flex-1 bg-[#111111] items-center justify-center px-6">
          <Text className="text-white text-4xl font-extrabold mb-1">
            Okada<Text className="text-[#F5B800]">Go</Text>
          </Text>
          <Text className="text-gray-400 text-sm mb-12">Select your app to preview</Text>

          <TouchableOpacity
            className="w-full bg-[#F5B800] py-4 rounded-2xl items-center mb-3"
            onPress={() => setMode("customer")}
          >
            <Text className="text-[#111] text-base font-extrabold">Customer App</Text>
            <Text className="text-[#111] text-xs opacity-70 mt-0.5">Book rides and track trips</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] py-4 rounded-2xl items-center"
            onPress={() => setMode("rider")}
          >
            <Text className="text-white text-base font-extrabold">Rider App</Text>
            <Text className="text-gray-400 text-xs mt-0.5">Accept rides and manage earnings</Text>
          </TouchableOpacity>

          <Text className="text-gray-600 text-xs mt-8 text-center">
            OkadaGo - Fast, safe, reliable
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {mode === "customer" ? <CustomerNavigator /> : <RiderNavigator />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
