import { Platform, Vibration } from "react-native";
import * as Haptics from "expo-haptics";
import { loadRequestSettings, VOLUME_MULTIPLIERS, type VolumeLevel } from "./request-settings";

export type OfferState = "NEW_REQUEST" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "CANCELLED";

type NativeAudioBridgeHandler = {
  play: (volume: number) => void;
  stop: () => void;
};

let nativeBridge: NativeAudioBridgeHandler | null = null;

export function registerNativeAudioBridge(handler: NativeAudioBridgeHandler) {
  nativeBridge = handler;
  return () => {
    if (nativeBridge === handler) {
      nativeBridge = null;
    }
  };
}

class RequestAlarm {
  private active = false;
  private hapticsInterval: ReturnType<typeof setInterval> | null = null;
  private webAudioCtx: AudioContext | null = null;
  private webTimer: ReturnType<typeof setInterval> | null = null;
  private testTimer: ReturnType<typeof setTimeout> | null = null;
  private activeOfferId: string | null = null;

  // Deduplication map: offerId -> { timestamp, state }
  private seenOffers = new Map<string, { timestamp: number; state: OfferState }>();

  /**
   * Register a new offer ID with deduplication.
   * Returns true if offer is newly accepted for processing; false if it is a duplicate retry.
   */
  registerOffer(offerId: string): boolean {
    if (!offerId) return true;
    const now = Date.now();
    const existing = this.seenOffers.get(offerId);

    if (existing) {
      // If already acted upon (accepted, declined, expired, cancelled), completely ignore
      if (existing.state !== "NEW_REQUEST") {
        return false;
      }
      // If it arrived again within 15 seconds while still in NEW_REQUEST, ignore duplicate socket blast
      if (now - existing.timestamp < 15000) {
        return false;
      }
    }

    this.seenOffers.set(offerId, { timestamp: now, state: "NEW_REQUEST" });
    this.activeOfferId = offerId;

    // Prune entries older than 2 minutes
    for (const [id, entry] of this.seenOffers.entries()) {
      if (now - entry.timestamp > 120000) {
        this.seenOffers.delete(id);
      }
    }

    return true;
  }

  /**
   * Update the offer state to keep the state machine in sync.
   */
  updateOfferState(offerId: string, state: OfferState) {
    if (!offerId) return;
    const existing = this.seenOffers.get(offerId);
    this.seenOffers.set(offerId, {
      timestamp: existing ? existing.timestamp : Date.now(),
      state,
    });

    if (state !== "NEW_REQUEST" && this.activeOfferId === offerId) {
      this.stop();
      this.activeOfferId = null;
    }
  }

  getOfferState(offerId: string): OfferState | undefined {
    return this.seenOffers.get(offerId)?.state;
  }

  getActiveOfferId(): string | null {
    return this.activeOfferId;
  }

  isActive(): boolean {
    return this.active;
  }

  /**
   * Play the distinctive OkadaGo incoming-request sound and strong vibration.
   */
  async start(options?: { sound?: boolean; vibration?: boolean; volume?: VolumeLevel }) {
    if (this.active) return;
    this.active = true;

    // Load rider preferences
    const settings = await loadRequestSettings();
    const soundEnabled = options?.sound ?? settings.soundEnabled;
    const vibrationEnabled = options?.vibration ?? settings.vibrationEnabled;
    const volumeMultiplier = VOLUME_MULTIPLIERS[options?.volume ?? settings.volume] ?? 1.0;

    // ── 1. Device Vibration ──
    if (vibrationEnabled) {
      try {
        // Strong pulsating vibration pattern: vibrate 800ms, pause 300ms, vibrate 800ms...
        // The second argument `true` loops continuously on Android and supported devices
        Vibration.vibrate([0, 800, 300, 800], true);
      } catch {
        // vibration unavailable
      }

      // Reinforce with native haptic warning ticks every 1.1s
      try {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch {
        // ignore haptics error
      }

      if (this.hapticsInterval) clearInterval(this.hapticsInterval);
      this.hapticsInterval = setInterval(() => {
        if (!this.active) return;
        try {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } catch {
          // ignore
        }
      }, 1150);
    }

    // ── 2. Distinctive Alert Sound ──
    if (soundEnabled) {
      if (Platform.OS === "web") {
        this.startWebAudioLoop(volumeMultiplier);
      } else {
        // Native mobile (Android / iOS): signal WebView Audio Bridge
        if (nativeBridge) {
          nativeBridge.play(volumeMultiplier);
        }
      }
    }
  }

  /**
   * Immediately stops both sound and vibration.
   */
  stop() {
    this.active = false;

    if (this.testTimer) {
      clearTimeout(this.testTimer);
      this.testTimer = null;
    }

    // Immediately cancel vibration
    try {
      Vibration.cancel();
    } catch {
      // ignore
    }

    if (this.hapticsInterval) {
      clearInterval(this.hapticsInterval);
      this.hapticsInterval = null;
    }

    // Stop Native Bridge audio
    if (nativeBridge) {
      try {
        nativeBridge.stop();
      } catch {
        // ignore
      }
    }

    // Stop Web Audio
    if (this.webTimer) {
      clearInterval(this.webTimer);
      this.webTimer = null;
    }
    if (this.webAudioCtx) {
      try {
        void this.webAudioCtx.close();
      } catch {
        // ignore
      }
      this.webAudioCtx = null;
    }
  }

  /**
   * Test sound and vibration for 3.5 seconds then automatically stop.
   */
  async testSound(volume?: VolumeLevel) {
    this.stop();
    await this.start({ sound: true, vibration: true, volume });
    this.testTimer = setTimeout(() => {
      this.stop();
    }, 3500);
  }

  /**
   * Web Audio API synthesis for browser execution.
   */
  private startWebAudioLoop(volume: number) {
    try {
      if (typeof window !== "undefined") {
        const AudioCtxClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtxClass) {
          this.webAudioCtx = new AudioCtxClass();
        }
      }
    } catch {
      return;
    }

    const playWebChime = () => {
      if (!this.active || !this.webAudioCtx) return;
      try {
        if (this.webAudioCtx.state === "suspended") {
          void this.webAudioCtx.resume();
        }

        const now = this.webAudioCtx.currentTime;
        const notes = [
          { freq: 523.25, time: 0.00, dur: 0.14 },
          { freq: 659.25, time: 0.12, dur: 0.14 },
          { freq: 783.99, time: 0.24, dur: 0.14 },
          { freq: 1046.50, time: 0.36, dur: 0.45 },
        ];

        for (const n of notes) {
          const osc = this.webAudioCtx.createOscillator();
          const gain = this.webAudioCtx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(n.freq, now + n.time);
          gain.gain.setValueAtTime(volume * 0.85, now + n.time);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + n.time + n.dur);
          osc.connect(gain);
          gain.connect(this.webAudioCtx.destination);
          osc.start(now + n.time);
          osc.stop(now + n.time + n.dur);

          const osc2 = this.webAudioCtx.createOscillator();
          const gain2 = this.webAudioCtx.createGain();
          osc2.type = "triangle";
          osc2.frequency.setValueAtTime(n.freq * 2, now + n.time);
          gain2.gain.setValueAtTime(volume * 0.35, now + n.time);
          gain2.gain.exponentialRampToValueAtTime(0.0001, now + n.time + n.dur);
          osc2.connect(gain2);
          gain2.connect(this.webAudioCtx.destination);
          osc2.start(now + n.time);
          osc2.stop(now + n.time + n.dur);
        }
      } catch {
        // web audio error
      }
    };

    playWebChime();
    this.webTimer = setInterval(playWebChime, 1150);
  }
}

export const requestAlarm = new RequestAlarm();
