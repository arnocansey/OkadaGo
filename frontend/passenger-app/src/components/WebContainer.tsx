import React, { useEffect, useState } from "react";
import { Platform, View, Text, StyleSheet } from "react-native";
import { Wifi, Signal, BatteryCharging } from "lucide-react-native";

export function WebContainer({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== "web") {
    return <>{children}</>;
  }

  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    function checkSize() {
      if (typeof window !== "undefined") {
        setIsDesktop(window.innerWidth > 500);
      }
    }
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  return (
    <View style={styles.webOuter}>
      <View style={[styles.appFrame, isDesktop && styles.desktopFrame]}>
        {isDesktop ? (
          <View style={styles.statusBarHeader}>
            <Text style={styles.timeText}>9:41</Text>
            <View style={styles.notchPill} />
            <View style={styles.statusIcons}>
              <Signal size={12} color="#FFFFFF" />
              <Wifi size={12} color="#FFFFFF" />
              <BatteryCharging size={14} color="#22C55E" />
            </View>
          </View>
        ) : null}
        <View style={styles.innerContent}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webOuter: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#050811",
    alignItems: "center",
    justifyContent: "center",
  },
  appFrame: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#0F172A",
  },
  desktopFrame: {
    width: 390,
    height: 844,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.15)",
    boxShadow: "0 30px 80px -20px rgba(0, 0, 0, 0.9)",
    overflow: "hidden",
  },
  statusBarHeader: {
    height: 44,
    backgroundColor: "#080E1A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
    zIndex: 100,
  },
  timeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  notchPill: {
    width: 90,
    height: 14,
    backgroundColor: "#000000",
    borderRadius: 7,
  },
  statusIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  innerContent: {
    flex: 1,
  },
});
