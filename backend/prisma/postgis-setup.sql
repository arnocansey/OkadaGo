-- PostGIS setup for PostGIS-backed rider matching.
--
-- Prisma's `db push`/`generate` workflow cannot create the `postgis` extension,
-- the `currentLocation` geography column (declared as `Unsupported(...)` in
-- schema.prisma), or a GiST index on it. Run this script once per database
-- (local dev and every deployment target) to enable the fast-path used by
-- MatchingService. If this script has not been run, the backend automatically
-- falls back to the existing in-memory Haversine matching — nothing breaks.
--
-- Usage:
--   npm run db:postgis   (see package.json, runs this file with psql via $DATABASE_URL)
--   -- or manually: psql "$DATABASE_URL" -f prisma/postgis-setup.sql

CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE "RiderProfile"
  ADD COLUMN IF NOT EXISTS "currentLocation" geography(Point, 4326);

CREATE INDEX IF NOT EXISTS "RiderProfile_currentLocation_idx"
  ON "RiderProfile"
  USING GIST ("currentLocation");

-- Backfill the geography column from the existing lat/lng decimals so riders
-- who went online before this script ran are immediately matchable.
UPDATE "RiderProfile"
SET "currentLocation" = ST_SetSRID(
  ST_MakePoint("currentLongitude"::double precision, "currentLatitude"::double precision),
  4326
)::geography
WHERE "currentLatitude" IS NOT NULL
  AND "currentLongitude" IS NOT NULL
  AND "currentLocation" IS NULL;
