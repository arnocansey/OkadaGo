import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generateTotpSecret, totpCode, verifyTotpCode, buildOtpAuthUrl } from "./totp.js";

describe("totp", () => {
  it("generates a base32 secret of usable length", () => {
    const secret = generateTotpSecret();
    assert.ok(secret.length >= 16);
    assert.match(secret, /^[A-Z2-7]+$/);
  });

  it("verifies the current code and rejects a wrong code", () => {
    const secret = generateTotpSecret();
    const now = Date.now();
    const code = totpCode(secret, now);
    assert.equal(code.length, 6);
    assert.equal(verifyTotpCode(secret, code, now), true);
    assert.equal(verifyTotpCode(secret, "000000", now), false);
  });

  it("accepts one-step clock drift", () => {
    const secret = generateTotpSecret();
    const now = Date.now();
    const previous = totpCode(secret, now - 30_000);
    assert.equal(verifyTotpCode(secret, previous, now), true);
  });

  it("builds an otpauth URL", () => {
    const url = buildOtpAuthUrl("ABCDEFGHIJKLMNOP", "admin@okadago.com");
    assert.match(url, /^otpauth:\/\/totp\//);
    assert.match(url, /secret=ABCDEFGHIJKLMNOP/);
    assert.match(url, /issuer=OkadaGo\+Admin/);
  });
});
