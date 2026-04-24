import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const configSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  HOST: z.string().default("0.0.0.0"),
  DATABASE_URL: z
    .string()
    .min(1)
    .default("postgresql://postgres:postgres@localhost:5432/okadago"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  JWT_ISSUER: z.string().default("okadago"),
  JWT_AUDIENCE: z.string().default("okadago-clients"),
  API_PUBLIC_URL: z.string().url().optional(),
  APP_WEB_URL: z.string().url().optional(),
  PAYSTACK_SECRET_KEY: z.string().min(1).optional(),
  PAYSTACK_BASE_URL: z.string().url().default("https://api.paystack.co"),
  MAPBOX_ACCESS_TOKEN: z.string().min(1).optional(),
  GEOCODING_BASE_URL: z.string().url().default("https://nominatim.openstreetmap.org"),
  GEOCODING_USER_AGENT: z.string().min(1).optional(),
  GEOCODING_CONTACT_EMAIL: z.string().email().optional()
});

const parsed = configSchema.parse(process.env);
const defaultAppWebUrl = parsed.CORS_ORIGIN.split(",")[0]?.trim() || "http://localhost:3000";
const apiPublicUrl = parsed.API_PUBLIC_URL?.replace(/\/$/, "") ?? `http://localhost:${parsed.PORT}`;

export const appConfig = {
  nodeEnv: parsed.NODE_ENV,
  port: parsed.PORT,
  host: parsed.HOST,
  databaseUrl: parsed.DATABASE_URL,
  corsOrigin: parsed.CORS_ORIGIN,
  jwtIssuer: parsed.JWT_ISSUER,
  jwtAudience: parsed.JWT_AUDIENCE,
  apiPublicUrl,
  appWebUrl: parsed.APP_WEB_URL?.replace(/\/$/, "") ?? defaultAppWebUrl,
  paystackSecretKey: parsed.PAYSTACK_SECRET_KEY,
  paystackBaseUrl: parsed.PAYSTACK_BASE_URL.replace(/\/$/, ""),
  mapboxAccessToken: parsed.MAPBOX_ACCESS_TOKEN,
  geocodingBaseUrl: parsed.GEOCODING_BASE_URL.replace(/\/$/, ""),
  geocodingUserAgent:
    parsed.GEOCODING_USER_AGENT?.trim() || `OkadaGo/0.1 (${defaultAppWebUrl})`,
  geocodingContactEmail: parsed.GEOCODING_CONTACT_EMAIL
} as const;
