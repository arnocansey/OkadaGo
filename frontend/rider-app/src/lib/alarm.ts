import * as Haptics from "expo-haptics";

class RequestAlarm {
  private active = false;
  private audioCtx: AudioContext | null = null;
  private intervalTimer: ReturnType<typeof setInterval> | null = null;

  start() {
    if (this.active) return;
    this.active = true;

    try {
      if (typeof window !== "undefined") {
        const AudioCtxClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtxClass) {
          this.audioCtx = new AudioCtxClass();
        }
      }
    } catch {
      // AudioContext unavailable
    }

    const ringOnce = () => {
      if (!this.active) return;

      if (this.audioCtx) {
        try {
          if (this.audioCtx.state === "suspended") {
            void this.audioCtx.resume();
          }

          const now = this.audioCtx.currentTime;

          // First tone (A5 - 880Hz)
          const osc1 = this.audioCtx.createOscillator();
          const gain1 = this.audioCtx.createGain();
          osc1.type = "sine";
          osc1.frequency.setValueAtTime(880, now);
          gain1.gain.setValueAtTime(0.4, now);
          gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
          osc1.connect(gain1);
          gain1.connect(this.audioCtx.destination);
          osc1.start(now);
          osc1.stop(now + 0.2);

          // Second tone (D6 - 1174.66Hz)
          const osc2 = this.audioCtx.createOscillator();
          const gain2 = this.audioCtx.createGain();
          osc2.type = "sine";
          osc2.frequency.setValueAtTime(1174.66, now + 0.22);
          gain2.gain.setValueAtTime(0.5, now + 0.22);
          gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          osc2.connect(gain2);
          gain2.connect(this.audioCtx.destination);
          osc2.start(now + 0.22);
          osc2.stop(now + 0.5);
        } catch {
          // ignore web audio errors
        }
      }

      try {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch {
        // ignore haptics errors
      }
    };

    ringOnce();
    this.intervalTimer = setInterval(ringOnce, 900);
  }

  stop() {
    this.active = false;
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    if (this.audioCtx) {
      try {
        void this.audioCtx.close();
      } catch {
        // ignore
      }
      this.audioCtx = null;
    }
  }
}

export const requestAlarm = new RequestAlarm();
