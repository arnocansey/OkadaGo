import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { appConfig } from "../../common/config.js";
import { prisma } from "../../common/prisma.js";
import { isTokenLocallyRevoked } from "../../common/token-revocation.js";
import { setRealtimeServer } from "./realtime.service.js";

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
    void socket.join(`user:${userId}`);

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

    // Throttle location pings from sockets to max 1 per 2000ms
    socket.on("rider:location", (data) => {
      const now = Date.now();
      const last = lastPingBySocket.get(socket.id) ?? 0;
      if (now - last < 2000) return;
      lastPingBySocket.set(socket.id, now);
      socket.broadcast.emit("rider:location-broadcast", data);
    });

    socket.on("disconnect", () => {
      lastPingBySocket.delete(socket.id);
    });
  });

  setRealtimeServer(io);
  return io;
}
