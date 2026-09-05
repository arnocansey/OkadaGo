import type { z } from "zod";
import { matchingPreviewSchema } from "../rides/ride.schemas.js";

type MatchingPreviewInput = z.infer<typeof matchingPreviewSchema>;

export interface MatchingWeights {
  weightProximity?: number;
  weightEta?: number;
  weightRating?: number;
  weightAcceptance?: number;
  weightDirection?: number;
  cancellationPenalty?: number;
}

export interface CandidateMetrics {
  riderId: string;
  displayName: string;
  serviceZoneId: string;
  distanceToPickupKm: number;
  etaMinutes: number;
  ratingAverage: number;
  acceptanceRate: number;
  cancellationRate: number;
  isOnline: boolean;
  isApproved: boolean;
  isAvailable: boolean;
  currentHeading?: number | null;
  bearingToPickup?: number | null;
}

export interface RankedCandidate {
  riderId: string;
  displayName: string;
  score: number;
  distanceToPickupKm: number;
  etaMinutes: number;
  proximityScore: number;
  etaScore: number;
  ratingScore: number;
  reliabilityScore: number;
  directionScore: number;
  rationale: string[];
}

/**
 * Computes compass bearing in degrees (0-359) from start to destination coordinates.
 */
export function calculateBearingDegrees(
  startLat: number,
  startLng: number,
  destLat: number,
  destLng: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const dLng = toRad(destLng - startLng);
  const lat1 = toRad(startLat);
  const lat2 = toRad(destLat);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const bearing = toDeg(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

/**
 * Scores how well rider's current travel heading matches the bearing to passenger pickup.
 * 100 = directly heading towards pickup (0 deg difference)
 * 60 = stationary / no heading fix
 * 0 = heading directly away (180 deg difference)
 */
export function calculateDirectionScore(
  riderHeading: number | undefined | null,
  bearingToPickup: number | undefined | null
): number {
  if (riderHeading == null || isNaN(riderHeading) || bearingToPickup == null || isNaN(bearingToPickup)) {
    return 60;
  }
  const diff = Math.abs((((riderHeading - bearingToPickup) % 360) + 540) % 360 - 180);
  return Math.max(0, Math.round(100 * (1 - diff / 180)));
}

export class MatchingService {
  rankCandidates(
    input: MatchingPreviewInput,
    weights?: MatchingWeights
  ): RankedCandidate[] {
    const wDist = weights?.weightProximity ?? 0.30;
    const wEta = weights?.weightEta ?? 0.25;
    const wRating = weights?.weightRating ?? 0.15;
    const wAcceptance = weights?.weightAcceptance ?? 0.15;
    const wDirection = weights?.weightDirection ?? 0.15;
    const pCancel = weights?.cancellationPenalty ?? 0.8;

    return input.candidates
      .filter(
        (candidate) =>
          candidate.isOnline &&
          candidate.isApproved &&
          candidate.isAvailable &&
          candidate.serviceZoneId === input.requestedServiceZoneId &&
          candidate.distanceToPickupKm <= input.maxPickupRadiusKm
      )
      .map((candidate) => {
        // 1. Proximity score (0-100, drops past 4km for motorcycle efficiency)
        const proximityScore = Math.max(0, 100 - candidate.distanceToPickupKm * 14);

        // 2. ETA score (0-100, ideal pickup is <= 5 mins)
        const etaScore = Math.max(0, 100 - candidate.etaMinutes * 9);

        // 3. Rating score (0-100)
        const ratingScore = Math.min(100, candidate.ratingAverage * 20);

        // 4. Acceptance performance (0-100)
        const acceptanceScore = Math.min(100, candidate.acceptanceRate);

        // 5. Reliability / cancellation penalty
        const cancellationPenalty = candidate.cancellationRate * pCancel;
        const reliabilityScore = Math.max(0, acceptanceScore - cancellationPenalty);

        // 6. Direction of travel score
        const cAny = candidate as unknown as CandidateMetrics;
        const directionScore = calculateDirectionScore(cAny.currentHeading, cAny.bearingToPickup);

        // Weighted composite score (0-100 scale)
        const score =
          proximityScore * wDist +
          etaScore * wEta +
          ratingScore * wRating +
          acceptanceScore * wAcceptance +
          directionScore * wDirection -
          cancellationPenalty;

        const finalScore = Math.max(0, Math.round(score * 100) / 100);

        return {
          riderId: candidate.riderId,
          displayName: candidate.displayName,
          score: finalScore,
          distanceToPickupKm: candidate.distanceToPickupKm,
          etaMinutes: candidate.etaMinutes,
          proximityScore: Math.round(proximityScore),
          etaScore: Math.round(etaScore),
          ratingScore: Math.round(ratingScore),
          reliabilityScore: Math.round(reliabilityScore),
          directionScore: Math.round(directionScore),
          rationale: [
            `Proximity score: ${proximityScore.toFixed(0)} (${candidate.distanceToPickupKm.toFixed(2)} km)`,
            `ETA score: ${etaScore.toFixed(0)} (~${candidate.etaMinutes} min arrival)`,
            `Rider rating: ${candidate.ratingAverage.toFixed(1)} ★`,
            `Reliability: ${candidate.acceptanceRate}% acceptance, ${candidate.cancellationRate}% cancel penalty`,
            `Direction alignment: ${directionScore}/100`,
          ],
        };
      })
      .sort((left, right) => right.score - left.score);
  }
}
