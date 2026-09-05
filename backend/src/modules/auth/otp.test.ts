import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import {
  clearOtpStore,
  makeOtpCode,
  storeOtp,
  verifyStoredOtp,
  MAX_OTP_ATTEMPTS
} from "./otp-store.js";

describe("OTP security & verification", () => {
  beforeEach(() => {
    clearOtpStore();
  });

  it("generates a 6-digit numeric string within 100000..999999", () => {
    for (let i = 0; i < 20; i++) {
      const code = makeOtpCode();
      assert.equal(code.length, 6);
      assert.match(code, /^\d{6}$/);
      const num = parseInt(code, 10);
      assert.ok(num >= 100000 && num <= 999999);
    }
  });

  it("stores and successfully verifies valid OTP", () => {
    const phone = "+233201112233";
    const code = "481920";
    storeOtp(phone, code, "user-123");

    const verified = verifyStoredOtp(phone, code);
    assert.ok(verified);
    assert.equal(verified?.phoneE164, phone);
    assert.equal(verified?.userId, "user-123");

    // Single-use: immediately invalidated after successful verification
    assert.equal(verifyStoredOtp(phone, code), null);
  });

  it("locks out and purges after MAX_OTP_ATTEMPTS failed guesses", () => {
    const phone = "+233201112233";
    const correctCode = "481920";
    storeOtp(phone, correctCode);

    // 4 failed attempts
    for (let i = 0; i < MAX_OTP_ATTEMPTS - 1; i++) {
      assert.equal(verifyStoredOtp(phone, "000000"), null);
    }

    // 5th failed attempt: reaches max attempts and purges
    assert.equal(verifyStoredOtp(phone, "000000"), null);

    // Now even the correct code should fail because OTP was purged
    assert.equal(verifyStoredOtp(phone, correctCode), null);
  });

  it("rejects expired OTPs", () => {
    const phone = "+233201112233";
    const code = "481920";
    // Store with negative TTL so it is already expired
    storeOtp(phone, code, undefined, -1000);

    assert.equal(verifyStoredOtp(phone, code), null);
  });
});
