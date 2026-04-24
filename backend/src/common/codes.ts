import { randomBytes } from "node:crypto";

function makeCode(prefix: string, length: number) {
  return `${prefix}${randomBytes(length).toString("hex").slice(0, length).toUpperCase()}`;
}

export function makeReferralCode() {
  return makeCode("P", 8);
}

export function makeRiderCode() {
  return makeCode("R", 8);
}

export function makeWalletReference(prefix: string) {
  return `${prefix}-${randomBytes(6).toString("hex").toUpperCase()}`;
}
