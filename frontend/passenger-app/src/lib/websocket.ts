import { Socket, io } from "socket.io-client";
import { getApiBaseUrl } from "./api";

export class PassengerWebSocketService {
  private socket: Socket | null = null;
  private listeners = new Map<string, Array<(data: unknown) => void>>();

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const backendUrl = getApiBaseUrl().replace("/v1", "");
        this.socket = io(backendUrl, {
          auth: { token },
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
        });

        this.socket.on("connect", () => resolve());
        this.socket.on("error", (error) => reject(error));

        // Forward all server events to internal listeners
        this.socket.onAny((event, data) => {
          this.emit(event, data);
        });

        // Ensure any previously registered listeners are bound to current socket
        for (const event of this.listeners.keys()) {
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

    if (this.socket) {
      this.socket.on(event, (data) => this.emit(event, data));
    }
  }

  off(event: string, callback: (data: unknown) => void): void {
    const list = this.listeners.get(event);
    if (!list) return;
    const index = list.indexOf(callback);
    if (index > -1) list.splice(index, 1);
  }

  send(event: string, data?: unknown): void {
    this.socket?.emit(event, data);
  }

  private emit(event: string, data: unknown): void {
    for (const callback of this.listeners.get(event) ?? []) callback(data);
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const passengerWs = new PassengerWebSocketService();
