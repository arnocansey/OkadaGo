import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NavigationHeader } from "@/components/ScreenHeader";
import { DemandHeatMap } from "@/components/DemandHeatMap";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";

type DemandZone = {
  id: string;
  name: string;
  requests: number;
  avgWait: number;
  trend: "up" | "down" | "stable";
  latitude: number;
  longitude: number;
};

/**
 * DemandScreen — Rider demand heat map view.
 *
 * Shows high-demand areas with contextual info and navigation.
 */
export default function DemandScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useApp();
  const { colors } = useTheme();
  const [zones, setZones] = useState<DemandZone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDemand() {
      if (!session?.token) return;

      try {
        const data = await api<DemandZone[]>("/rider/demand", {
          token: session.token,
        });
        setZones(data);
      } catch {
        // API endpoint not available — leave zones as empty
        setZones([]);
      } finally {
        setLoading(false);
      }
    }

    fetchDemand();
  }, [session?.token]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <NavigationHeader title="Demand Map" />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <DemandHeatMap zones={zones} loading={loading} />
      </ScrollView>
    </>
  );
}
