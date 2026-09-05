import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { appConfig } from "../../common/config.js";
import { prisma } from "../../common/prisma.js";
import { isTokenLocallyRevoked } from "../../common/token-revocation.js";
import { setRealtimeServer } from "./realtime.service.js";
import { liveLocationService, type LiveRiderStatus } from "./location.service.js";

const lastPingBySocket = new Map<string, number>();

export function attachRealtimeServer(httpServer: HttpServer) {
  const corsOrigin =
    appConfig.corsOrigin === "*"
      ? true
      : appConfig.corsOrigin.split(",").map((origin) => origin.trim());

  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ["GET", "POST"],
    },
    path: "/socket.io",
  });

  // Preload online riders from database on server boot
  void liveLocationService.warmup();

  io.use(async (socket, next) => {
    try {
      const token =
        (typeof socket.handshake.auth?.token === "string" && socket.handshake.auth.token) ||
        (typeof socket.handshake.query?.token === "string" && socket.handshake.query.token);

      if (!token || isTokenLocallyRevoked(token)) {
        next(new Error("Authentication token is required or revoked"));
        return;
      }

      const session = await prisma.userSession.findUnique({
        where: { refreshTokenId: token },
        include: { user: true },
      });

      if (!session || session.revokedAt || session.expiresAt < new Date()) {
        next(new Error("Session is invalid or expired"));
        return;
      }

      socket.data.userId = session.user.id;
      socket.data.role = session.user.role;
      next();
    } catch (error) {
      next(error instanceof Error ? error : new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    const role = socket.data.role as string;
    void socket.join(`user:${userId}`);

    // Track active spatial rooms for this socket
    const activeGeoRooms = new Set<string>();

    // Join specific trip room for live chat & tracking
    socket.on("trip:join-room", (data: { tripId: string }) => {
      if (data?.tripId) {
        void socket.join(`trip:${data.tripId}`);
      }
    });

    // In-app live chat event handler
    socket.on("trip:chat-message", (data: { tripId: string; text: string; senderRole: string; timestamp?: string }) => {
      if (data?.tripId && data?.text) {
        const payload = {
          ...data,
          senderUserId: userId,
          timestamp: data.timestamp || new Date().toISOString(),
        };
        io.to(`trip:${data.tripId}`).emit("trip:chat-message", payload);
      }
    });

    // ─── Passenger Spatial Geofence Subscription ─────────────────
    // Passenger subscribes to moving motorcycles within radiusKm (default 3km)
    socket.on("passenger:location:subscribe", (data: { latitude: number; longitude: number; radiusKm?: number }) => {
      if (!data?.latitude || !data?.longitude) return;
      const radius = data.radiusKm || 3.0;

      const keys = liveLocationService.getSurroundingGridKeys(data.latitude, data.longitude, radius);
      const newRooms = new Set(keys.map((k) => liveLocationService.getRoomName(k)));

      // Leave rooms no longer in neighborhood
      for (const room of activeGeoRooms) {
        if (!newRooms.has(room)) {
          void socket.leave(room);
          activeGeoRooms.delete(room);
        }
      }

      // Join new rooms
      for (const room of newRooms) {
        if (!activeGeoRooms.has(room)) {
          void socket.join(room);
          activeGeoRooms.add(room);
        }
      }

      // Immediately return snapshot of surrounding live riders
      const nearby = liveLocationService.getNearbyRiders(data.latitude, data.longitude, radius);
      socket.emit("nearby:riders:snapshot", nearby);
    });

    socket.on("passenger:location:unsubscribe", () => {
      for (const room of activeGeoRooms) {
        void socket.leave(room);
      }
      activeGeoRooms.clear();
    });

    // ─── High-Frequency Live Rider Location Ingestion ─────────────
    // Tracks lat, lng, speed, heading, accuracy, timestamp, status
    socket.on(
      "rider:location:update",
      async (data: {
        latitude: number;
        longitude: number;
        speed?: number;
        heading?: number;
        accuracy?: number;
        status?: LiveRiderStatus;
        tripId?: string;
      }) => {
        if (!data?.latitude || !data?.longitude) return;

        const updateRes = await liveLocationService.updateRiderLocation({
          userId,
          latitude: data.latitude,
          longitude: data.longitude,
          speed: data.speed,
          heading: data.heading,
          accuracy: data.accuracy,
          status: data.status,
          tripId: data.tripId,
        });

        if (!updateRes) return;

        const publicPayload = liveLocationService.toPublicPayload(updateRes.live);
        const geoRoom = liveLocationService.getRoomName(updateRes.newCell);

        // 1. Emit live moving motorcycle to passenger spatial geofence room
        io.to(geoRoom).emit("rider.location_updated", publicPayload);

        // If crossing grid boundaries, notify old cell so markers don't vanish suddenly
        if (updateRes.cellChanged && updateRes.oldCell) {
          const oldGeoRoom = liveLocationService.getRoomName(updateRes.oldCell);
          io.to(oldGeoRoom).emit("rider.location_updated", publicPayload);
        }

        // 2. Emit to active trip room if on trip
        if (updateRes.live.tripId) {
          io.to(`trip:${updateRes.live.tripId}`).emit("rider.location_updated", publicPayload);
          io.to(`trip:${updateRes.live.tripId}`).emit("rider:location-update", publicPayload);
        }

        // 3. Emit to Admin Live Operations Fleet Map
        const adminPayload = {
          ...publicPayload,
          userId: updateRes.live.userId,
          vehiclePlate: updateRes.live.vehiclePlate,
          tripId: updateRes.live.tripId,
        };
        io.to("admin:fleet").emit("admin:rider:location", adminPayload);
      }
    );

    // Legacy fallback for backward compatibility
    socket.on("rider:location", (data: { tripId?: string; latitude: number; longitude: number; heading?: number }) => {
      const now = Date.now();
      const last = lastPingBySocket.get(socket.id) ?? 0;
      if (now - last < 1500) return;
      lastPingBySocket.set(socket.id, now);

      if (data?.tripId) {
        io.to(`trip:${data.tripId}`).emit("rider:location-update", data);
      }
    });

    // ─── Admin Fleet Subscription ──────────────────────────────
    socket.on("admin:fleet:subscribe", () => {
      if (role === "admin") {
        void socket.join("admin:fleet");
        socket.emit("admin:fleet:snapshot", liveLocationService.getAllAdminFleet());
      }
    });

    // ─── Disconnect Handling ────────────────────────────────────
    socket.on("disconnect", () => {
      lastPingBySocket.delete(socket.id);
      activeGeoRooms.clear();

      // If a rider disconnects, mark offline and emit smoothly
      const offlineRider = liveLocationService.setRiderOffline(userId);
      if (offlineRider) {
        const payload = liveLocationService.toPublicPayload(offlineRider);
        const cell = liveLocationService.getGridKey(offlineRider.latitude, offlineRider.longitude);
        io.to(liveLocationService.getRoomName(cell)).emit("rider.offline", payload);
        io.to("admin:fleet").emit("admin:rider:offline", {
          riderId: offlineRider.riderId,
          userId: offlineRider.userId,
          status: "OFFLINE",
        });
      }
    });
  });

  setRealtimeServer(io);
  return io;
}

