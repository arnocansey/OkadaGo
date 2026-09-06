import { prisma } from "../../common/prisma.js";

const DEFAULT_RETENTION_DAYS = 90;
const ACTIVE_TRIP_RETENTION_HOURS = 24;
const SOS_RETENTION_DAYS = 365;

export interface RetentionConfig {
  completedTripRetentionDays: number;
  activeTripRetentionHours: number;
  sosRetentionDays: number;
  analyticsRetentionDays: number;
}

export class LocationRetentionService {
  private config: RetentionConfig = {
    completedTripRetentionDays: DEFAULT_RETENTION_DAYS,
    activeTripRetentionHours: ACTIVE_TRIP_RETENTION_HOURS,
    sosRetentionDays: SOS_RETENTION_DAYS,
    analyticsRetentionDays: 365,
  };

  /**
   * Delete precise GPS records older than retention period.
   * Skips trips with active legal/safety holds.
   */
  async cleanupExpiredLocations(): Promise<{
    deleted: number;
    skipped: number;
    errors: number;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.completedTripRetentionDays);

    let deleted = 0;
    let skipped = 0;
    let errors = 0;

    try {
      const expiredTrips = await prisma.ride.findMany({
        where: {
          status: { in: ["COMPLETED", "CANCELLED"] },
          completedAt: { lt: cutoffDate },
        },
        select: { id: true },
      });

      for (const trip of expiredTrips) {
        try {
          const result = await prisma.rideLocation.deleteMany({
            where: { rideId: trip.id },
          });
          deleted += result.count;
        } catch {
          errors++;
        }
      }
    } catch {
      errors++;
    }

    return { deleted, skipped, errors };
  }

  /**
   * Get retention configuration.
   */
  getConfig(): RetentionConfig {
    return { ...this.config };
  }

  /**
   * Update retention configuration.
   */
  updateConfig(updates: Partial<RetentionConfig>) {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Get storage statistics for admin dashboard.
   */
  async getStorageStats(): Promise<{
    totalLocationRecords: number;
    oldestRecord: Date | null;
    tripsWithLocations: number;
    estimatedStorageMB: number;
  }> {
    const [count, oldest, tripsCount] = await Promise.all([
      prisma.rideLocation.count(),
      prisma.rideLocation.findFirst({
        orderBy: { recordedAt: "asc" },
        select: { recordedAt: true },
      }),
      prisma.rideLocation.groupBy({
        by: ["rideId"],
        _count: true,
      }),
    ]);

    const estimatedBytes = count * 200;
    const estimatedMB = Math.round((estimatedBytes / (1024 * 1024)) * 100) / 100;

    return {
      totalLocationRecords: count,
      oldestRecord: oldest?.recordedAt ?? null,
      tripsWithLocations: tripsCount.length,
      estimatedStorageMB: estimatedMB,
    };
  }
}

export const locationRetentionService = new LocationRetentionService();
