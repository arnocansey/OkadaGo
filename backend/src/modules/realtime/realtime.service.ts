import type { Server } from "socket.io";

let io: Server | null = null;

export function setRealtimeServer(server: Server) {
  io = server;
}

export function getRealtimeServer() {
  return io;
}

function emitToUser(userId: string, event: string, data: unknown) {
  io?.to(`user:${userId}`).emit(event, data);
}

function emitToUsers(userIds: string[], event: string, data: unknown) {
  for (const userId of userIds) {
    emitToUser(userId, event, data);
  }
}

export function emitRideAssigned(payload: {
  ride: Record<string, unknown>;
  passengerUserId: string;
  riderUserId?: string | null;
}) {
  emitToUser(payload.passengerUserId, "ride:assigned", payload.ride);
  if (payload.riderUserId) {
    emitToUser(payload.riderUserId, "ride:assigned", payload.ride);
  }
}

export function emitRideRequestToRiders(payload: {
  ride: Record<string, unknown>;
  riderUserIds: string[];
}) {
  emitToUsers(payload.riderUserIds, "ride:request", payload.ride);
  emitToUsers(payload.riderUserIds, "ride:assigned", payload.ride);
}

export function emitRideStatusUpdate(payload: {
  ride: Record<string, unknown>;
  passengerUserId: string;
  riderUserId?: string | null;
}) {
  const patch = payload.ride;
  emitToUsers(
    [payload.passengerUserId, payload.riderUserId].filter(Boolean) as string[],
    "ride:status-update",
    patch,
  );
}

export function emitRiderLocationUpdate(payload: {
  rideId: string;
  deliveryId?: string;
  latitude: number;
  longitude: number;
  passengerUserId: string;
  riderUserId?: string | null;
}) {
  const data = {
    rideId: payload.rideId,
    deliveryId: payload.deliveryId,
    latitude: payload.latitude,
    longitude: payload.longitude,
  };
  emitToUser(payload.passengerUserId, "rider:location-update", data);
  if (payload.riderUserId) {
    emitToUser(payload.riderUserId, "rider:location-update", data);
  }
}

export function emitDeliveryStatusUpdate(payload: {
  delivery: Record<string, unknown>;
  passengerUserId: string;
  riderUserId?: string | null;
}) {
  emitToUsers(
    [payload.passengerUserId, payload.riderUserId].filter(Boolean) as string[],
    "delivery:status-update",
    payload.delivery,
  );
}

export function emitNotification(userId: string, data: Record<string, unknown>) {
  emitToUser(userId, "notification", data);
}

export function serializeRideForRealtime(ride: {
  id: string;
  status: string;
  passengerId: string;
  riderId: string | null;
  pickupAddress: string;
  destinationAddress: string;
  pickupLatitude: unknown;
  pickupLongitude: unknown;
  destinationLatitude: unknown;
  destinationLongitude: unknown;
  estimatedDistanceKm: unknown;
  estimatedDurationMinutes: number | null;
  estimatedFare: unknown;
  finalFare: unknown;
  currency: string;
  createdAt: Date;
  passenger?: { userId: string; user?: { fullName: string; phoneE164?: string } };
  rider?: {
    id: string;
    userId: string;
    currentLatitude: unknown;
    currentLongitude: unknown;
    user?: { fullName: string; phoneE164?: string };
    vehicle?: { plateNumber?: string | null } | null;
  } | null;
}) {
  return {
    id: ride.id,
    status: ride.status.toLowerCase(),
    passengerId: ride.passengerId,
    riderId: ride.riderId,
    pickupAddress: ride.pickupAddress,
    destinationAddress: ride.destinationAddress,
    pickupLatitude: ride.pickupLatitude,
    pickupLongitude: ride.pickupLongitude,
    destinationLatitude: ride.destinationLatitude,
    destinationLongitude: ride.destinationLongitude,
    estimatedDistanceKm: ride.estimatedDistanceKm,
    estimatedDurationMinutes: ride.estimatedDurationMinutes,
    estimatedFare: ride.estimatedFare,
    finalFare: ride.finalFare,
    currency: ride.currency,
    createdAt: ride.createdAt.toISOString(),
    passenger: ride.passenger
      ? { id: ride.passengerId, user: ride.passenger.user ?? undefined }
      : undefined,
    rider: ride.rider
      ? {
          id: ride.rider.id,
          currentLatitude: ride.rider.currentLatitude,
          currentLongitude: ride.rider.currentLongitude,
          user: ride.rider.user,
          vehicle: ride.rider.vehicle,
        }
      : null,
  };
}

export function serializeDeliveryForRealtime(delivery: {
  id: string;
  status: string;
  pickupAddress: string;
  dropoffAddress: string;
  estimatedFee: unknown;
  finalFee: unknown;
  currency: string;
  riderId: string | null;
  passengerId: string;
}) {
  return {
    id: delivery.id,
    status: delivery.status.toLowerCase(),
    pickupAddress: delivery.pickupAddress,
    dropoffAddress: delivery.dropoffAddress,
    estimatedFee: delivery.estimatedFee,
    finalFee: delivery.finalFee,
    currency: delivery.currency,
    riderId: delivery.riderId,
    passengerId: delivery.passengerId,
  };
}
