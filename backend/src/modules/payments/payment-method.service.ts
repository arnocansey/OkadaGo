import { appConfig } from "../../common/config.js";
import { makeWalletReference } from "../../common/codes.js";
import { AppError } from "../../common/errors.js";
import { prisma } from "../../common/prisma.js";
import { SavedPaymentChannel, SavedPaymentStatus, UserRole } from "../../generated/prisma/enums.js";
import type {
  ChargeSavedMethodInput,
  CreateManualPaymentMethodInput,
  InitializeCardVaultInput
} from "./payment-method.schemas.js";

type PaystackInitializeResponse = {
  status: boolean;
  message?: string;
  data: {
    authorization_url?: string;
    access_code?: string;
    reference?: string;
  };
};

type PaystackVerifyResponse = {
  status: boolean;
  message?: string;
  data: {
    status?: string;
    amount?: number;
    currency?: string;
    reference?: string;
    customer?: { customer_code?: string; email?: string };
    authorization?: {
      authorization_code?: string;
      reusable?: boolean;
      last4?: string;
      brand?: string;
      exp_month?: string | number;
      exp_year?: string | number;
      signature?: string;
      channel?: string;
      bin?: string;
      card_type?: string;
      bank?: string;
    };
  };
};

type PaystackChargeResponse = {
  status: boolean;
  message?: string;
  data?: {
    status?: string;
    reference?: string;
    amount?: number;
    currency?: string;
  };
};

function toSubunit(amount: number) {
  return Math.round(amount * 100);
}

function fromSubunit(amount: number) {
  return amount / 100;
}

function serializeMethod(row: {
  id: string;
  channel: SavedPaymentChannel;
  status: SavedPaymentStatus;
  provider: string;
  label: string | null;
  emailUsed: string | null;
  cardLast4: string | null;
  cardBrand: string | null;
  cardExpMonth: string | null;
  cardExpYear: string | null;
  momoPhone: string | null;
  momoProvider: string | null;
  paypalEmail: string | null;
  isDefault: boolean;
  reusable: boolean;
  createdAt: Date;
  revokedAt: Date | null;
}) {
  const brand = row.cardBrand || row.momoProvider || (row.channel === "PAYPAL" ? "PayPal" : row.channel);
  const label =
    row.label ||
    (row.channel === "CARD" && row.cardLast4
      ? `${brand} ending in ${row.cardLast4}`
      : row.channel === "MOBILE_MONEY"
        ? row.momoProvider || "Mobile Money"
        : row.paypalEmail || "PayPal");

  return {
    id: row.id,
    channel: row.channel.toLowerCase(),
    status: row.status.toLowerCase(),
    provider: row.provider,
    brand,
    label,
    detail:
      row.channel === "CARD"
        ? row.emailUsed || "Card"
        : row.channel === "MOBILE_MONEY"
          ? row.momoPhone || "—"
          : row.paypalEmail || "—",
    expiry:
      row.cardExpMonth && row.cardExpYear
        ? `${String(row.cardExpMonth).padStart(2, "0")}/${String(row.cardExpYear).slice(-2)}`
        : null,
    isDefault: row.isDefault,
    reusable: row.reusable,
    chargeable: Boolean(row.reusable && row.status === "ACTIVE"),
    createdAt: row.createdAt.toISOString(),
    revokedAt: row.revokedAt?.toISOString() ?? null
  };
}

export class PaymentMethodService {
  private async requireSession(token: string) {
    const session = await prisma.userSession.findUnique({
      where: { refreshTokenId: token },
      include: { user: { include: { adminProfile: true } } }
    });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new AppError("Session is invalid or expired", 401, "SESSION_INVALID");
    }
    if (session.user.deletedAt) {
      throw new AppError("Account is deleted", 403, "ACCOUNT_DELETED");
    }
    return session;
  }

  private async requireAdmin(token: string) {
    const session = await this.requireSession(token);
    if (session.user.role !== UserRole.ADMIN || !session.user.adminProfile) {
      throw new AppError("Admin access is required", 403, "ADMIN_ACCESS_REQUIRED");
    }
    return session;
  }

  async listMethods(token: string) {
    const session = await this.requireAdmin(token);
    const rows = await prisma.savedPaymentMethod.findMany({
      where: {
        userId: session.userId,
        status: { in: [SavedPaymentStatus.ACTIVE, SavedPaymentStatus.PENDING] },
        revokedAt: null
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }]
    });
    return { methods: rows.map(serializeMethod) };
  }

  async initializeCardVault(token: string, input: InitializeCardVaultInput) {
    const session = await this.requireAdmin(token);
    if (!appConfig.paystackSecretKey) {
      throw new AppError("Paystack is not configured", 503, "PAYSTACK_NOT_CONFIGURED");
    }

    const amount = input.amount ?? 1;
    const currency = input.currency;
    const reference = makeWalletReference("CARD");
    const email =
      session.user.email?.trim() || `admin+${session.user.id}@okadago.local`;

    await prisma.savedPaymentMethod.create({
      data: {
        userId: session.userId,
        channel: SavedPaymentChannel.CARD,
        status: SavedPaymentStatus.PENDING,
        provider: "paystack",
        label: input.label ?? null,
        emailUsed: email,
        linkReference: reference,
        reusable: false
      }
    });

    const paystackResponse = await fetch(`${appConfig.paystackBaseUrl}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${appConfig.paystackSecretKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        amount: String(toSubunit(amount)),
        currency,
        reference,
        callback_url: `${appConfig.apiPublicUrl}/v1/payments/methods/paystack/callback`,
        channels: ["card"],
        metadata: JSON.stringify({
          purpose: "admin_card_vault",
          userId: session.user.id,
          label: input.label ?? null
        })
      })
    });

    if (!paystackResponse.ok) {
      await prisma.savedPaymentMethod.updateMany({
        where: { linkReference: reference },
        data: { status: SavedPaymentStatus.REVOKED, revokedAt: new Date() }
      });
      const message = await paystackResponse.text();
      throw new AppError(message || "Unable to initialize card link", 502, "PAYSTACK_INITIALIZE_FAILED");
    }

    const payload = (await paystackResponse.json()) as PaystackInitializeResponse;
    if (!payload.status || !payload.data.authorization_url) {
      throw new AppError(
        payload.message || "Unable to initialize card link",
        502,
        "PAYSTACK_INITIALIZE_FAILED"
      );
    }

    return {
      reference,
      authorizationUrl: payload.data.authorization_url,
      accessCode: payload.data.access_code,
      amount,
      currency
    };
  }

  async handleCardVaultCallback(reference: string) {
    const redirectBase = `${appConfig.appWebUrl}/payment-methods`;
    const fail = (reason: string) =>
      `${redirectBase}?vault=failed&reference=${encodeURIComponent(reference)}&reason=${encodeURIComponent(reason)}`;
    const ok = () => `${redirectBase}?vault=success&reference=${encodeURIComponent(reference)}`;

    if (!appConfig.paystackSecretKey) {
      return fail("Paystack is not configured");
    }

    const pending = await prisma.savedPaymentMethod.findUnique({
      where: { linkReference: reference }
    });
    if (!pending || pending.channel !== SavedPaymentChannel.CARD) {
      return fail("Card link reference was not found");
    }
    if (pending.status === SavedPaymentStatus.ACTIVE) {
      return ok();
    }

    const verifyResponse = await fetch(
      `${appConfig.paystackBaseUrl}/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${appConfig.paystackSecretKey}` } }
    );
    if (!verifyResponse.ok) {
      await prisma.savedPaymentMethod.update({
        where: { id: pending.id },
        data: { status: SavedPaymentStatus.REVOKED, revokedAt: new Date() }
      });
      return fail("Unable to verify the card payment");
    }

    const payload = (await verifyResponse.json()) as PaystackVerifyResponse;
    const auth = payload.data.authorization;
    if (!payload.status || payload.data.status !== "success" || !auth?.authorization_code) {
      await prisma.savedPaymentMethod.update({
        where: { id: pending.id },
        data: { status: SavedPaymentStatus.REVOKED, revokedAt: new Date() }
      });
      return fail("Card authorization was not completed");
    }

    const reusable = Boolean(auth.reusable);
    const hasActive = await prisma.savedPaymentMethod.count({
      where: {
        userId: pending.userId,
        status: SavedPaymentStatus.ACTIVE,
        revokedAt: null,
        NOT: { id: pending.id }
      }
    });

    await prisma.$transaction(async (tx) => {
      if (hasActive === 0) {
        // first active becomes default
      } else {
        // keep existing defaults
      }
      await tx.savedPaymentMethod.update({
        where: { id: pending.id },
        data: {
          status: SavedPaymentStatus.ACTIVE,
          paystackAuthCode: auth.authorization_code,
          paystackCustomerCode: payload.data.customer?.customer_code ?? null,
          cardLast4: auth.last4 ?? null,
          cardBrand: auth.brand || auth.card_type || "Card",
          cardExpMonth: auth.exp_month != null ? String(auth.exp_month) : null,
          cardExpYear: auth.exp_year != null ? String(auth.exp_year) : null,
          cardSignature: auth.signature ?? null,
          reusable,
          isDefault: hasActive === 0,
          label:
            pending.label ||
            (auth.last4 ? `${auth.brand || "Card"} ending in ${auth.last4}` : pending.label)
        }
      });
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: pending.userId,
        actorRole: "ADMIN",
        action: "PAYMENT_METHOD_CARD_LINKED",
        entityType: "SavedPaymentMethod",
        entityId: pending.id,
        changes: {
          last4: auth.last4,
          brand: auth.brand,
          reusable,
          charged: fromSubunit(payload.data.amount ?? 0)
        }
      }
    });

    return ok();
  }

  async createManualMethod(token: string, input: CreateManualPaymentMethodInput) {
    const session = await this.requireAdmin(token);
    const channel =
      input.channel === "paypal" ? SavedPaymentChannel.PAYPAL : SavedPaymentChannel.MOBILE_MONEY;

    const hasActive = await prisma.savedPaymentMethod.count({
      where: { userId: session.userId, status: SavedPaymentStatus.ACTIVE, revokedAt: null }
    });

    const row = await prisma.savedPaymentMethod.create({
      data: {
        userId: session.userId,
        channel,
        status: SavedPaymentStatus.ACTIVE,
        provider: channel === SavedPaymentChannel.PAYPAL ? "paypal" : "momo",
        label: input.label ?? null,
        momoPhone: input.momoPhone ?? null,
        momoProvider: input.momoProvider ?? null,
        paypalEmail: input.paypalEmail ?? null,
        emailUsed: input.paypalEmail ?? session.user.email,
        reusable: false,
        isDefault: hasActive === 0
      }
    });

    return { method: serializeMethod(row) };
  }

  async setDefault(token: string, methodId: string) {
    const session = await this.requireAdmin(token);
    const method = await prisma.savedPaymentMethod.findFirst({
      where: {
        id: methodId,
        userId: session.userId,
        status: SavedPaymentStatus.ACTIVE,
        revokedAt: null
      }
    });
    if (!method) {
      throw new AppError("Payment method not found", 404, "PAYMENT_METHOD_NOT_FOUND");
    }

    await prisma.$transaction([
      prisma.savedPaymentMethod.updateMany({
        where: { userId: session.userId, revokedAt: null },
        data: { isDefault: false }
      }),
      prisma.savedPaymentMethod.update({
        where: { id: method.id },
        data: { isDefault: true }
      })
    ]);

    return { methodId, isDefault: true };
  }

  async revokeMethod(token: string, methodId: string) {
    const session = await this.requireAdmin(token);
    const method = await prisma.savedPaymentMethod.findFirst({
      where: { id: methodId, userId: session.userId, revokedAt: null }
    });
    if (!method) {
      throw new AppError("Payment method not found", 404, "PAYMENT_METHOD_NOT_FOUND");
    }

    await prisma.savedPaymentMethod.update({
      where: { id: method.id },
      data: {
        status: SavedPaymentStatus.REVOKED,
        revokedAt: new Date(),
        isDefault: false,
        paystackAuthCode: null
      }
    });

    if (method.isDefault) {
      const next = await prisma.savedPaymentMethod.findFirst({
        where: {
          userId: session.userId,
          status: SavedPaymentStatus.ACTIVE,
          revokedAt: null
        },
        orderBy: { createdAt: "desc" }
      });
      if (next) {
        await prisma.savedPaymentMethod.update({
          where: { id: next.id },
          data: { isDefault: true }
        });
      }
    }

    return { revoked: true, methodId };
  }

  async chargeMethod(token: string, methodId: string, input: ChargeSavedMethodInput) {
    const session = await this.requireAdmin(token);
    if (!appConfig.paystackSecretKey) {
      throw new AppError("Paystack is not configured", 503, "PAYSTACK_NOT_CONFIGURED");
    }

    const method = await prisma.savedPaymentMethod.findFirst({
      where: {
        id: methodId,
        userId: session.userId,
        status: SavedPaymentStatus.ACTIVE,
        revokedAt: null
      }
    });
    if (!method?.paystackAuthCode || !method.reusable) {
      throw new AppError(
        "This payment method cannot be charged (no reusable Paystack authorization)",
        400,
        "PAYMENT_METHOD_NOT_CHARGEABLE"
      );
    }

    const email = method.emailUsed || session.user.email || `admin+${session.user.id}@okadago.local`;
    const reference = makeWalletReference("CHG");

    const response = await fetch(`${appConfig.paystackBaseUrl}/transaction/charge_authorization`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${appConfig.paystackSecretKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        authorization_code: method.paystackAuthCode,
        email,
        amount: String(toSubunit(input.amount)),
        currency: input.currency,
        reference,
        metadata: JSON.stringify({
          purpose: "admin_saved_method_charge",
          methodId: method.id,
          description: input.description ?? null
        })
      })
    });

    const payload = (await response.json()) as PaystackChargeResponse;
    if (!response.ok || !payload.status) {
      throw new AppError(
        payload.message || "Charge authorization failed",
        502,
        "PAYSTACK_CHARGE_FAILED"
      );
    }

    await prisma.auditLog.create({
      data: {
        actorUserId: session.userId,
        actorRole: "ADMIN",
        action: "PAYMENT_METHOD_CHARGED",
        entityType: "SavedPaymentMethod",
        entityId: method.id,
        changes: {
          reference: payload.data?.reference ?? reference,
          amount: input.amount,
          currency: input.currency,
          status: payload.data?.status ?? null
        }
      }
    });

    return {
      reference: payload.data?.reference ?? reference,
      status: payload.data?.status ?? "unknown",
      amount: input.amount,
      currency: input.currency
    };
  }
}
