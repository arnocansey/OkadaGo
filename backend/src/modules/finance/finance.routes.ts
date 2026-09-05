import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import { prisma } from "../../common/prisma.js";
import { AppError } from "../../common/errors.js";
import { PaymentMethod, PaymentStatus, PaymentDisputeType, PaymentDisputeStatus, FinanceLedgerType } from "../../generated/prisma/client.js";
import { commissionService } from "./commission.service.js";
import { paymentDisputeService } from "./payment-dispute.service.js";
import { reconciliationService } from "./reconciliation.service.js";
import { financeLedgerService } from "./finance-ledger.service.js";
import { roundMoney, toCents, fromCents } from "../pricing/fare.service.js";

function extractBearerToken(authorizationHeader?: string): string {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    throw new AppError("Authorization header is required", 401, "AUTHORIZATION_REQUIRED");
  }
  return authorizationHeader.slice("Bearer ".length).trim();
}

async function verifyAdminUser(token: string) {
  const session = await prisma.userSession.findUnique({
    where: { refreshTokenId: token },
    include: { user: { include: { adminProfile: true } } }
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    throw new AppError("Session is invalid or expired", 401, "SESSION_INVALID");
  }

  if (!session.user.adminProfile) {
    throw new AppError("Admin access is required", 403, "ADMIN_ACCESS_REQUIRED");
  }

  return session.user;
}

async function verifyAuthUser(token: string) {
  const session = await prisma.userSession.findUnique({
    where: { refreshTokenId: token },
    include: { user: { include: { riderProfile: true, passengerProfile: true, adminProfile: true } } }
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    throw new AppError("Session is invalid or expired", 401, "SESSION_INVALID");
  }

  return session.user;
}

function resolveDateFilter(query: { from?: string; to?: string; preset?: string }) {
  const now = new Date();
  let startDate: Date;
  let endDate = new Date(now);

  if (query.preset === "today") {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  } else if (query.preset === "yesterday") {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
  } else if (query.preset === "7days") {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (query.preset === "30days") {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (query.preset === "month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  } else if (query.from) {
    startDate = new Date(query.from);
    if (query.to) endDate = new Date(query.to);
  } else {
    // Default to last 30 days
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return { startDate, endDate };
}

export const financeRoutes: FastifyPluginAsync = async (server) => {
  /**
   * GET /finance/overview
   * Complete finance overview conforming to Section 12 (ADMIN FINANCE DASHBOARD).
   */
  server.get("/finance/overview", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    await verifyAdminUser(token);

    const query = request.query as { from?: string; to?: string; preset?: string };
    const { startDate, endDate } = resolveDateFilter(query);

    const [
      ridesFinance,
      deliveriesFinance,
      cashTripAgg,
      digitalTripAgg,
      debtAgg,
      commissionPaymentsAgg,
      paidPayoutsAgg,
      refundsAgg,
      disputesCount,
      restrictedRidersCount,
      settings
    ] = await Promise.all([
      prisma.ride.aggregate({
        where: {
          status: "COMPLETED",
          completedAt: { gte: startDate, lte: endDate }
        },
        _sum: {
          finalFare: true,
          platformCommission: true,
          riderEarnings: true
        },
        _count: { _all: true }
      }),
      prisma.deliveryRequest.aggregate({
        where: {
          status: "DELIVERED",
          deliveredAt: { gte: startDate, lte: endDate }
        },
        _sum: {
          finalFee: true,
          platformCommission: true,
          riderEarnings: true
        },
        _count: { _all: true }
      }),
      prisma.ride.aggregate({
        where: {
          status: "COMPLETED",
          paymentMethod: PaymentMethod.CASH,
          completedAt: { gte: startDate, lte: endDate }
        },
        _sum: { finalFare: true, platformCommission: true },
        _count: { _all: true }
      }),
      prisma.ride.aggregate({
        where: {
          status: "COMPLETED",
          paymentMethod: { not: PaymentMethod.CASH },
          completedAt: { gte: startDate, lte: endDate }
        },
        _sum: { finalFare: true, platformCommission: true },
        _count: { _all: true }
      }),
      prisma.riderProfile.aggregate({
        where: { deletedAt: null },
        _sum: { outstandingCommission: true, totalCashCollected: true, totalCommissionPaid: true }
      }),
      prisma.commissionPayment.aggregate({
        where: {
          status: "SUCCESSFUL",
          settledAt: { gte: startDate, lte: endDate }
        },
        _sum: { amount: true },
        _count: { _all: true }
      }),
      prisma.payoutRequest.aggregate({
        where: {
          status: "PAID",
          paidAt: { gte: startDate, lte: endDate }
        },
        _sum: { amount: true },
        _count: { _all: true }
      }),
      prisma.financeLedgerEntry.aggregate({
        where: {
          type: FinanceLedgerType.REFUND,
          createdAt: { gte: startDate, lte: endDate }
        },
        _sum: { amount: true },
        _count: { _all: true }
      }),
      prisma.paymentDispute.count({
        where: { status: { in: ["OPEN", "UNDER_REVIEW"] } }
      }),
      prisma.riderProfile.count({
        where: { isCashRestricted: true }
      }),
      commissionService.getSettings()
    ]);

    const rideRevenue = Number(ridesFinance._sum.finalFare ?? 0);
    const deliveryRevenue = Number(deliveriesFinance._sum.finalFee ?? 0);
    const totalRevenue = roundMoney(rideRevenue + deliveryRevenue);

    const rideCommission = Number(ridesFinance._sum.platformCommission ?? 0);
    const deliveryCommission = Number(deliveriesFinance._sum.platformCommission ?? 0);
    const okadaGoCommission = roundMoney(rideCommission + deliveryCommission);

    const rideEarnings = Number(ridesFinance._sum.riderEarnings ?? 0);
    const deliveryEarnings = Number(deliveriesFinance._sum.riderEarnings ?? 0);
    const riderEarnings = roundMoney(rideEarnings + deliveryEarnings);

    const cashCollected = Number(cashTripAgg._sum.finalFare ?? 0);
    const digitalPayments = Number(digitalTripAgg._sum.finalFare ?? 0);

    const outstandingCommission = Number(debtAgg._sum.outstandingCommission ?? 0);
    const commissionCollected = Number(commissionPaymentsAgg._sum.amount ?? 0);
    const riderPayouts = Number(paidPayoutsAgg._sum.amount ?? 0);
    const refunds = Number(refundsAgg._sum.amount ?? 0);

    // Dynamic alerts
    const alerts: Array<{ id: string; type: "warning" | "danger" | "info"; message: string }> = [];
    if (disputesCount > 0) {
      alerts.push({
        id: "disputes-pending",
        type: "warning",
        message: `${disputesCount} payment dispute${disputesCount > 1 ? "s" : ""} require admin review.`
      });
    }
    if (restrictedRidersCount > 0) {
      alerts.push({
        id: "restricted-riders",
        type: "danger",
        message: `${restrictedRidersCount} rider${restrictedRidersCount > 1 ? "s are" : " is"} currently restricted from cash trips due to commission liability exceeding GH₵ ${Number(settings.commissionRestrictionThreshold).toFixed(2)}.`
      });
    }

    return {
      range: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
        preset: query.preset ?? "30days"
      },
      stats: {
        totalRevenue,
        okadaGoCommission,
        riderEarnings,
        cashCollected,
        digitalPayments,
        outstandingCommission,
        commissionCollected,
        riderPayouts,
        refunds,
        disputes: disputesCount
      },
      tripsSummary: {
        totalCompletedTrips: (ridesFinance._count._all ?? 0) + (deliveriesFinance._count._all ?? 0),
        cashTripsCount: cashTripAgg._count._all ?? 0,
        digitalTripsCount: digitalTripAgg._count._all ?? 0
      },
      restrictedRidersCount,
      alerts,
      currency: settings.currency
    };
  });

  /**
   * GET /finance/cash-collections
   * Cash collection table conforming to Section 13 (CASH COLLECTION DASHBOARD).
   */
  server.get("/finance/cash-collections", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    await verifyAdminUser(token);

    const query = request.query as { page?: string; limit?: string; search?: string; from?: string; to?: string };
    const page = Math.max(1, parseInt(query.page || "1", 10));
    const limit = Math.min(100, Math.max(5, parseInt(query.limit || "20", 10)));
    const skip = (page - 1) * limit;

    const where: any = {
      status: "COMPLETED",
      paymentMethod: PaymentMethod.CASH
    };

    if (query.from || query.to) {
      where.completedAt = {};
      if (query.from) where.completedAt.gte = new Date(query.from);
      if (query.to) where.completedAt.lte = new Date(query.to);
    }

    if (query.search) {
      where.OR = [
        { id: { contains: query.search, mode: "insensitive" } },
        { rider: { user: { fullName: { contains: query.search, mode: "insensitive" } } } },
        { passenger: { user: { fullName: { contains: query.search, mode: "insensitive" } } } }
      ];
    }

    const [rides, total, aggSummary, debtAgg] = await Promise.all([
      prisma.ride.findMany({
        where,
        orderBy: { completedAt: "desc" },
        take: limit,
        skip,
        include: {
          rider: { include: { user: { select: { fullName: true, phoneE164: true } } } },
          passenger: { include: { user: { select: { fullName: true, phoneE164: true } } } },
          payment: true
        }
      }),
      prisma.ride.count({ where }),
      prisma.ride.aggregate({
        where,
        _sum: { finalFare: true, platformCommission: true, riderEarnings: true, cashCollected: true }
      }),
      prisma.riderProfile.aggregate({
        _sum: { outstandingCommission: true, totalCommissionPaid: true }
      })
    ]);

    const formattedRows = rides.map((r) => ({
      tripId: r.id,
      shortId: `#OG-${r.id.slice(-6).toUpperCase()}`,
      riderId: r.riderId,
      riderName: r.rider?.user?.fullName ?? "Unassigned",
      riderPhone: r.rider?.user?.phoneE164,
      passengerName: r.passenger?.user?.fullName ?? "Anonymous",
      passengerPhone: r.passenger?.user?.phoneE164,
      pickupAddress: r.pickupAddress,
      destinationAddress: r.destinationAddress,
      fare: Number(r.finalFare ?? r.estimatedFare ?? 0),
      cashCollected: Number(r.cashCollected ?? r.finalFare ?? 0),
      okadaGoCommission: Number(r.platformCommission ?? 0),
      riderEarnings: Number(r.riderEarnings ?? 0),
      paymentStatus: r.payment?.status ?? PaymentStatus.CASH_COLLECTED,
      tripDate: r.completedAt ?? r.createdAt
    }));

    return {
      summary: {
        totalCashTrips: total,
        totalCashCollected: Number(aggSummary._sum.cashCollected ?? aggSummary._sum.finalFare ?? 0),
        totalCommissionGenerated: Number(aggSummary._sum.platformCommission ?? 0),
        commissionCollected: Number(debtAgg._sum.totalCommissionPaid ?? 0),
        outstandingCommission: Number(debtAgg._sum.outstandingCommission ?? 0)
      },
      rows: formattedRows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  });

  /**
   * GET /finance/outstanding-commissions
   * Outstanding commission dashboard conforming to Section 14.
   */
  server.get("/finance/outstanding-commissions", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    await verifyAdminUser(token);

    const query = request.query as {
      sortBy?: "debt" | "oldest" | "trips" | "recent";
      search?: string;
      page?: string;
      limit?: string;
    };

    const page = Math.max(1, parseInt(query.page || "1", 10));
    const limit = Math.min(100, Math.max(5, parseInt(query.limit || "20", 10)));
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
      outstandingCommission: { gt: 0 }
    };

    if (query.search) {
      where.user = {
        OR: [
          { fullName: { contains: query.search, mode: "insensitive" } },
          { phoneE164: { contains: query.search, mode: "insensitive" } },
          { email: { contains: query.search, mode: "insensitive" } }
        ]
      };
    }

    let orderBy: any = { outstandingCommission: "desc" };
    if (query.sortBy === "oldest") {
      orderBy = { commissionWarningIssuedAt: "asc" };
    } else if (query.sortBy === "trips") {
      orderBy = { completedTrips: "desc" };
    } else if (query.sortBy === "recent") {
      orderBy = { updatedAt: "desc" };
    }

    const [riders, total, settings] = await Promise.all([
      prisma.riderProfile.findMany({
        where,
        orderBy,
        take: limit,
        skip,
        include: {
          user: { select: { fullName: true, phoneE164: true, accountStatus: true, avatarUrl: true } },
          commissionPayments: {
            orderBy: { createdAt: "desc" },
            take: 1
          },
          rides: {
            where: { paymentMethod: PaymentMethod.CASH, status: "COMPLETED" },
            select: { id: true }
          }
        }
      }),
      prisma.riderProfile.count({ where }),
      commissionService.getSettings()
    ]);

    const rows = (riders as any[]).map((r) => {
      const debt = Number(r.outstandingCommission);
      const paid = Number(r.totalCommissionPaid);
      const gen = roundMoney(debt + paid);

      return {
        riderId: r.id,
        name: r.user.fullName,
        displayCode: r.displayCode,
        phone: r.user.phoneE164,
        avatarUrl: r.user.avatarUrl,
        cashTripsCount: r.rides.length,
        cashCollected: Number(r.totalCashCollected),
        commissionGenerated: gen,
        commissionPaid: paid,
        outstandingBalance: debt,
        lastPaymentDate: r.commissionPayments[0]?.createdAt ?? null,
        lastPaymentAmount: r.commissionPayments[0] ? Number(r.commissionPayments[0].amount) : null,
        accountStatus: r.user.accountStatus,
        isCashRestricted: r.isCashRestricted,
        warningThreshold: Number(settings.commissionWarningThreshold),
        restrictionThreshold: Number(settings.commissionRestrictionThreshold)
      };
    });

    return {
      rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  });

  /**
   * POST /finance/riders/:riderId/remind
   * Dispatches debt reminder.
   */
  server.post("/finance/riders/:riderId/remind", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    await verifyAdminUser(token);

    const { riderId } = request.params as { riderId: string };
    const rider = await prisma.riderProfile.findUniqueOrThrow({
      where: { id: riderId },
      include: { user: true }
    });

    const debt = Number(rider.outstandingCommission);

    // Create in-app notification
    await prisma.notification.create({
      data: {
        userId: rider.userId,
        channel: "IN_APP",
        title: "Commission Balance Reminder",
        body: `Your outstanding OkadaGo commission is GH₵ ${debt.toFixed(2)}. Settle your balance in your wallet to ensure uninterrupted cash trip earnings.`
      }
    });

    return {
      success: true,
      message: `Reminder sent to ${rider.user.fullName} (${rider.user.phoneE164}) for GH₵ ${debt.toFixed(2)}.`
    };
  });

  /**
   * POST /finance/riders/:riderId/restrict-cash
   * Toggles cash trip restriction.
   */
  server.post("/finance/riders/:riderId/restrict-cash", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const admin = await verifyAdminUser(token);

    const { riderId } = request.params as { riderId: string };
    const body = request.body as { restricted: boolean; reason?: string };

    const updated = await commissionService.setRiderCashRestriction(
      riderId,
      body.restricted,
      admin.id,
      body.reason
    );

    return {
      success: true,
      isCashRestricted: updated.isCashRestricted,
      cashRestrictedAt: updated.cashRestrictedAt
    };
  });

  /**
   * POST /finance/settle-commission
   * Commission settlement endpoint for Rider & Admin.
   * Conforms to Section 9 (COMMISSION SETTLEMENT).
   */
  server.post("/finance/settle-commission", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const user = await verifyAuthUser(token);

    const body = request.body as {
      riderProfileId?: string;
      amount: number;
      paymentMethod: "MOBILE_MONEY" | "CARD" | "WALLET_BALANCE" | "ADMIN_CASH";
      reference?: string;
      notes?: string;
    };

    const targetRiderId = user.riderProfile?.id ?? body.riderProfileId;
    if (!targetRiderId) {
      throw new AppError("Rider profile ID is required", 400, "MISSING_RIDER_ID");
    }

    const isAdmin = Boolean(user.adminProfile);
    const result = await commissionService.settleCommission({
      riderProfileId: targetRiderId,
      amount: body.amount,
      paymentMethod: body.paymentMethod,
      reference: body.reference,
      notes: body.notes,
      adminUserId: isAdmin ? user.id : undefined
    });

    return result;
  });

  /**
   * POST /finance/adjust-balance
   * Authorized admin financial adjustment.
   */
  server.post("/finance/adjust-balance", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const admin = await verifyAdminUser(token);

    const body = request.body as {
      riderProfileId: string;
      amount: number;
      adjustmentType: "WAIVE_COMMISSION" | "ADD_COMMISSION_DEBT" | "CREDIT_EARNINGS" | "DEBIT_EARNINGS";
      reason: string;
    };

    return commissionService.adjustRiderBalance({
      riderProfileId: body.riderProfileId,
      amount: body.amount,
      adjustmentType: body.adjustmentType,
      reason: body.reason,
      adminUserId: admin.id
    });
  });

  /**
   * GET /finance/rider/:riderId/profile
   * Rider finance profile conforming to Section 15.
   */
  server.get("/finance/rider/:riderId/profile", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    await verifyAuthUser(token);

    const { riderId } = request.params as { riderId: string };
    return commissionService.getRiderFinanceProfile(riderId);
  });

  /**
   * GET /finance/disputes
   * Lists payment disputes.
   */
  server.get("/finance/disputes", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    await verifyAdminUser(token);

    const query = request.query as {
      status?: PaymentDisputeStatus;
      disputeType?: PaymentDisputeType;
      riderId?: string;
      limit?: string;
      offset?: string;
    };

    return paymentDisputeService.listDisputes({
      status: query.status,
      disputeType: query.disputeType,
      riderId: query.riderId,
      limit: query.limit ? parseInt(query.limit, 10) : 50,
      offset: query.offset ? parseInt(query.offset, 10) : 0
    });
  });

  /**
   * POST /finance/disputes
   * Files a payment dispute.
   */
  server.post("/finance/disputes", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const user = await verifyAuthUser(token);

    const body = request.body as {
      rideId: string;
      disputeType: PaymentDisputeType;
      amountDisputed?: number;
      description: string;
      evidence?: Record<string, unknown>;
    };

    return paymentDisputeService.fileDispute({
      rideId: body.rideId,
      reporterUserId: user.id,
      disputeType: body.disputeType,
      amountDisputed: body.amountDisputed,
      description: body.description,
      evidence: body.evidence
    });
  });

  /**
   * PATCH /finance/disputes/:disputeId/resolve
   * Resolves a payment dispute.
   */
  server.patch("/finance/disputes/:disputeId/resolve", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const admin = await verifyAdminUser(token);

    const { disputeId } = request.params as { disputeId: string };
    const body = request.body as {
      status: PaymentDisputeStatus;
      resolutionNotes: string;
      waiveCommission?: boolean;
      refundAmount?: number;
    };

    return paymentDisputeService.resolveDispute(disputeId, admin.id, body);
  });

  /**
   * GET /finance/reconciliation
   * Automated trip reconciliation engine conforming to Section 17.
   */
  server.get("/finance/reconciliation", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    await verifyAdminUser(token);

    const query = request.query as { from?: string; to?: string; limit?: string };
    return reconciliationService.runReconciliation({
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : 200
    });
  });

  /**
   * GET /finance/settings
   */
  server.get("/finance/settings", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    await verifyAdminUser(token);
    return commissionService.getSettings();
  });

  /**
   * PATCH /finance/settings
   */
  server.patch("/finance/settings", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const admin = await verifyAdminUser(token);
    const body = request.body as any;
    return commissionService.updateSettings(admin.id, body);
  });

  /**
   * GET /finance/reports/export
   * Downloadable reports (CSV format) conforming to Section 20.
   */
  server.get("/finance/reports/export", async (request, reply) => {
    const token = extractBearerToken(request.headers.authorization);
    await verifyAdminUser(token);

    const query = request.query as { type?: string; from?: string; to?: string };
    const reportType = query.type || "revenue";
    const { startDate, endDate } = resolveDateFilter(query);

    let csvContent = "";
    let filename = `okadago-${reportType}-${new Date().toISOString().slice(0, 10)}.csv`;

    if (reportType === "cash-collection" || reportType === "revenue") {
      const rides = await prisma.ride.findMany({
        where: {
          status: "COMPLETED",
          ...(reportType === "cash-collection" ? { paymentMethod: PaymentMethod.CASH } : {}),
          completedAt: { gte: startDate, lte: endDate }
        },
        include: {
          rider: { include: { user: { select: { fullName: true } } } },
          passenger: { include: { user: { select: { fullName: true } } } }
        },
        orderBy: { completedAt: "desc" },
        take: 1000
      });

      const headers = ["Trip ID", "Date", "Rider", "Passenger", "Payment Method", "Fare (GHS)", "Cash Collected (GHS)", "Commission (GHS)", "Rider Earnings (GHS)"];
      const lines = rides.map((r) => [
        `#OG-${r.id.slice(-6).toUpperCase()}`,
        (r.completedAt ?? r.createdAt).toISOString(),
        `"${(r.rider?.user?.fullName ?? "Unassigned").replace(/"/g, '""')}"`,
        `"${(r.passenger?.user?.fullName ?? "Anonymous").replace(/"/g, '""')}"`,
        r.paymentMethod ?? "CASH",
        Number(r.finalFare ?? r.estimatedFare ?? 0).toFixed(2),
        Number(r.cashCollected ?? 0).toFixed(2),
        Number(r.platformCommission ?? 0).toFixed(2),
        Number(r.riderEarnings ?? 0).toFixed(2)
      ].join(","));

      csvContent = [headers.join(","), ...lines].join("\n");
    } else if (reportType === "outstanding") {
      const debtors = await prisma.riderProfile.findMany({
        where: { outstandingCommission: { gt: 0 } },
        include: { user: { select: { fullName: true, phoneE164: true } } },
        orderBy: { outstandingCommission: "desc" }
      });

      const headers = ["Rider ID", "Name", "Phone", "Cash Collected (GHS)", "Commission Paid (GHS)", "Outstanding Debt (GHS)", "Cash Restricted"];
      const lines = debtors.map((d) => [
        d.displayCode,
        `"${d.user.fullName.replace(/"/g, '""')}"`,
        d.user.phoneE164,
        Number(d.totalCashCollected).toFixed(2),
        Number(d.totalCommissionPaid).toFixed(2),
        Number(d.outstandingCommission).toFixed(2),
        d.isCashRestricted ? "YES" : "NO"
      ].join(","));

      csvContent = [headers.join(","), ...lines].join("\n");
    } else {
      // General Ledger report
      const ledger = await prisma.financeLedgerEntry.findMany({
        where: { createdAt: { gte: startDate, lte: endDate } },
        orderBy: { createdAt: "desc" },
        take: 1000
      });

      const headers = ["Transaction ID", "Date", "Type", "Direction", "Amount (GHS)", "Description", "Reference ID"];
      const lines = ledger.map((l) => [
        l.transactionId,
        l.createdAt.toISOString(),
        l.type,
        l.direction,
        Number(l.amount).toFixed(2),
        `"${l.description.replace(/"/g, '""')}"`,
        l.referenceId ?? ""
      ].join(","));

      csvContent = [headers.join(","), ...lines].join("\n");
    }

    reply
      .header("Content-Type", "text/csv; charset=utf-8")
      .header("Content-Disposition", `attachment; filename="${filename}"`)
      .send(csvContent);
  });
};
