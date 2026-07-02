import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { appConfig } from "../../common/config.js";
import { prisma } from "../../common/prisma.js";
import { setRealtimeServer } from "./realtime.service.js";

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

      if (!token) {
        next(new Error("Authentication token is required"));
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
  });

  setRealtimeServer(io);
  return io;
}
