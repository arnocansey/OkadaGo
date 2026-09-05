import { prisma } from "../../common/prisma.js";
import { AppError } from "../../common/errors.js";
import {
  FinanceLedgerType,
  LedgerDirection,
  PaymentMethod,
  type Prisma
} from "../../generated/prisma/client.js";

export interface RecordLedgerEntryInput {
  riderId?: string | null;
  passengerId?: string | null;
  rideId?: string | null;
  deliveryId?: string | null;
  amount: number | Prisma.Decimal;
  currency?: string;
  type: FinanceLedgerType;
  direction: LedgerDirection;
  description: string;
  paymentMethod?: PaymentMethod | null;
  status?: string;
  referenceId?: string | null;
  idempotencyKey?: string | null;
  createdBy?: string | null;
  metadata?: Record<string, unknown> | null;
}

function generateTransactionId(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN-${dateStr}-${randomSuffix}`;
}

export class FinanceLedgerService {
  /**
   * Append an immutable ledger record within an existing Prisma transaction or standalone.
   * If an idempotencyKey is provided and an entry with that key exists, returns the existing record.
   */
  async recordEntry(
    tx: Prisma.TransactionClient | typeof prisma,
    input: RecordLedgerEntryInput
  ) {
    if (input.idempotencyKey) {
      const existing = await tx.financeLedgerEntry.findUnique({
        where: { idempotencyKey: input.idempotencyKey }
      });
      if (existing) {
        return existing;
      }
    }

    const transactionId = generateTransactionId();
    const entry = await tx.financeLedgerEntry.create({
      data: {
        transactionId,
        riderId: input.riderId ?? null,
        passengerId: input.passengerId ?? null,
        rideId: input.rideId ?? null,
        deliveryId: input.deliveryId ?? null,
        amount: input.amount,
        currency: input.currency ?? "GHS",
        type: input.type,
        direction: input.direction,
        description: input.description,
        paymentMethod: input.paymentMethod ?? null,
        status: input.status ?? "POSTED",
        referenceId: input.referenceId ?? null,
        idempotencyKey: input.idempotencyKey ?? null,
        createdBy: input.createdBy ?? "SYSTEM",
        metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined
      }
    });

    return entry;
  }

  /**
   * Reverse an existing financial ledger entry without deleting the original.
   * Creates a REVERSAL entry with opposite direction and links back via metadata.
   */
  async createReversal(
    tx: Prisma.TransactionClient | typeof prisma,
    originalEntryId: string,
    reason: string,
    actorUserId?: string
  ) {
    const original = await tx.financeLedgerEntry.findUnique({
      where: { id: originalEntryId }
    });

    if (!original) {
      throw new AppError("Original ledger entry not found for reversal", 404, "ENTRY_NOT_FOUND");
    }

    const oppositeDirection = original.direction === LedgerDirection.CREDIT ? LedgerDirection.DEBIT : LedgerDirection.CREDIT;
    const reversalIdempotency = `REV-${original.transactionId}`;

    const reversalEntry = await this.recordEntry(tx, {
      riderId: original.riderId,
      passengerId: original.passengerId,
      rideId: original.rideId,
      deliveryId: original.deliveryId,
      amount: original.amount,
      currency: original.currency,
      type: FinanceLedgerType.REVERSAL,
      direction: oppositeDirection,
      description: `Reversal of ${original.transactionId}: ${reason}`,
      paymentMethod: original.paymentMethod,
      status: "POSTED",
      referenceId: original.transactionId,
      idempotencyKey: reversalIdempotency,
      createdBy: actorUserId ?? "SYSTEM",
      metadata: {
        reversedTransactionId: original.transactionId,
        originalEntryId: original.id,
        reason
      }
    });

    return reversalEntry;
  }

  /**
   * List ledger entries with rich filtering.
   */
  async listLedgerEntries(filters: {
    riderId?: string;
    rideId?: string;
    type?: FinanceLedgerType;
    from?: Date;
    to?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: Prisma.FinanceLedgerEntryWhereInput = {};
    if (filters.riderId) where.riderId = filters.riderId;
    if (filters.rideId) where.rideId = filters.rideId;
    if (filters.type) where.type = filters.type;
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = filters.from;
      if (filters.to) where.createdAt.lte = filters.to;
    }

    const [entries, total] = await Promise.all([
      prisma.financeLedgerEntry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: filters.limit ?? 50,
        skip: filters.offset ?? 0,
        include: {
          rider: {
            include: {
              user: {
                select: { fullName: true, phoneE164: true }
              }
            }
          },
          ride: {
            select: {
              id: true,
              pickupAddress: true,
              destinationAddress: true,
              paymentMethod: true,
              finalFare: true,
              estimatedFare: true
            }
          }
        }
      }),
      prisma.financeLedgerEntry.count({ where })
    ]);

    return { entries, total };
  }
}

export const financeLedgerService = new FinanceLedgerService();
