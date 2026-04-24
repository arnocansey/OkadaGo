import type { z } from "zod";
import { matchingPreviewSchema } from "../rides/ride.schemas.js";

type MatchingPreviewInput = z.infer<typeof matchingPreviewSchema>;

export interface RankedCandidate {
  riderId: string;
  displayName: string;
  score: number;
  distanceToPickupKm: number;
  etaMinutes: number;
  rationale: string[];
}

export class MatchingService {
  rankCandidates(input: MatchingPreviewInput): RankedCandidate[] {
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
        const proximityScore = Math.max(0, 100 - candidate.distanceToPickupKm * 12);
        const etaScore = Math.max(0, 100 - candidate.etaMinutes * 8);
        const ratingScore = candidate.ratingAverage * 20;
        const acceptanceScore = candidate.acceptanceRate;
        const cancellationPenalty = candidate.cancellationRate * 0.6;
        const score = proximityScore * 0.35 +
          etaScore * 0.25 +
          ratingScore * 0.15 +
          acceptanceScore * 0.25 -
          cancellationPenalty;

        return {
          riderId: candidate.riderId,
          displayName: candidate.displayName,
          score: Math.round(score * 100) / 100,
          distanceToPickupKm: candidate.distanceToPickupKm,
          etaMinutes: candidate.etaMinutes,
          rationale: [
            `Distance score from ${candidate.distanceToPickupKm.toFixed(2)}km pickup proximity`,
            `ETA score from ${candidate.etaMinutes} minute predicted arrival`,
            `Reliability score from ${candidate.acceptanceRate}% acceptance and ${candidate.cancellationRate}% cancellation`
          ]
        };
      })
      .sort((left, right) => right.score - left.score);
  }
}
