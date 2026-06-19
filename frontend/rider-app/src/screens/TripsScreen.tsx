import { Linking, Pressable, View } from "react-native";
import { api, compactDate, money, nextDeliveryStatus, nextRideStatus } from "../api";
import { Card, EmptyState, ListRow, Pill, PrimaryButton, SectionTitle } from "../components/ui";
import { SkeletonCard } from "../components/Skeleton";
import { RideStatusBadge } from "../components/RideStatusBadge";
import { TripTimeline, TimelineStep } from "../components/TripTimeline";
import { ContextMenu, ContextMenuAction } from "../components/ContextMenu";
import { useState } from "react";
import type { Delivery, Ride, Session } from "../types";

function mapStatusToBadge(status: string): "completed" | "in_progress" | "pending" | "cancelled" {
  const s = (status || "").toLowerCase();
  if (s === "completed" || s === "delivered") return "completed";
  if (["started", "arriving", "arrived", "en_route", "in_progress", "picked_up", "assigned"].includes(s)) return "in_progress";
  if (s === "cancelled") return "cancelled";
  return "pending";
}

function getRideTimelineSteps(status: string): TimelineStep[] {
  const currentStatus = (status || "").toLowerCase();
  return [
    { status: "Request Created", isCompleted: true, isActive: false },
    { 
      status: "Rider Assigned", 
      isCompleted: ["assigned", "arriving", "arrived", "started", "completed"].includes(currentStatus), 
      isActive: currentStatus === "assigned" 
    },
    { 
      status: "Rider Arrived", 
      isCompleted: ["arrived", "started", "completed"].includes(currentStatus), 
      isActive: currentStatus === "arrived" || currentStatus === "arriving" 
    },
    { 
      status: "Trip Started", 
      isCompleted: ["started", "completed"].includes(currentStatus), 
      isActive: currentStatus === "started" 
    },
    { 
      status: "Trip Completed", 
      isCompleted: currentStatus === "completed", 
      isActive: false 
    }
  ];
}

function getDeliveryTimelineSteps(status: string): TimelineStep[] {
  const currentStatus = (status || "").toLowerCase();
  return [
    { status: "Delivery Requested", isCompleted: true, isActive: false },
    { 
      status: "Rider Assigned", 
      isCompleted: ["assigned", "picked_up", "delivered"].includes(currentStatus), 
      isActive: currentStatus === "assigned" 
    },
    { 
      status: "Package Picked Up", 
      isCompleted: ["picked_up", "delivered"].includes(currentStatus), 
      isActive: currentStatus === "picked_up" 
    },
    { 
      status: "Package Delivered", 
      isCompleted: currentStatus === "delivered" || currentStatus === "completed", 
      isActive: false 
    }
  ];
}

export function TripsScreen({
  session,
  rides,
  deliveries,
  loading,
  onRefresh,
}: {
  session: Session;
  rides: Ride[];
  deliveries: Delivery[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const [visibleLimit, setVisibleLimit] = useState(5);
  const [selectedItem, setSelectedItem] = useState<{ type: "ride" | "delivery"; address: string; label: string } | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  async function moveRide(ride: Ride) {
    const nextStatus = nextRideStatus(ride.status);
    if (!nextStatus) return;
    try {
      await api(`/rides/${ride.id}/status`, { method: "PATCH", body: { nextStatus, actorRole: "rider", actorUserId: session.user.id } });
      onRefresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not update trip.");
    }
  }

  async function moveDelivery(delivery: Delivery) {
    const isSearching = delivery.status.toLowerCase() === "searching";
    const nextStatus = isSearching ? "assigned" : nextDeliveryStatus(delivery.status);
    if (!nextStatus) return;
    try {
      await api(`/deliveries/${delivery.id}/status`, {
        method: "PATCH",
        body: {
          nextStatus,
          actorRole: "rider",
          actorUserId: session.user.id,
          riderProfileId: isSearching ? session.user.riderProfileId : undefined,
        },
      });
      onRefresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not update delivery.");
    }
  }

  const hasWork = rides.length > 0 || deliveries.length > 0;

  if (loading && !hasWork) {
    return (
      <>
        <SectionTitle kicker="Trips" title="Trip and delivery queue" />
        <View style={{ gap: 14 }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      </>
    );
  }

  const visibleRides = rides.slice(0, visibleLimit);
  const visibleDeliveries = deliveries.slice(0, visibleLimit);
  const hasMore = rides.length > visibleLimit || deliveries.length > visibleLimit;

  const contextMenuActions: ContextMenuAction[] = selectedItem ? [
    {
      title: "Open Destination in Maps",
      onPress: () => {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedItem.address)}`);
      }
    },
    {
      title: "Alert Address Details",
      onPress: () => {
        alert(`Location Address: ${selectedItem.address}`);
      }
    }
  ] : [];

  return (
    <>
      <SectionTitle kicker="Trips" title="Trip and delivery queue" />
      <Card>
        {hasWork ? (
          <>
          {visibleRides.length > 0 && <Pill label={`${rides.length} ride jobs`} />}
          {visibleRides.map((ride) => (
            <Pressable
              key={ride.id}
              onLongPress={() => {
                setSelectedItem({ type: "ride", address: ride.destinationAddress, label: `Ride to ${ride.destinationAddress}` });
                setMenuVisible(true);
              }}
              delayLongPress={400}
              style={{ gap: 12, borderBottomWidth: 1, borderBottomColor: "#2A2A2A", paddingBottom: 14, paddingTop: 10 }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <RideStatusBadge status={mapStatusToBadge(ride.status)} />
              </View>
              <ListRow
                title={ride.pickupAddress}
                body={ride.destinationAddress}
                meta={`Created: ${compactDate(ride.createdAt)} (Hold for actions)`}
                amount={money(ride.riderEarnings ?? ride.finalFare ?? ride.estimatedFare, ride.currency ?? "GHS")}
              />
              <TripTimeline steps={getRideTimelineSteps(ride.status)} />
              {nextRideStatus(ride.status) ? <PrimaryButton label={`Mark ${nextRideStatus(ride.status)}`} onPress={() => moveRide(ride)} /> : null}
            </Pressable>
          ))}
          <View style={{ height: 16 }} />
          {visibleDeliveries.length > 0 && <Pill label={`${deliveries.length} delivery jobs`} tone="warning" />}
          {visibleDeliveries.map((delivery) => {
            const isSearching = delivery.status.toLowerCase() === "searching";
            const nextStatus = isSearching ? "assigned" : nextDeliveryStatus(delivery.status);

            return (
              <Pressable
                key={delivery.id}
                onLongPress={() => {
                  setSelectedItem({ type: "delivery", address: delivery.dropoffAddress, label: `Delivery to ${delivery.dropoffAddress}` });
                  setMenuVisible(true);
                }}
                delayLongPress={400}
                style={{ gap: 12, borderBottomWidth: 1, borderBottomColor: "#2A2A2A", paddingBottom: 14, paddingTop: 10 }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <RideStatusBadge status={mapStatusToBadge(delivery.status)} />
                </View>
                <ListRow
                  title={delivery.packageDescription}
                  body={`${delivery.pickupAddress} to ${delivery.dropoffAddress}`}
                  meta={`Created: ${compactDate(delivery.createdAt)} (Hold for actions)`}
                  amount={money(delivery.riderEarnings ?? delivery.finalFee ?? delivery.estimatedFee, delivery.currency ?? "GHS")}
                />
                <TripTimeline steps={getDeliveryTimelineSteps(delivery.status)} />
                {nextStatus ? <PrimaryButton label={isSearching ? "Accept delivery" : `Mark ${nextStatus}`} onPress={() => moveDelivery(delivery)} /> : null}
              </Pressable>
            );
          })}
          {hasMore && (
            <View style={{ marginTop: 12 }}>
              <PrimaryButton label="Load More Trips" onPress={() => setVisibleLimit(prev => prev + 5)} dark />
            </View>
          )}
          </>
        ) : <EmptyState title="No work assigned." body="Trips and deliveries assigned to your rider profile will be listed here." />}
      </Card>

      <ContextMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        actions={contextMenuActions}
        title={selectedItem?.label}
      />
    </>
  );
}
