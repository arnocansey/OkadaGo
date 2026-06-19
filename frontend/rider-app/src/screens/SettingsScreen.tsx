import { Pressable, Text, View, ScrollView } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { Card, Pill, SectionTitle, styles } from "../components/ui";
import type { SessionUser } from "../types";

export function SettingsScreen({ user, onLogout }: { user: SessionUser; onLogout: () => void }) {
  const items = [
    { label: "General" },
    { label: "Notifications" },
    { label: "Privacy" },
    { label: "Language", value: "English" },
    { label: "Change Password" },
    { label: "Support Center" },
    { label: "About OkadaGo Rider" },
  ];

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
      <SectionTitle kicker="Settings" title="Rider account" />
      
      {/* Profile summary card */}
      <Card style={{ padding: 18, marginBottom: 12 }}>
        <Pill label="Account controls" tone="warning" />
        <Text style={[styles.emptyTitle, { marginTop: 8 }]}>{user.fullName}</Text>
        <Text style={styles.muted}>{user.email ?? user.phoneE164}</Text>
      </Card>

      {/* Settings list */}
      <View style={{ backgroundColor: "#1C1C1E", borderRadius: 16, overflow: "hidden", marginHorizontal: 16, borderWidth: 1, borderColor: "#252525" }}>
        {items.map((item, i) => (
          <Pressable
            key={i}
            style={styles.rowSetting}
          >
            <Text style={styles.rowSettingText}>{item.label}</Text>
            <View style={styles.rowSettingRight}>
              {item.value ? <Text style={styles.rowSettingVal}>{item.value}</Text> : null}
              <ChevronRight size={16} color="#A3A3A3" />
            </View>
          </Pressable>
        ))}
        
        {/* Logout action row */}
        <Pressable
          style={styles.rowSetting}
          onPress={onLogout}
        >
          <Text style={[styles.rowSettingText, { color: "#EF4444", fontWeight: "700" }]}>Logout</Text>
          <ChevronRight size={16} color="#EF4444" />
        </Pressable>
      </View>
    </ScrollView>
  );
}
