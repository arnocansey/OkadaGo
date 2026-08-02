"use client";

import {
  createElement,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  avatarUrl: string | null;
  isPhoneVerified?: boolean;
  isEmailVerified?: boolean;
  createdAt?: string | null;
  adminTitle?: string | null;
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

const authStorageKey = "okadago.admin.session";
const deviceStorageKey = "okadago.admin.device-id";
const adminSessionCookie = "okadago.admin-session";
const AuthContext = createContext<AuthContextValue | null>(null);

function setAdminSessionCookie(token: string | null) {
  if (typeof document === "undefined") return;
  if (token) {
    document.cookie =
      `${adminSessionCookie}=` + encodeURIComponent(token) + "; path=/; SameSite=Lax; Max-Age=86400";
  } else {
    document.cookie = `${adminSessionCookie}=; path=/; SameSite=Lax; Max-Age=0`;
  }
}

function readStoredSession(): SessionPayload | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(authStorageKey);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as SessionPayload;
    if (!parsed?.token || !parsed?.user?.role) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

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
  const [session, setSessionState] = useState<SessionPayload | null>(() => {
    const stored = readStoredSession();
    if (stored) {
      setAdminSessionCookie(stored.token);
    }
    return stored;
  });
  const [status, setStatus] = useState<"loading" | "authenticated" | "anonymous">(() =>
    readStoredSession() ? "authenticated" : "loading"
  );
  const refreshGeneration = useRef(0);

  const persistSession = (nextSession: SessionPayload | null) => {
    // Invalidate any in-flight /auth/session check so it cannot wipe a fresh login.
    refreshGeneration.current += 1;
    setSessionState(nextSession);

    if (typeof window === "undefined") {
      return;
    }

    if (nextSession) {
      window.localStorage.setItem(authStorageKey, JSON.stringify(nextSession));
      setAdminSessionCookie(nextSession.token);
      setStatus("authenticated");
      return;
    }

    window.localStorage.removeItem(authStorageKey);
    setAdminSessionCookie(null);
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

    const generation = ++refreshGeneration.current;
    const raw = window.localStorage.getItem(authStorageKey);
    if (!raw) {
      if (generation === refreshGeneration.current) {
        setStatus("anonymous");
      }
      return;
    }

    try {
      const parsed = JSON.parse(raw) as SessionPayload;
      const refreshed = await requestJson<SessionPayload>("/auth/session", {
        token: parsed.token
      });
      if (generation !== refreshGeneration.current) {
        return;
      }
      persistSession(refreshed);
    } catch {
      if (generation !== refreshGeneration.current) {
        return;
      }
      persistSession(null);
    }
  };

  useEffect(() => {
    const stored = readStoredSession();
    if (stored) {
      setAdminSessionCookie(stored.token);
    }
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
    if (typeof window !== "undefined") {
      window.location.assign("/login");
    }
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
