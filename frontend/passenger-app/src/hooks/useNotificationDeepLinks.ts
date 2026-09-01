import { router } from "expo-router";
import { useEffect } from "react";
import { passengerPathForNotificationData, type NotificationData } from "@/lib/push";

type NotificationResponse = {
  notification: {
    request: {
      content: {
        data?: NotificationData;
      };
    };
  };
};

export function useNotificationDeepLinks(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    let responseSub: { remove: () => void } | undefined;

    try {
      const Notifications = require("expo-notifications") as {
        addNotificationResponseReceivedListener: (
          listener: (response: NotificationResponse) => void,
        ) => { remove: () => void };
        getLastNotificationResponseAsync: () => Promise<NotificationResponse | null>;
      };

      const openFromResponse = (response: NotificationResponse | null) => {
        const data = response?.notification?.request?.content?.data;
        if (!data?.rideId && !data?.deliveryId) return;
        router.push(passengerPathForNotificationData(data) as never);
      };

      responseSub = Notifications.addNotificationResponseReceivedListener(openFromResponse);
      Notifications.getLastNotificationResponseAsync()
        .then((response) => {
          if (response) openFromResponse(response);
        })
        .catch(() => undefined);
    } catch {
      // expo-notifications unavailable
    }

    return () => {
      try {
        responseSub?.remove();
      } catch {}
    };
  }, [enabled]);
}
