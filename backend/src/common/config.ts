import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const emptyStringToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => {
    if (typeof value === "string" && value.trim() === "") {
      return undefined;
    }

    return value;
  }, schema.optional());

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
  API_PUBLIC_URL: emptyStringToUndefined(z.string().url()),
  APP_WEB_URL: emptyStringToUndefined(z.string().url()),
  PAYSTACK_SECRET_KEY: emptyStringToUndefined(z.string().min(1)),
  PAYSTACK_BASE_URL: z.string().url().default("https://api.paystack.co"),
  SMTP_HOST: emptyStringToUndefined(z.string().min(1)),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).optional(),
  SMTP_SECURE: z.enum(["true", "false"]).default("false"),
  SMTP_USER: emptyStringToUndefined(z.string().min(1)),
  SMTP_PASS: emptyStringToUndefined(z.string().min(1)),
  SMTP_FROM: emptyStringToUndefined(z.string().email()),
  MAPBOX_ACCESS_TOKEN: emptyStringToUndefined(z.string().min(1)),
  GOOGLE_PLACES_API_KEY: emptyStringToUndefined(z.string().min(1)),
  GOOGLE_MAPS_API_KEY: emptyStringToUndefined(z.string().min(1)),
  GEOCODING_BASE_URL: z.string().url().default("https://nominatim.openstreetmap.org"),
  GEOCODING_USER_AGENT: emptyStringToUndefined(z.string().min(1)),
  GEOCODING_CONTACT_EMAIL: emptyStringToUndefined(z.string().email()),
  SMS_PROVIDER: emptyStringToUndefined(z.enum(["termii", "twilio", "none"])),
  TERMII_API_KEY: emptyStringToUndefined(z.string().min(1)),
  TERMII_SENDER_ID: emptyStringToUndefined(z.string().min(1)),
  TERMII_BASE_URL: z.string().url().default("https://api.ng.termii.com"),
  TWILIO_ACCOUNT_SID: emptyStringToUndefined(z.string().min(1)),
  TWILIO_AUTH_TOKEN: emptyStringToUndefined(z.string().min(1)),
  TWILIO_FROM_NUMBER: emptyStringToUndefined(z.string().min(1))
});

const parsed = configSchema.parse(process.env);
const defaultAppWebUrl = parsed.CORS_ORIGIN.split(",")[0]?.trim() || "http://localhost:3000";
const apiPublicUrl = parsed.API_PUBLIC_URL?.replace(/\/$/, "") ?? `http://localhost:${parsed.PORT}`;
const hasTermiiConfig = Boolean(parsed.TERMII_API_KEY && parsed.TERMII_SENDER_ID);
const hasTwilioConfig = Boolean(
  parsed.TWILIO_ACCOUNT_SID && parsed.TWILIO_AUTH_TOKEN && parsed.TWILIO_FROM_NUMBER
);
const smsProvider =
  parsed.SMS_PROVIDER === "none"
    ? undefined
    : parsed.SMS_PROVIDER ??
      (hasTermiiConfig ? ("termii" as const) : hasTwilioConfig ? ("twilio" as const) : undefined);

const googlePlacesApiKey = parsed.GOOGLE_PLACES_API_KEY ?? parsed.GOOGLE_MAPS_API_KEY;
const googlePlacesApiKeySource = parsed.GOOGLE_PLACES_API_KEY
  ? ("GOOGLE_PLACES_API_KEY" as const)
  : parsed.GOOGLE_MAPS_API_KEY
    ? ("GOOGLE_MAPS_API_KEY" as const)
    : undefined;

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
  smtpHost: parsed.SMTP_HOST,
  smtpPort: parsed.SMTP_PORT,
  smtpSecure: parsed.SMTP_SECURE === "true",
  smtpUser: parsed.SMTP_USER,
  smtpPass: parsed.SMTP_PASS,
  smtpFrom: parsed.SMTP_FROM,
  mapboxAccessToken: parsed.MAPBOX_ACCESS_TOKEN,
  googlePlacesApiKey,
  googlePlacesApiKeySource,
  geocodingBaseUrl: parsed.GEOCODING_BASE_URL.replace(/\/$/, ""),
  geocodingUserAgent:
    parsed.GEOCODING_USER_AGENT?.trim() || `OkadaGo/0.1 (${defaultAppWebUrl})`,
  geocodingContactEmail: parsed.GEOCODING_CONTACT_EMAIL,
  smsProvider,
  termiiApiKey: parsed.TERMII_API_KEY,
  termiiSenderId: parsed.TERMII_SENDER_ID,
  termiiBaseUrl: parsed.TERMII_BASE_URL.replace(/\/$/, ""),
  twilioAccountSid: parsed.TWILIO_ACCOUNT_SID,
  twilioAuthToken: parsed.TWILIO_AUTH_TOKEN,
  twilioFromNumber: parsed.TWILIO_FROM_NUMBER
} as const;
