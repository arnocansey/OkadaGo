import React from "react";
import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { ArrivedPickup } from "../screens/rider/ArrivedPickup";
import { Dashboard } from "../screens/rider/Dashboard";
import { Documents } from "../screens/rider/Documents";
import { Earnings } from "../screens/rider/Earnings";
import { Incentives } from "../screens/rider/Incentives";
import { OnTheWay } from "../screens/rider/OnTheWay";
import { Profile } from "../screens/rider/Profile";
import { RideRequest } from "../screens/rider/RideRequest";
import { Settings } from "../screens/rider/Settings";
import { Splash } from "../screens/rider/Splash";
import { TripCompleted } from "../screens/rider/TripCompleted";
import { TripProgress } from "../screens/rider/TripProgress";
import { TripsHistory } from "../screens/rider/TripsHistory";
import { Wallet } from "../screens/rider/Wallet";

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

function RiderTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: { backgroundColor: "#111111", borderTopColor: "#252525", height: 64 },
      }}
    >
      <Tab.Screen name="Dashboard" component={Dashboard} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="H" label="Home" focused={focused} /> }} />
      <Tab.Screen name="Earnings" component={Earnings} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="E" label="Earnings" focused={focused} /> }} />
      <Tab.Screen name="TripsHistory" component={TripsHistory} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="T" label="Trips" focused={focused} /> }} />
      <Tab.Screen name="Wallet" component={Wallet} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="W" label="Wallet" focused={focused} /> }} />
      <Tab.Screen name="Profile" component={Profile} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="P" label="Profile" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

export function RiderNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
      <Stack.Screen name="Splash" component={Splash} />
      <Stack.Screen name="Main" component={RiderTabs} />
      <Stack.Screen name="RideRequest" component={RideRequest} />
      <Stack.Screen name="OnTheWay" component={OnTheWay} />
      <Stack.Screen name="ArrivedPickup" component={ArrivedPickup} />
      <Stack.Screen name="TripProgress" component={TripProgress} />
      <Stack.Screen name="TripCompleted" component={TripCompleted} />
      <Stack.Screen name="Incentives" component={Incentives} />
      <Stack.Screen name="Documents" component={Documents} />
      <Stack.Screen name="Settings" component={Settings} />
    </Stack.Navigator>
  );
}
