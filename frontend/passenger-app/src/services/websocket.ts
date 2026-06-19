import { Socket, io } from "socket.io-client";

const BACKEND_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://okadago-backend.onrender.com/v1";

export class PassengerWebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Array<(data: any) => void>> = new Map();

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(BACKEND_URL.replace("/v1", ""), {
          auth: { token },
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
        });

        this.socket.on("connect", () => {
          console.log("WebSocket connected");
          resolve();
        });

        this.socket.on("disconnect", () => {
          console.log("WebSocket disconnected");
        });

        this.socket.on("error", (error) => {
          console.error("WebSocket error:", error);
          reject(error);
        });

        this.socket.on("ride:assigned", (data) => {
          this.emit("ride:assigned", data);
        });

        this.socket.on("ride:status-update", (data) => {
          this.emit("ride:status-update", data);
        });

        this.socket.on("delivery:status-update", (data) => {
          this.emit("delivery:status-update", data);
        });

        this.socket.on("rider:location-update", (data) => {
          this.emit("rider:location-update", data);
        });

        this.socket.on("notification", (data) => {
          this.emit("notification", data);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event) ?? [];
    callbacks.forEach((callback) => callback(data));
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}
