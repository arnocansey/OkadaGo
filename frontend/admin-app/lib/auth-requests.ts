"use client";

import { postJson } from "@/lib/api";
import type { SessionPayload } from "@/lib/auth";

export async function passengerSignup(input: {
  fullName: string;
  email?: string;
  phoneCountryCode: string;
  phoneLocal: string;
  phoneE164: string;
  preferredCurrency: "GHS" | "NGN";
  password: string;
  defaultServiceCity?: string;
  preferredPayment?: "cash" | "card" | "wallet" | "mobile_money";
  device: { deviceId: string; platform: string; userAgent: string };
}) {
  return postJson<SessionPayload, typeof input>("/auth/passenger/signup", input);
}

export async function passengerLogin(input: {
  phoneLocal?: string;
  phoneE164?: string;
  password: string;
  device: { deviceId: string; platform: string; userAgent: string };
}) {
  return postJson<SessionPayload, typeof input>("/auth/passenger/login", input);
}

export async function riderSignup(input: {
  fullName: string;
  email?: string;
  phoneCountryCode: string;
  phoneLocal: string;
  phoneE164: string;
  preferredCurrency: "GHS" | "NGN";
  password: string;
  city?: string;
  vehicle?: {
    make: string;
    model: string;
    plateNumber: string;
    color?: string;
  };
  device: { deviceId: string; platform: string; userAgent: string };
}) {
  return postJson<SessionPayload, typeof input>("/auth/rider/signup", input);
}

export async function riderLogin(input: {
  phoneLocal?: string;
  phoneE164?: string;
  password: string;
  device: { deviceId: string; platform: string; userAgent: string };
}) {
  return postJson<SessionPayload, typeof input>("/auth/rider/login", input);
}

export async function adminLogin(input: {
  email: string;
  password: string;
  device: { deviceId: string; platform: string; userAgent: string };
}) {
  return postJson<SessionPayload, typeof input>("/auth/admin/login", input);
}
