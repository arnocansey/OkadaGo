import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenWrapper } from "../../components/ScreenWrapper";

interface Props { navigation: NativeStackNavigationProp<any> }

const docs = ["Driver's License", "Motor Insurance", "Roadworthy Certificate", "Ghana Card", "Vehicle Registration"];

export function Documents({ navigation }: Props) {
  return (
    <ScreenWrapper>
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity onPress={() => navigation.goBack()} className="px-3 py-2 bg-[#1c1c1c] rounded-full">
          <Text className="text-white text-xs font-bold">Back</Text>
        </TouchableOpacity>
        <Text className="text-white font-bold">Documents</Text>
        <View className="w-12" />
      </View>

      <View className="mx-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 mb-5">
        <Text className="text-gray-300 text-xs leading-5">
          Document status should be loaded from compliance endpoints, not hardcoded.
        </Text>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <View className="gap-3">
          {docs.map((doc) => (
            <View key={doc} className="bg-[#1a1a1a] rounded-2xl p-4 flex-row items-center gap-4">
              <View className="w-12 h-12 rounded-2xl bg-[#252525] items-center justify-center">
                <Text className="text-[#F5B800] text-xs font-black">{doc.slice(0, 2).toUpperCase()}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-sm">{doc}</Text>
                <Text className="text-gray-400 text-xs mt-0.5">No document uploaded</Text>
              </View>
              <Text className="text-gray-500 text-xs font-semibold">Pending</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View className="px-4 py-4">
        <TouchableOpacity className="w-full bg-[#F5B800] py-4 rounded-2xl items-center">
          <Text className="text-[#111] text-base font-extrabold">Upload Document</Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}
