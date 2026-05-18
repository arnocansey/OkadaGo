import { Text } from "react-native";
import { Card, EmptyState, SectionTitle, StatCard, styles } from "../components/ui";
import type { Ride } from "../types";

export function IncentivesScreen({ rides }: { rides: Ride[] }) {
  const completedCount = rides.filter((ride) => ride.status === "COMPLETED").length;
  return (
    <>
      <SectionTitle kicker="Incentives" title="Performance rewards" />
      <Card>
        <Text style={styles.muted}>Rewards are calculated from live completed ride records. No dummy bonus data is shown.</Text>
        <StatCard label="Completed rides" value={`${completedCount}`} />
      </Card>
      <EmptyState title="No active incentive campaign." body="Admin-created incentive campaigns will appear here when the backend exposes them." />
    </>
  );
}
