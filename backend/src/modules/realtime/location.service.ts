import { prisma } from "../../common/prisma.js";
import { syncRiderLocationGeography } from "../../common/geo.js";

export type LiveRiderStatus = "ONLINE" | "BUSY" | "ON_TRIP" | "OFFLINE";

export interface LiveRiderLocation {
  riderId: string;
  userId: string;
  latitude: number;
  longitude: number;
  speed: number; // km/h
  heading: number; // 0 - 360 degrees
  accuracy: number; // meters
  timestamp: number; // ms
  status: LiveRiderStatus;
  tripId?: string | null;
  displayName: string;
  rating: number;
  vehicleType: string;
  vehiclePlate?: string | null;
  lastDbSync: number;
}

export interface PublicRiderLocation {
  riderId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  accuracy: number;
  timestamp: number;
  status: LiveRiderStatus;
  displayName: string;
  rating: number;
  vehicleType: string;
}

export interface AdminRiderLocation extends PublicRiderLocation {
  userId: string;
  vehiclePlate?: string | null;
  tripId?: string | null;
}

const GRID_STEP = 0.025; // ~2.78 km latitude/longitude grid cell
const DB_SYNC_THROTTLE_MS = 20000; // Throttle DB location updates to max 1 per 20 seconds

export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export class LiveLocationService {
  private riders = new Map<string, LiveRiderLocation>();
  private riderIdByUserId = new Map<string, string>();
  private grid = new Map<string, Set<string>>(); // cellKey -> Set<riderId>
  private isWarmedUp = false;

  public getGridKey(lat: number, lon: number): string {
    const latIndex = Math.floor(lat / GRID_STEP);
    const lonIndex = Math.floor(lon / GRID_STEP);
    return `${latIndex}:${lonIndex}`;
  }

  public getSurroundingGridKeys(lat: number, lon: number, radiusKm = 3.0): string[] {
    const latSpan = radiusKm / 111.0;
    const lonSpan = radiusKm / (111.0 * Math.max(0.1, Math.cos((lat * Math.PI) / 180)));

    const minLatIdx = Math.floor((lat - latSpan) / GRID_STEP);
    const maxLatIdx = Math.floor((lat + latSpan) / GRID_STEP);
    const minLonIdx = Math.floor((lon - lonSpan) / GRID_STEP);
    const maxLonIdx = Math.floor((lon + lonSpan) / GRID_STEP);

    const keys: string[] = [];
    for (let r = minLatIdx; r <= maxLatIdx; r++) {
      for (let c = minLonIdx; c <= maxLonIdx; c++) {
        keys.push(`${r}:${c}`);
      }
    }
    return keys;
  }

  public getRoomName(cellKey: string): string {
    return `geo:${cellKey}`;
  }

  public async warmup(): Promise<void> {
    if (this.isWarmedUp) return;
    try {
      const onlineRiders = await prisma.riderProfile.findMany({
        where: {
          onlineStatus: true,
          approvalStatus: "APPROVED",
          deletedAt: null,
          currentLatitude: { not: null },
          currentLongitude: { not: null },
        },
        include: {
          user: { select: { id: true, fullName: true } },
          vehicle: { select: { plateNumber: true, vehicleType: true } },
        },
        take: 200,
      });

      for (const r of onlineRiders) {
        const lat = Number(r.currentLatitude);
        const lon = Number(r.currentLongitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lon) || (lat === 0 && lon === 0)) continue;

        const live: LiveRiderLocation = {
          riderId: r.id,
          userId: r.userId,
          latitude: lat,
          longitude: lon,
          speed: 0,
          heading: 0,
          accuracy: 10,
          timestamp: Date.now(),
          status: "ONLINE",
          displayName: r.user.fullName?.split(" ")[0] || "Okada",
          rating: r.ratingAverage ? Number(r.ratingAverage) : 5.0,
          vehicleType: r.vehicle?.vehicleType || "Motorcycle",
          vehiclePlate: r.vehicle?.plateNumber,
          lastDbSync: Date.now(),
        };

        this.riders.set(r.id, live);
        this.riderIdByUserId.set(r.userId, r.id);

        const cell = this.getGridKey(lat, lon);
        let set = this.grid.get(cell);
        if (!set) {
          set = new Set();
          this.grid.set(cell, set);
        }
        set.add(r.id);
      }
      this.isWarmedUp = true;
    } catch (err) {
      console.warn("[LiveLocationService] Warmup error (continuing):", err);
    }
  }

  public async updateRiderLocation(params: {
    riderId?: string;
    userId?: string;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    accuracy?: number;
    status?: LiveRiderStatus;
    tripId?: string | null;
  }): Promise<{
    live: LiveRiderLocation;
    oldCell: string | null;
    newCell: string;
    cellChanged: boolean;
  } | null> {
    let riderId = params.riderId;
    if (!riderId && params.userId) {
      riderId = this.riderIdByUserId.get(params.userId);
      if (!riderId) {
        // Look up rider profile by user ID
        const profile = await prisma.riderProfile.findUnique({
          where: { userId: params.userId },
          select: {
            id: true,
            userId: true,
            user: { select: { fullName: true } },
            ratingAverage: true,
            vehicle: { select: { plateNumber: true, vehicleType: true } },
          },
        });
        if (profile) {
          riderId = profile.id;
          this.riderIdByUserId.set(params.userId, profile.id);
          this.riders.set(profile.id, {
            riderId: profile.id,
            userId: profile.userId,
            latitude: params.latitude,
            longitude: params.longitude,
            speed: params.speed ?? 0,
            heading: params.heading ?? 0,
            accuracy: params.accuracy ?? 10,
            timestamp: Date.now(),
            status: params.status ?? "ONLINE",
            tripId: params.tripId,
            displayName: profile.user.fullName?.split(" ")[0] || "Okada",
            rating: profile.ratingAverage ? Number(profile.ratingAverage) : 5.0,
            vehicleType: profile.vehicle?.vehicleType || "Motorcycle",
            vehiclePlate: profile.vehicle?.plateNumber,
            lastDbSync: 0,
          });
        }
      }
    }

    if (!riderId) return null;

    let live = this.riders.get(riderId);
    let oldCell: string | null = null;

    if (live) {
      oldCell = this.getGridKey(live.latitude, live.longitude);
      live.latitude = params.latitude;
      live.longitude = params.longitude;
      if (params.speed !== undefined) live.speed = params.speed;
      if (params.heading !== undefined) live.heading = params.heading;
      if (params.accuracy !== undefined) live.accuracy = params.accuracy;
      if (params.status !== undefined) live.status = params.status;
      if (params.tripId !== undefined) live.tripId = params.tripId;
      live.timestamp = Date.now();
    } else {
      live = {
        riderId,
        userId: params.userId || "",
        latitude: params.latitude,
        longitude: params.longitude,
        speed: params.speed ?? 0,
        heading: params.heading ?? 0,
        accuracy: params.accuracy ?? 10,
        timestamp: Date.now(),
        status: params.status ?? "ONLINE",
        tripId: params.tripId,
        displayName: "Okada",
        rating: 5.0,
        vehicleType: "Motorcycle",
        lastDbSync: 0,
      };
      this.riders.set(riderId, live);
      if (params.userId) this.riderIdByUserId.set(params.userId, riderId);
    }

    const newCell = this.getGridKey(live.latitude, live.longitude);
    const cellChanged = oldCell !== newCell;

    if (cellChanged) {
      if (oldCell) {
        const oldSet = this.grid.get(oldCell);
        oldSet?.delete(riderId);
        if (oldSet && oldSet.size === 0) this.grid.delete(oldCell);
      }
      let newSet = this.grid.get(newCell);
      if (!newSet) {
        newSet = new Set();
        this.grid.set(newCell, newSet);
      }
      newSet.add(riderId);
    }

    // Check DB sync throttling
    const now = Date.now();
    if (now - live.lastDbSync >= DB_SYNC_THROTTLE_MS) {
      live.lastDbSync = now;
      void this.flushToDatabase(live);
    }

    return { live, oldCell, newCell, cellChanged };
  }

  public setRiderOffline(riderIdOrUserId: string): LiveRiderLocation | null {
    let riderId = riderIdOrUserId;
    if (this.riderIdByUserId.has(riderIdOrUserId)) {
      riderId = this.riderIdByUserId.get(riderIdOrUserId)!;
    }

    const live = this.riders.get(riderId);
    if (!live) return null;

    const cell = this.getGridKey(live.latitude, live.longitude);
    const set = this.grid.get(cell);
    set?.delete(riderId);
    if (set && set.size === 0) this.grid.delete(cell);

    live.status = "OFFLINE";
    live.timestamp = Date.now();

    void prisma.riderProfile
      .update({
        where: { id: riderId },
        data: { onlineStatus: false },
      })
      .catch(() => {});

    return live;
  }

  public getNearbyRiders(
    lat: number,
    lon: number,
    radiusKm = 3.0,
    options?: { maxCount?: number }
  ): PublicRiderLocation[] {
    const maxCount = options?.maxCount ?? 50;
    const cells = this.getSurroundingGridKeys(lat, lon, radiusKm);
    const candidateRiderIds = new Set<string>();

    for (const cell of cells) {
      const set = this.grid.get(cell);
      if (set) {
        for (const id of set) candidateRiderIds.add(id);
      }
    }

    const result: Array<{ distance: number; rider: PublicRiderLocation }> = [];

    for (const id of candidateRiderIds) {
      const r = this.riders.get(id);
      if (!r || r.status !== "ONLINE") continue;

      const dist = haversineDistanceKm(lat, lon, r.latitude, r.longitude);
      if (dist <= radiusKm) {
        result.push({
          distance: dist,
          rider: this.toPublicPayload(r),
        });
      }
    }

    result.sort((a, b) => a.distance - b.distance);
    return result.slice(0, maxCount).map((item) => item.rider);
  }

  public getRiderLocation(riderId: string): LiveRiderLocation | null {
    return this.riders.get(riderId) || null;
  }

  public getAllAdminFleet(): AdminRiderLocation[] {
    const list: AdminRiderLocation[] = [];
    for (const r of this.riders.values()) {
      if (r.status !== "OFFLINE") {
        list.push({
          ...this.toPublicPayload(r),
          userId: r.userId,
          vehiclePlate: r.vehiclePlate,
          tripId: r.tripId,
        });
      }
    }
    return list;
  }

  public toPublicPayload(r: LiveRiderLocation): PublicRiderLocation {
    return {
      riderId: r.riderId,
      latitude: r.latitude,
      longitude: r.longitude,
      speed: r.speed,
      heading: r.heading,
      accuracy: r.accuracy,
      timestamp: r.timestamp,
      status: r.status,
      displayName: r.displayName,
      rating: r.rating,
      vehicleType: r.vehicleType,
    };
  }

  private async flushToDatabase(rider: LiveRiderLocation): Promise<void> {
    try {
      await prisma.riderProfile.update({
        where: { id: rider.riderId },
        data: {
          currentLatitude: rider.latitude,
          currentLongitude: rider.longitude,
        },
      });
      await syncRiderLocationGeography(rider.riderId, rider.latitude, rider.longitude);
    } catch (err) {
      console.warn(`[LiveLocationService] Failed to flush rider ${rider.riderId} to DB:`, err);
    }
  }
}

export const liveLocationService = new LiveLocationService();
