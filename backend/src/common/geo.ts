import { prisma } from "./prisma.js";

let postgisAvailable: boolean | null = null;
let detectionPromise: Promise<boolean> | null = null;

/**
 * Detects whether the connected Postgres database has the `postgis` extension
 * enabled. Result is cached for the lifetime of the process — call
 * `detectPostgisSupport()` once at boot (see main.ts) to warm the cache and
 * log the outcome; every later call (including from request handlers) reuses
 * the cached value instead of re-querying.
 */
export async function detectPostgisSupport(): Promise<boolean> {
  if (postgisAvailable !== null) {
    return postgisAvailable;
  }

  if (!detectionPromise) {
    detectionPromise = prisma
      .$queryRawUnsafe("SELECT postgis_version()")
      .then(() => {
        postgisAvailable = true;
        return true;
      })
      .catch(() => {
        postgisAvailable = false;
        return false;
      });
  }

  return detectionPromise;
}

export function isPostgisAvailable(): boolean {
  return postgisAvailable ?? false;
}

/**
 * Writes the `currentLocation` geography column for a rider. No-ops silently
 * when PostGIS is unavailable — the column is only ever a performance
 * optimization, never a source of truth (currentLatitude/currentLongitude
 * remain the canonical columns).
 */
export async function syncRiderLocationGeography(
  riderProfileId: string,
  latitude: number,
  longitude: number
): Promise<void> {
  if (!(await detectPostgisSupport())) {
    return;
  }

  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "RiderProfile"
       SET "currentLocation" = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
       WHERE id = $3`,
      longitude,
      latitude,
      riderProfileId
    );
  } catch (error) {
    console.warn("[geo] Failed to sync rider currentLocation geography column", error);
  }
}

export type NearbyRiderCandidate = {
  id: string;
  distanceMeters: number;
};

/**
 * Returns online, approved rider IDs (in a service zone) within `radiusKm` of
 * a point, nearest-first, using the GiST index on `currentLocation`. Returns
 * `null` when PostGIS is unavailable or the query fails for any reason — the
 * caller should fall back to the existing full-zone Haversine fetch in that
 * case. Business filters (job preference, vehicle type, etc.) are applied by
 * the caller afterward; this only narrows the candidate set geospatially.
 */
export async function findNearbyRiderCandidates(params: {
  serviceZoneId: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
  limit?: number;
}): Promise<NearbyRiderCandidate[] | null> {
  if (!(await detectPostgisSupport())) {
    return null;
  }

  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ id: string; distance_meters: number }>>(
      `SELECT rp.id AS id, ST_Distance(rp."currentLocation", origin.point) AS distance_meters
       FROM "RiderProfile" rp,
            (SELECT ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography AS point) AS origin
       WHERE rp."serviceZoneId" = $3
         AND rp."onlineStatus" = true
         AND rp."approvalStatus" = 'APPROVED'
         AND rp."deletedAt" IS NULL
         AND rp."currentLocation" IS NOT NULL
         AND ST_DWithin(rp."currentLocation", origin.point, $4)
       ORDER BY rp."currentLocation" <-> origin.point
       LIMIT $5`,
      params.longitude,
      params.latitude,
      params.serviceZoneId,
      params.radiusKm * 1000,
      params.limit ?? 25
    );

    return rows.map((row) => ({ id: row.id, distanceMeters: Number(row.distance_meters) }));
  } catch (error) {
    console.warn("[geo] PostGIS nearby-rider query failed, falling back to Haversine matching", error);
    return null;
  }
}
