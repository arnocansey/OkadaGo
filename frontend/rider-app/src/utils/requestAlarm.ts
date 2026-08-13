import * as Haptics from "expo-haptics";

let alarmInterval: ReturnType<typeof setInterval> | null = null;

export const requestAlarm = {
  start() {
    if (alarmInterval) return;

    // Trigger haptic vibration pattern every 1000ms
    alarmInterval = setInterval(() => {
      try {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch {
        // Fallback for platforms without haptics
      }
    }, 1000);
  },

  stop() {
    if (alarmInterval) {
      clearInterval(alarmInterval);
      alarmInterval = null;
    }
  },
};
