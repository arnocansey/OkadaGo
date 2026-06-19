import { useState } from "react";
import { Pressable, Text, View, ScrollView } from "react-native";
import { Card, SectionTitle, styles } from "../components/ui";
import type { Ride } from "../types";

export function IncentivesScreen({ rides }: { rides: Ride[] }) {
  const [tab, setTab] = useState<"Ongoing" | "Completed">("Ongoing");
  
  const completedCount = rides.filter((ride) => (ride.status ?? "").toLowerCase() === "completed").length;

  const ongoingBonuses = [
    { title: "5 Trips Bonus", desc: "Complete 5 trips today", reward: "GHS 20", progress: Math.min(completedCount, 5), total: 5 },
    { title: "10 Trips Bonus", desc: "Complete 10 trips today", reward: "GHS 40", progress: Math.min(completedCount, 10), total: 10 },
    { title: "Peak Hours Bonus", desc: "Complete 3 trips (5PM – 8PM)", reward: "GHS 15", progress: Math.min(completedCount, 3), total: 3 },
  ];

  const completedBonuses = completedCount >= 5 ? [
    { title: "5 Trips Bonus", desc: "Complete 5 trips today", reward: "GHS 20", progress: 5, total: 5 },
  ] : [];

  const list = tab === "Ongoing" ? ongoingBonuses : completedBonuses;

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
      <SectionTitle kicker="Incentives" title="Performance rewards" />

      {/* Hero Banner */}
      <View style={{ marginHorizontal: 16, marginVertical: 12, backgroundColor: "#FACC15", borderRadius: 16, padding: 18 }}>
        <Text style={{ color: "#111111", fontSize: 16, fontWeight: "900" }}>Complete more trips,</Text>
        <Text style={{ color: "#111111", fontSize: 16, fontWeight: "900" }}>earn more rewards!</Text>
        <Text style={{ fontSize: 28, marginTop: 8 }}>🎁</Text>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: "row", marginHorizontal: 16, marginBottom: 16, backgroundColor: "#111111", borderRadius: 12, padding: 4, borderWidth: 1, borderColor: "#252525" }}>
        {(["Ongoing", "Completed"] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={{
              flex: 1,
              backgroundColor: tab === t ? "#FACC15" : "transparent",
              borderRadius: 8,
              paddingVertical: 8,
              alignItems: "center"
            }}
          >
            <Text style={{ color: tab === t ? "#111111" : "#A3A3A3", fontWeight: "900", fontSize: 13 }}>{t}</Text>
          </Pressable>
        ))}
      </View>

      {/* Incentives List */}
      <View style={{ marginHorizontal: 16, gap: 12 }}>
        {list.length > 0 ? (
          list.map((b, i) => (
            <View key={i} style={styles.incentiveCard}>
              <View style={styles.incentiveHeader}>
                <Text style={styles.incentiveTitle}>{b.title}</Text>
                <Text style={styles.incentiveReward}>{b.reward}</Text>
              </View>
              <Text style={styles.incentiveDesc}>{b.desc}</Text>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${(b.progress / b.total) * 100}%` }]} />
              </View>
              <Text style={styles.incentiveProgressText}>{b.progress} / {b.total} completed</Text>
            </View>
          ))
        ) : (
          <Card>
            <Text style={[styles.emptyTitle, { textAlign: "center", marginVertical: 20 }]}>No campaigns to show here.</Text>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}
