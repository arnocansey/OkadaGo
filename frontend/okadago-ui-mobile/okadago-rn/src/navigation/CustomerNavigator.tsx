import React from "react";
import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { BookRide } from "../screens/customer/BookRide";
import { Home } from "../screens/customer/Home";
import { LiveTracking } from "../screens/customer/LiveTracking";
import { Login } from "../screens/customer/Login";
import { MyTrips } from "../screens/customer/MyTrips";
import { Profile } from "../screens/customer/Profile";
import { SideMenu } from "../screens/customer/SideMenu";
import { Splash } from "../screens/customer/Splash";
import { TrackRide } from "../screens/customer/TrackRide";
import { TripComplete } from "../screens/customer/TripComplete";
import { Wallet } from "../screens/customer/Wallet";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <>
      <Text style={{ color: focused ? "#111111" : "#F5B800", fontSize: 13, fontWeight: "900" }}>
        {icon}
      </Text>
      <Text style={{ color: focused ? "#F5B800" : "#666666", fontSize: 10, fontWeight: "700" }}>
        {label}
      </Text>
    </>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: { backgroundColor: "#111111", borderTopColor: "#252525", height: 64 },
      }}
    >
      <Tab.Screen name="Home" component={Home} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="H" label="Home" focused={focused} /> }} />
      <Tab.Screen name="MyTrips" component={MyTrips} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="T" label="Trips" focused={focused} /> }} />
      <Tab.Screen name="Wallet" component={Wallet} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="W" label="Wallet" focused={focused} /> }} />
      <Tab.Screen name="Profile" component={Profile} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="P" label="Profile" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

export function CustomerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
      <Stack.Screen name="Splash" component={Splash} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="BookRide" component={BookRide} />
      <Stack.Screen name="TrackRide" component={TrackRide} />
      <Stack.Screen name="LiveTracking" component={LiveTracking} />
      <Stack.Screen name="TripComplete" component={TripComplete} />
      <Stack.Screen name="SideMenu" component={SideMenu} />
    </Stack.Navigator>
  );
}
