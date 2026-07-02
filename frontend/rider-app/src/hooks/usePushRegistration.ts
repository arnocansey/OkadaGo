import Constants from "expo-constants";
import { useEffect } from "react";
import { registerPushToken } from "@/lib/push";

export function usePushRegistration(authToken?: string | null) {
  useEffect(() => {
    if (!authToken) return;
    registerPushToken(authToken).catch(() => undefined);
  }, [authToken]);
}
