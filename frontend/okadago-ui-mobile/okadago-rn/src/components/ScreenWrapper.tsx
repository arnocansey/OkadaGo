import React from "react";
import { View, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Props {
  children: React.ReactNode;
  edges?: ("top" | "bottom" | "left" | "right")[];
}

export function ScreenWrapper({ children, edges = ["top", "bottom"] }: Props) {
  return (
    <SafeAreaView className="flex-1 bg-[#111111]" edges={edges}>
      <StatusBar barStyle="light-content" backgroundColor="#111111" />
      {children}
    </SafeAreaView>
  );
}
