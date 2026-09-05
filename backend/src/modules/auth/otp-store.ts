import { randomInt, timingSafeEqual } from "node:crypto";

export const MAX_OTP_ATTEMPTS = 5;
export const DEFAULT_OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

export type OtpEntry = {
  code: string;
  phoneE164: string;
  userId?: string;
  expiresAt: number;
  attempts: number;
};

const otpStore = new Map<string, OtpEntry>();

export function storeOtp(
  phoneE164: string,
  code: string,
  userId?: string,
  ttlMs = DEFAULT_OTP_TTL_MS
) {
  otpStore.set(phoneE164, {
    code,
    phoneE164,
    userId,
    expiresAt: Date.now() + ttlMs,
    attempts: 0
  });
}

export function verifyStoredOtp(phoneE164: string, code: string): OtpEntry | null {
  const entry = otpStore.get(phoneE164);
  if (!entry) return null;

  if (entry.expiresAt < Date.now()) {
    otpStore.delete(phoneE164);
    return null;
  }

  entry.attempts += 1;
  if (entry.attempts > MAX_OTP_ATTEMPTS) {
    otpStore.delete(phoneE164);
    return null;
  }

  // Timing-safe constant-time string comparison
  const expectedBuf = Buffer.from(entry.code, "utf8");
  const givenBuf = Buffer.from(code, "utf8");

  const isMatch =
    expectedBuf.length === givenBuf.length && timingSafeEqual(expectedBuf, givenBuf);

  if (!isMatch) {
    if (entry.attempts >= MAX_OTP_ATTEMPTS) {
      otpStore.delete(phoneE164);
    }
    return null;
  }

  otpStore.delete(phoneE164);
  return entry;
}

/**
 * Generate a cryptographically secure 6-digit numeric OTP code using CSPRNG
 */
export function makeOtpCode(): string {
  return randomInt(100000, 1000000).toString();
}

/**
 * Helper for testing/cleanup to clear the store
 */
export function clearOtpStore(): void {
  otpStore.clear();
}

