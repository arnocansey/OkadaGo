import { Socket, io } from "socket.io-client";

const BACKEND_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://okadago-backend.onrender.com/v1";

export class PassengerWebSocketService {
  private socket: Socket | null = null;
  private listeners = new Map<string, Array<(data: unknown) => void>>();

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

        this.socket.on("connect", () => resolve());
        this.socket.on("error", (error) => reject(error));

        for (const event of [
          "ride:assigned",
          "ride:status-update",
          "delivery:status-update",
          "rider:location-update",
          "notification",
        ]) {
          this.socket.on(event, (data) => this.emit(event, data));
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  on(event: string, callback: (data: unknown) => void): void {
    const list = this.listeners.get(event) ?? [];
    list.push(callback);
    this.listeners.set(event, list);
  }

  off(event: string, callback: (data: unknown) => void): void {
    const list = this.listeners.get(event);
    if (!list) return;
    const index = list.indexOf(callback);
    if (index > -1) list.splice(index, 1);
  }

  private emit(event: string, data: unknown): void {
    for (const callback of this.listeners.get(event) ?? []) callback(data);
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const passengerWs = new PassengerWebSocketService();
