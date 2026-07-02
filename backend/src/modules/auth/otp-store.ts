type OtpEntry = {
  code: string;
  phoneE164: string;
  userId?: string;
  expiresAt: number;
};

const otpStore = new Map<string, OtpEntry>();

export function storeOtp(phoneE164: string, code: string, userId?: string, ttlMs = 10 * 60 * 1000) {
  otpStore.set(phoneE164, {
    code,
    phoneE164,
    userId,
    expiresAt: Date.now() + ttlMs
  });
}

export function verifyStoredOtp(phoneE164: string, code: string) {
  const entry = otpStore.get(phoneE164);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    otpStore.delete(phoneE164);
    return null;
  }
  if (entry.code !== code) return null;
  otpStore.delete(phoneE164);
  return entry;
}

export function makeOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
