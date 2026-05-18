import React, { useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenWrapper } from "../../components/ScreenWrapper";

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export function Login({ navigation }: Props) {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [showPass, setShowPass] = useState(false);

  return (
    <ScreenWrapper>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-6 pb-4">
          <Text className="text-white text-2xl font-extrabold mb-1">Welcome back</Text>
          <Text className="text-gray-400 text-sm">Login to continue</Text>
        </View>

        <View className="flex-row mx-6 mb-6 bg-[#1a1a1a] rounded-2xl p-1">
          {(["login", "signup"] as const).map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => setTab(item)}
              className={`flex-1 py-2.5 rounded-xl items-center ${tab === item ? "bg-[#F5B800]" : ""}`}
            >
              <Text className={`text-sm font-bold ${tab === item ? "text-[#111]" : "text-gray-400"}`}>
                {item === "login" ? "Login" : "Sign Up"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="px-6 gap-4">
          <View>
            <Text className="text-gray-400 text-xs font-medium mb-1.5">Phone Number</Text>
            <View className="flex-row items-center bg-[#1a1a1a] rounded-2xl px-4 py-3.5 gap-3">
              <Text className="text-white text-sm font-semibold">+233</Text>
              <View className="w-px h-5 bg-[#2a2a2a]" />
              <TextInput
                className="flex-1 text-white text-sm"
                placeholder="20 123 4567"
                placeholderTextColor="#555"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View>
            <Text className="text-gray-400 text-xs font-medium mb-1.5">Password</Text>
            <View className="flex-row items-center bg-[#1a1a1a] rounded-2xl px-4 py-3.5">
              <TextInput
                className="flex-1 text-white text-sm"
                placeholder="Minimum 8 characters"
                placeholderTextColor="#555"
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                <Text className="text-gray-400 text-xs">{showPass ? "Hide" : "Show"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {tab === "login" ? (
            <TouchableOpacity className="self-end">
              <Text className="text-[#F5B800] text-xs font-semibold">Forgot password?</Text>
            </TouchableOpacity>
          ) : null}

          {tab === "signup" ? (
            <View>
              <Text className="text-gray-400 text-xs font-medium mb-1.5">Full Name</Text>
              <View className="bg-[#1a1a1a] rounded-2xl px-4 py-3.5">
                <TextInput
                  className="text-white text-sm"
                  placeholder="Your full name"
                  placeholderTextColor="#555"
                />
              </View>
            </View>
          ) : null}

          <TouchableOpacity
            className="w-full bg-[#F5B800] py-4 rounded-2xl items-center mt-2"
            onPress={() => navigation.navigate("Main")}
          >
            <Text className="text-[#111] text-base font-extrabold">
              {tab === "login" ? "Login" : "Create Account"}
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center gap-3 my-2">
            <View className="flex-1 h-px bg-[#2a2a2a]" />
            <Text className="text-gray-500 text-xs">or continue with</Text>
            <View className="flex-1 h-px bg-[#2a2a2a]" />
          </View>

          <View className="flex-row gap-3">
            {[
              { label: "G", name: "Google", bg: "#DB4437" },
              { label: "f", name: "Facebook", bg: "#4267B2" },
              { label: "A", name: "Apple", bg: "#1a1a1a" },
            ].map((provider) => (
              <TouchableOpacity
                key={provider.name}
                className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl py-3 items-center gap-1"
              >
                <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: provider.bg }}>
                  <Text className="text-white text-sm font-bold">{provider.label}</Text>
                </View>
                <Text className="text-gray-400 text-xs">{provider.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text className="text-center text-gray-500 text-xs py-8">
          By continuing, you agree to our <Text className="text-[#F5B800]">Terms</Text> and{" "}
          <Text className="text-[#F5B800]">Privacy Policy</Text>
        </Text>
      </ScrollView>
    </ScreenWrapper>
  );
}
