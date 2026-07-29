import { useEffect } from "react";
import { configureNotificationHandler, registerPushToken } from "@/lib/push";

configureNotificationHandler();

export function usePushRegistration(authToken?: string | null) {
  useEffect(() => {
    if (!authToken) return;
    registerPushToken(authToken).catch(() => undefined);
  }, [authToken]);
}
