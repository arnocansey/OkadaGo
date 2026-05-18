import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Switch } from "react-native";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

interface Props { navigation: NativeStackNavigationProp<any> }

const sections = [
  { title: "General", items: [
    { icon: "⚙️", label: "General" },
    { icon: "🔔", label: "Notifications" },
    { icon: "🔒", label: "Privacy" },
    { icon: "🌐", label: "Language", value: "English" },
  ]},
  { title: "Account", items: [
    { icon: "🔑", label: "Change Password" },
    { icon: "🎧", label: "Support Center" },
    { icon: "ℹ️", label: "About OkadaGo Rider" },
  ]},
];

export function Settings({ navigation }: Props) {
  const [darkMode, setDarkMode] = useState(true);
  const [sound, setSound] = useState(true);
  const [vibration, setVibration] = useState(false);

  return (
    <ScreenWrapper>
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity onPress={() => navigation.goBack()}
          className="w-8 h-8 bg-[#1c1c1c] rounded-full items-center justify-center">
          <Text className="text-white">←</Text>
        </TouchableOpacity>
        <Text className="text-white font-bold">Settings</Text>
        <View className="w-8" />
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {sections.map((section, si) => (
          <View key={si} className="mb-4">
            <Text className="text-gray-500 text-xs font-semibold uppercase mb-2 px-1">{section.title}</Text>
            <View className="bg-[#1a1a1a] rounded-3xl overflow-hidden">
              {section.items.map((item, ii) => (
                <TouchableOpacity
                  key={ii}
                  className={`flex-row items-center gap-4 px-5 py-4 ${ii < section.items.length - 1 ? "border-b border-[#252525]" : ""}`}
                >
                  <View className="w-9 h-9 bg-[#252525] rounded-xl items-center justify-center">
                    <Text>{item.icon}</Text>
                  </View>
                  <Text className="text-white text-sm font-medium flex-1">{item.label}</Text>
                  {item.value && <Text className="text-gray-400 text-xs mr-1">{item.value}</Text>}
                  <Text className="text-gray-600">›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Toggles */}
        <View className="mb-4">
          <Text className="text-gray-500 text-xs font-semibold uppercase mb-2 px-1">Preferences</Text>
          <View className="bg-[#1a1a1a] rounded-3xl overflow-hidden">
            {[
              { label: "Dark Mode", value: darkMode, set: setDarkMode },
              { label: "Sound Alerts", value: sound, set: setSound },
              { label: "Vibration", value: vibration, set: setVibration },
            ].map((toggle, i) => (
              <View key={i} className={`flex-row items-center px-5 py-4 ${i < 2 ? "border-b border-[#252525]" : ""}`}>
                <Text className="text-white text-sm font-medium flex-1">{toggle.label}</Text>
                <Switch
                  value={toggle.value}
                  onValueChange={toggle.set}
                  trackColor={{ false: "#333", true: "#F5B800" }}
                  thumbColor="white"
                />
              </View>
            ))}
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity className="flex-row items-center gap-3 px-5 py-4 bg-[#1a1a1a] rounded-2xl mb-8">
          <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: "rgba(239,68,68,0.15)" }}>
            <Text>🚪</Text>
          </View>
          <Text className="text-red-400 text-sm font-semibold">Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  );
}
