import { randomInt, timingSafeEqual } from "node:crypto";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 30 * 1000;
const REQUEST_WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;

type OtpEntry = {
  code: string;
  phoneE164: string;
  userId?: string;
  expiresAt: number;
  attemptsRemaining: number;
};

const otpStore = new Map<string, OtpEntry>();
const requestHistory = new Map<string, number[]>();

export type OtpRequestDecision =
  | { allowed: true }
  | { allowed: false; reason: "cooldown" | "rate_limited"; retryAfterSeconds: number };

function recentTimestamps(phoneE164: string, now: number) {
  return (requestHistory.get(phoneE164) ?? []).filter((ts) => now - ts < REQUEST_WINDOW_MS);
}

// Guards the OTP request endpoint against SMS-bombing and phone-number enumeration
// by enforcing a short resend cooldown plus a rolling per-number request cap.
export function checkOtpRequestAllowed(phoneE164: string, now = Date.now()): OtpRequestDecision {
  const recent = recentTimestamps(phoneE164, now);

  if (recent.length > 0) {
    const lastSentAt = recent[recent.length - 1]!;
    const sinceLast = now - lastSentAt;
    if (sinceLast < RESEND_COOLDOWN_MS) {
      return {
        allowed: false,
        reason: "cooldown",
        retryAfterSeconds: Math.ceil((RESEND_COOLDOWN_MS - sinceLast) / 1000)
      };
    }
  }

  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = recent[0]!;
    return {
      allowed: false,
      reason: "rate_limited",
      retryAfterSeconds: Math.ceil((REQUEST_WINDOW_MS - (now - oldest)) / 1000)
    };
  }

  return { allowed: true };
}

export function storeOtp(phoneE164: string, code: string, userId?: string, ttlMs = OTP_TTL_MS) {
  const now = Date.now();
  otpStore.set(phoneE164, {
    code,
    phoneE164,
    userId,
    expiresAt: now + ttlMs,
    attemptsRemaining: MAX_VERIFY_ATTEMPTS
  });

  const recent = recentTimestamps(phoneE164, now);
  recent.push(now);
  requestHistory.set(phoneE164, recent);
}

function codesMatch(expected: string, provided: string) {
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}

export function verifyStoredOtp(phoneE164: string, code: string) {
  const entry = otpStore.get(phoneE164);
  if (!entry) return null;

  if (entry.expiresAt < Date.now()) {
    otpStore.delete(phoneE164);
    return null;
  }

  if (!codesMatch(entry.code, code)) {
    entry.attemptsRemaining -= 1;
    // Invalidate the code once the attempt budget is exhausted so a 6-digit
    // code cannot be brute-forced within its validity window.
    if (entry.attemptsRemaining <= 0) {
      otpStore.delete(phoneE164);
    }
    return null;
  }

  otpStore.delete(phoneE164);
  return entry;
}

export function makeOtpCode() {
  // Cryptographically secure, uniform 6-digit code (Math.random is predictable).
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}
