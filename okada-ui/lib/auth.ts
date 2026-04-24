"use client";

import {
  createElement,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { requestJson } from "@/lib/api";

export type SessionUser = {
  id: string;
  role: "passenger" | "rider" | "admin" | "dispatcher";
  accountStatus: string;
  fullName: string;
  email: string | null;
  phoneCountryCode: string;
  phoneLocal: string;
  phoneE164: string;
  preferredCurrency: string;
  passengerProfileId: string | null;
  riderProfileId: string | null;
  riderApprovalStatus: string | null;
  adminProfileId: string | null;
  dispatcherProfileId: string | null;
};

export type SessionPayload = {
  token: string;
  expiresAt: string;
  user: SessionUser;
};

type AuthContextValue = {
  session: SessionPayload | null;
  status: "loading" | "authenticated" | "anonymous";
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  setSession: (session: SessionPayload | null) => void;
  getDevice: () => { deviceId: string; platform: string; userAgent: string };
};

const authStorageKey = "okadago.session";
const deviceStorageKey = "okadago.device-id";
const AuthContext = createContext<AuthContextValue | null>(null);

function getStoredDeviceId() {
  if (typeof window === "undefined") {
    return "server";
  }

  const existing = window.localStorage.getItem(deviceStorageKey);
  if (existing) {
    return existing;
  }

  const created = crypto.randomUUID();
  window.localStorage.setItem(deviceStorageKey, created);
  return created;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<SessionPayload | null>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "anonymous">("loading");

  const persistSession = (nextSession: SessionPayload | null) => {
    setSessionState(nextSession);

    if (typeof window === "undefined") {
      return;
    }

    if (nextSession) {
      window.localStorage.setItem(authStorageKey, JSON.stringify(nextSession));
      setStatus("authenticated");
      return;
    }

    window.localStorage.removeItem(authStorageKey);
    setStatus("anonymous");
  };

  const getDevice = () => ({
    deviceId: getStoredDeviceId(),
    platform: "web",
    userAgent: typeof navigator === "undefined" ? "unknown" : navigator.userAgent
  });

  const refreshSession = async () => {
    if (typeof window === "undefined") {
      return;
    }

    const raw = window.localStorage.getItem(authStorageKey);
    if (!raw) {
      setStatus("anonymous");
      return;
    }

    try {
      const parsed = JSON.parse(raw) as SessionPayload;
      const refreshed = await requestJson<SessionPayload>("/auth/session", {
        token: parsed.token
      });
      persistSession(refreshed);
    } catch {
      persistSession(null);
    }
  };

  useEffect(() => {
    void refreshSession();
  }, []);

  const signOut = async () => {
    if (session?.token) {
      try {
        await requestJson("/auth/logout", {
          method: "POST",
          body: JSON.stringify({}),
          token: session.token
        });
      } catch {
        // Keep logout resilient on the client.
      }
    }

    persistSession(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      status,
      signOut,
      refreshSession,
      setSession: persistSession,
      getDevice
    }),
    [session, status]
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
