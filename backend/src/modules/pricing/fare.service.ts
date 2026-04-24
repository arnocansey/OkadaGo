import type { z } from "zod";
import { pricingInputSchema } from "../rides/ride.schemas.js";

export interface FareBreakdownLine {
  label: string;
  amount: number;
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
  breakdown: FareBreakdownLine[];
}

type PricingInput = z.infer<typeof pricingInputSchema>;

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export class FareService {
  compute(input: PricingInput): FareComputationResult {
    const distanceAmount = input.estimatedDistanceKm * input.perKmFee;
    const durationAmount = input.estimatedDurationMinutes * input.perMinuteFee;
    const waitingAmount = input.waitingMinutes * input.waitingFeePerMinute;
    const preSurge = input.baseFare + distanceAmount + durationAmount + waitingAmount + input.zoneFee;
    const surgedSubtotal = preSurge * input.surgeMultiplier;
    const surgeAmount = surgedSubtotal - preSurge;
    const discountAmount = Math.min(
      surgedSubtotal,
      Math.max(0, input.promoDiscount + input.referralDiscount)
    );
    const totalBeforeMin = surgedSubtotal - discountAmount;
    const totalFare = Math.max(input.minimumFare, totalBeforeMin);
    const platformCommission = totalFare * (input.commissionPercent / 100);
    const riderEarnings = Math.max(0, totalFare - platformCommission);

    return {
      subtotal: roundMoney(surgedSubtotal),
      totalFare: roundMoney(totalFare),
      riderEarnings: roundMoney(riderEarnings),
      platformCommission: roundMoney(platformCommission),
      estimatedDistanceKm: input.estimatedDistanceKm,
      estimatedDurationMinutes: input.estimatedDurationMinutes,
      surgeAmount: roundMoney(surgeAmount),
      waitingAmount: roundMoney(waitingAmount),
      discountAmount: roundMoney(discountAmount),
      breakdown: [
        { label: "Base fare", amount: roundMoney(input.baseFare) },
        { label: "Distance fee", amount: roundMoney(distanceAmount) },
        { label: "Time fee", amount: roundMoney(durationAmount) },
        { label: "Waiting fee", amount: roundMoney(waitingAmount) },
        { label: "Zone fee", amount: roundMoney(input.zoneFee) },
        { label: "Surge adjustment", amount: roundMoney(surgeAmount) },
        { label: "Discounts", amount: roundMoney(-discountAmount) }
      ]
    };
  }
}
