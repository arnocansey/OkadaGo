import type { z } from "zod";
import { pricingInputSchema } from "../rides/ride.schemas.js";

export interface FareBreakdownLine {
  label: string;
  amount: number;
}

export interface DetailedFareBreakdown {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  bookingFee: number;
  surgeFee: number;
  waitingFee: number;
  discount: number;
  totalPassengerFare: number;
  okadaGoCommission: number;
  riderEarnings: number;
  commissionPercent: number;
  breakdown: FareBreakdownLine[];
}

export interface FareComputationResult {
  subtotal: number;
  totalFare: number;
  riderEarnings: number;
  platformCommission: number;
  estimatedDistanceKm: number;
  estimatedDurationMinutes: number;
  surgeAmount: number;
  waitingAmount: number;
  discountAmount: number;
  bookingFee: number;
  commissionPercent: number;
  detailed: DetailedFareBreakdown;
  breakdown: FareBreakdownLine[];
}

type PricingInput = z.infer<typeof pricingInputSchema>;

/**
 * Money-safe rounding utility using cents/pennies subunits.
 * Eliminates IEEE-754 floating-point drift (e.g. 0.1 + 0.2 !== 0.3).
 */
export function toCents(val: number): number {
  return Math.round((Number(val) + Number.EPSILON) * 100);
}

export function fromCents(cents: number): number {
  return Math.round(cents) / 100;
}

export function roundMoney(value: number): number {
  return fromCents(toCents(value));
}

export class FareService {
  /**
   * Deterministic fare calculator for OkadaGo trips.
   * Conforms to Section 2 (FARE STRUCTURE) and Section 25 (FINANCIAL EXAMPLE).
   */
  compute(
    input: PricingInput & {
      bookingFee?: number;
      minCommission?: number;
      commissionOverridePercent?: number;
    }
  ): FareComputationResult {
    // 1. Distance fare = distanceKm * perKmFee
    const distanceCents = toCents(input.estimatedDistanceKm * input.perKmFee);

    // 2. Time fare = durationMinutes * perMinuteFee
    const timeCents = toCents(input.estimatedDurationMinutes * input.perMinuteFee);

    // 3. Waiting fare = waitingMinutes * waitingFeePerMinute
    const waitingCents = toCents(input.waitingMinutes * input.waitingFeePerMinute);

    // 4. Base fare & booking fee
    const baseCents = toCents(input.baseFare);
    const bookingCents = toCents(input.bookingFee ?? 0);
    const zoneCents = toCents(input.zoneFee);

    // 5. Pre-surge sum
    const preSurgeCents = baseCents + distanceCents + timeCents + waitingCents + bookingCents + zoneCents;

    // 6. Surge calculation
    const surgeMultiplier = Math.max(1.0, Number(input.surgeMultiplier) || 1.0);
    const surgedSubtotalCents = toCents(fromCents(preSurgeCents) * surgeMultiplier);
    const surgeCents = Math.max(0, surgedSubtotalCents - preSurgeCents);

    // 7. Discounts (cannot exceed total before discounts)
    const rawDiscountCents = toCents(Math.max(0, input.promoDiscount + input.referralDiscount));
    const discountCents = Math.min(surgedSubtotalCents, rawDiscountCents);

    // 8. Total passenger fare (bounded by minimum fare)
    const totalBeforeMinCents = surgedSubtotalCents - discountCents;
    const minFareCents = toCents(input.minimumFare);
    const totalPassengerFareCents = Math.max(minFareCents, totalBeforeMinCents);

    // 9. Configurable OkadaGo Commission (default 15% if not provided)
    const commissionPercent =
      input.commissionOverridePercent != null
        ? input.commissionOverridePercent
        : (input.commissionPercent ?? 15);

    const minCommissionCents = toCents(input.minCommission ?? 0);
    const rawCommissionCents = toCents((fromCents(totalPassengerFareCents) * commissionPercent) / 100);
    const platformCommissionCents = Math.max(minCommissionCents, Math.min(totalPassengerFareCents, rawCommissionCents));

    // 10. Rider earnings = totalPassengerFare - commission
    const riderEarningsCents = Math.max(0, totalPassengerFareCents - platformCommissionCents);

    const baseFare = fromCents(baseCents);
    const distanceFare = fromCents(distanceCents);
    const timeFare = fromCents(timeCents);
    const bookingFee = fromCents(bookingCents);
    const waitingFee = fromCents(waitingCents);
    const surgeFee = fromCents(surgeCents);
    const discount = fromCents(discountCents);
    const totalPassengerFare = fromCents(totalPassengerFareCents);
    const okadaGoCommission = fromCents(platformCommissionCents);
    const riderEarnings = fromCents(riderEarningsCents);

    const breakdown: FareBreakdownLine[] = [
      { label: "Base fare", amount: baseFare },
      { label: "Distance fee", amount: distanceFare },
      { label: "Time fee", amount: timeFare },
      ...(bookingFee > 0 ? [{ label: "Booking fee", amount: bookingFee }] : []),
      ...(waitingFee > 0 ? [{ label: "Waiting fee", amount: waitingFee }] : []),
      ...(fromCents(zoneCents) > 0 ? [{ label: "Zone fee", amount: fromCents(zoneCents) }] : []),
      ...(surgeFee > 0 ? [{ label: "Surge adjustment", amount: surgeFee }] : []),
      ...(discount > 0 ? [{ label: "Discounts", amount: -discount }] : [])
    ];

    const detailed: DetailedFareBreakdown = {
      baseFare,
      distanceFare,
      timeFare,
      bookingFee,
      surgeFee,
      waitingFee,
      discount,
      totalPassengerFare,
      okadaGoCommission,
      riderEarnings,
      commissionPercent,
      breakdown
    };

    return {
      subtotal: fromCents(surgedSubtotalCents),
      totalFare: totalPassengerFare,
      riderEarnings,
      platformCommission: okadaGoCommission,
      estimatedDistanceKm: input.estimatedDistanceKm,
      estimatedDurationMinutes: input.estimatedDurationMinutes,
      surgeAmount: surgeFee,
      waitingAmount: waitingFee,
      discountAmount: discount,
      bookingFee,
      commissionPercent,
      detailed,
      breakdown
    };
  }
}

