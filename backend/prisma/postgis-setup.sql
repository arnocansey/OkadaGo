-- PostGIS setup for PostGIS-backed rider matching.

CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE "RiderProfile"
  ADD COLUMN IF NOT EXISTS "currentLocation" geography(Point, 4326);

CREATE INDEX IF NOT EXISTS "RiderProfile_currentLocation_idx"
  ON "RiderProfile"
  USING GIST ("currentLocation");

-- Drop legacy triggers that attempted to write to non-existent 'geography' field
DROP TRIGGER IF EXISTS trg_update_rider_geography ON "RiderProfile";
DROP TRIGGER IF EXISTS trg_sync_rider_geography ON "RiderProfile";
DROP TRIGGER IF EXISTS trg_update_rider_current_location ON "RiderProfile";
DROP FUNCTION IF EXISTS update_rider_geography();
DROP FUNCTION IF EXISTS sync_rider_geography();
DROP FUNCTION IF EXISTS update_rider_current_location();

-- Function and trigger to keep currentLocation geography column automatically synced
CREATE OR REPLACE FUNCTION update_rider_current_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."currentLatitude" IS NOT NULL AND NEW."currentLongitude" IS NOT NULL THEN
    NEW."currentLocation" := ST_SetSRID(
      ST_MakePoint(
        CAST(NEW."currentLongitude" AS double precision),
        CAST(NEW."currentLatitude" AS double precision)
      ), 4326
    )::geography;
  ELSE
    NEW."currentLocation" := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_rider_current_location
BEFORE INSERT OR UPDATE OF "currentLatitude", "currentLongitude" ON "RiderProfile"
FOR EACH ROW EXECUTE FUNCTION update_rider_current_location();

-- Backfill existing coordinates
UPDATE "RiderProfile"
SET "currentLocation" = ST_SetSRID(
  ST_MakePoint("currentLongitude"::double precision, "currentLatitude"::double precision),
  4326
)::geography
WHERE "currentLatitude" IS NOT NULL
  AND "currentLongitude" IS NOT NULL
  AND "currentLocation" IS NULL;
