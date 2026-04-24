import { AppError } from "../../common/errors.js";
import { hashPassword, makeSessionToken, verifyPassword } from "../../common/auth.js";
import { prisma } from "../../common/prisma.js";
import { makeReferralCode, makeRiderCode } from "../../common/codes.js";
import {
  AccountStatus,
  PaymentMethod,
  RiderApprovalStatus,
  UserRole,
  VehicleStatus,
  WalletType
} from "../../generated/prisma/enums.js";
import type {
  adminLoginSchema,
  adminPromoteSchema,
  adminRegisterSchema,
  passengerLoginSchema,
  passengerSettingsUpdateSchema,
  passengerSignupSchema,
  riderLoginSchema,
  riderSignupSchema
} from "./auth.schemas.js";
import type { z } from "zod";

type PassengerSignupInput = z.infer<typeof passengerSignupSchema>;
type RiderSignupInput = z.infer<typeof riderSignupSchema>;
type AdminRegisterInput = z.infer<typeof adminRegisterSchema>;
type PassengerLoginInput = z.infer<typeof passengerLoginSchema>;
type RiderLoginInput = z.infer<typeof riderLoginSchema>;
type AdminLoginInput = z.infer<typeof adminLoginSchema>;
type AdminPromoteInput = z.infer<typeof adminPromoteSchema>;
type PassengerSettingsUpdateInput = z.infer<typeof passengerSettingsUpdateSchema>;
type UserWithProfiles = {
  id: string;
  role: { toLowerCase(): string };
  accountStatus: { toLowerCase(): string };
  fullName: string;
  email: string | null;
  phoneCountryCode: string;
  phoneLocal: string;
  phoneE164: string;
  preferredCurrency: string;
  passengerProfile?: { id: string } | null;
  riderProfile?: { id: string; approvalStatus: { toLowerCase(): string } } | null;
  adminProfile?: { id: string; title?: string | null; permissions?: unknown } | null;
  dispatcherProfile?: { id: string } | null;
};
type PassengerSettingsUser = UserWithProfiles & {
  passengerProfile?: {
    id: string;
    referralCode: string;
    defaultServiceCity: string | null;
    preferredPayment: PaymentMethod | null;
  } | null;
};

const sessionDurationMs = 1000 * 60 * 60 * 24 * 30;

function mapPaymentMethod(method?: PassengerSignupInput["preferredPayment"]) {
  if (!method) {
    return undefined;
  }

  return {
    cash: PaymentMethod.CASH,
    card: PaymentMethod.CARD,
    wallet: PaymentMethod.WALLET,
    mobile_money: PaymentMethod.MOBILE_MONEY
  }[method];
}

function makeExpiryDate() {
  return new Date(Date.now() + sessionDurationMs);
}

export class AuthService {
  async signupPassenger(input: PassengerSignupInput) {
    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        role: UserRole.PASSENGER,
        accountStatus: AccountStatus.ACTIVE,
        fullName: input.fullName,
        email: input.email,
        phoneCountryCode: input.phoneCountryCode,
        phoneLocal: input.phoneLocal,
        phoneE164: input.phoneE164,
        passwordHash,
        preferredCurrency: input.preferredCurrency,
        isPhoneVerified: true,
        passengerProfile: {
          create: {
            referralCode: makeReferralCode(),
            defaultServiceCity: input.defaultServiceCity,
            preferredPayment: mapPaymentMethod(input.preferredPayment)
          }
        },
        wallets: {
          create: [
            {
              type: WalletType.PASSENGER_CASHLESS,
              currency: input.preferredCurrency
            },
            {
              type: WalletType.PROMO_CREDIT,
              currency: input.preferredCurrency
            }
          ]
        }
      },
      include: {
        passengerProfile: true,
        riderProfile: true,
        adminProfile: true,
        dispatcherProfile: true
      }
    });

    return this.createSession(user.id, input.device);
  }

  async signupRider(input: RiderSignupInput) {
    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        role: UserRole.RIDER,
        accountStatus: AccountStatus.ACTIVE,
        fullName: input.fullName,
        email: input.email,
        phoneCountryCode: input.phoneCountryCode,
        phoneLocal: input.phoneLocal,
        phoneE164: input.phoneE164,
        passwordHash,
        preferredCurrency: input.preferredCurrency,
        isPhoneVerified: true,
        riderProfile: {
          create: {
            displayCode: makeRiderCode(),
            approvalStatus: RiderApprovalStatus.PENDING,
            city: input.city,
            serviceZoneId: input.serviceZoneId,
            commissionPercent: input.commissionPercent,
            vehicle: input.vehicle
              ? {
                  create: {
                    make: input.vehicle.make,
                    model: input.vehicle.model,
                    plateNumber: input.vehicle.plateNumber,
                    color: input.vehicle.color,
                    year: input.vehicle.year,
                    status: VehicleStatus.ACTIVE
                  }
                }
              : undefined
          }
        },
        wallets: {
          create: [
            {
              type: WalletType.RIDER_SETTLEMENT,
              currency: input.preferredCurrency
            },
            {
              type: WalletType.RIDER_BONUS,
              currency: input.preferredCurrency
            }
          ]
        }
      },
      include: {
        passengerProfile: true,
        riderProfile: true,
        adminProfile: true,
        dispatcherProfile: true
      }
    });

    return this.createSession(user.id, input.device);
  }

  async registerAdmin(input: AdminRegisterInput) {
    const user = await this.createAdminAccount(input);
    return this.createSession(user.id, input.device);
  }

  async listAdmins(token: string) {
    await this.requireAdminSession(token);

    const admins = await prisma.adminProfile.findMany({
      orderBy: {
        createdAt: "desc"
      },
      include: {
        user: true
      }
    });

    return admins.map((admin) => ({
      id: admin.id,
      title: admin.title,
      permissions: Array.isArray(admin.permissions) ? admin.permissions : [],
      createdAt: admin.createdAt.toISOString(),
      user: {
        id: admin.user.id,
        fullName: admin.user.fullName,
        email: admin.user.email,
        phoneE164: admin.user.phoneE164,
        preferredCurrency: admin.user.preferredCurrency,
        accountStatus: admin.user.accountStatus.toLowerCase()
      }
    }));
  }

  async createAdminByAdmin(token: string, input: AdminRegisterInput) {
    await this.requireAdminSession(token);
    const user = await this.createAdminAccount(input);

    return {
      user: this.serializeUser(user),
      admin: {
        title: user.adminProfile?.title ?? null,
        permissions: Array.isArray(user.adminProfile?.permissions)
          ? user.adminProfile?.permissions
          : []
      }
    };
  }

  async promotePassengerToAdminByAdmin(token: string, input: AdminPromoteInput) {
    await this.requireAdminSession(token);

    const passengerUser = await prisma.user.findUnique({
      where: {
        id: input.passengerUserId
      },
      include: {
        passengerProfile: true,
        riderProfile: true,
        adminProfile: true,
        dispatcherProfile: true
      }
    });

    if (!passengerUser || passengerUser.deletedAt) {
      throw new AppError("Passenger account not found", 404, "PASSENGER_NOT_FOUND");
    }

    if (passengerUser.role !== UserRole.PASSENGER || !passengerUser.passengerProfile) {
      throw new AppError(
        "Only existing passenger accounts can be promoted with this action",
        400,
        "PASSENGER_PROMOTION_NOT_ALLOWED"
      );
    }

    if (passengerUser.adminProfile) {
      throw new AppError("This passenger already has admin access", 409, "ADMIN_ALREADY_EXISTS");
    }

    const conflictingUser = await prisma.user.findFirst({
      where: {
        id: {
          not: passengerUser.id
        },
        email: input.email,
        deletedAt: null
      },
      select: {
        id: true
      }
    });

    if (conflictingUser) {
      throw new AppError("Another account already uses that email", 409, "EMAIL_ALREADY_IN_USE");
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.update({
      where: {
        id: passengerUser.id
      },
      data: {
        role: UserRole.ADMIN,
        accountStatus: AccountStatus.ACTIVE,
        email: input.email,
        passwordHash,
        isEmailVerified: true,
        adminProfile: {
          create: {
            title: input.title,
            permissions: input.permissions
          }
        }
      },
      include: {
        passengerProfile: true,
        riderProfile: true,
        adminProfile: true,
        dispatcherProfile: true
      }
    });

    return {
      user: this.serializeUser(user),
      admin: {
        title: user.adminProfile?.title ?? null,
        permissions: Array.isArray(user.adminProfile?.permissions)
          ? user.adminProfile?.permissions
          : []
      }
    };
  }

  private async createAdminAccount(input: AdminRegisterInput) {
    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        role: UserRole.ADMIN,
        accountStatus: AccountStatus.ACTIVE,
        fullName: input.fullName,
        email: input.email,
        phoneCountryCode: input.phoneCountryCode,
        phoneLocal: input.phoneLocal,
        phoneE164: input.phoneE164,
        passwordHash,
        preferredCurrency: input.preferredCurrency,
        isPhoneVerified: true,
        isEmailVerified: true,
        adminProfile: {
          create: {
            title: input.title,
            permissions: input.permissions
          }
        }
      },
      include: {
        passengerProfile: true,
        riderProfile: true,
        adminProfile: true,
        dispatcherProfile: true
      }
    });

    return user;
  }

  async loginPassenger(input: PassengerLoginInput) {
    return this.loginByRole(UserRole.PASSENGER, input, input.device);
  }

  async loginRider(input: RiderLoginInput) {
    return this.loginByRole(UserRole.RIDER, input, input.device);
  }

  async loginAdmin(input: AdminLoginInput) {
    const user = await prisma.user.findFirst({
      where: {
        role: UserRole.ADMIN,
        email: input.email,
        deletedAt: null
      },
      include: {
        passengerProfile: true,
        riderProfile: true,
        adminProfile: true,
        dispatcherProfile: true
      }
    });

    if (!user?.passwordHash) {
      throw new AppError("Invalid admin credentials", 401, "INVALID_CREDENTIALS");
    }

    const isValid = await verifyPassword(input.password, user.passwordHash);
    if (!isValid) {
      throw new AppError("Invalid admin credentials", 401, "INVALID_CREDENTIALS");
    }

    return this.createSession(user.id, input.device);
  }

  async getSessionByToken(token: string) {
    const session = await this.getActiveSession(token);
    await this.touchSession(session.id);

    return {
      token,
      expiresAt: session.expiresAt.toISOString(),
      user: this.serializeUser(session.user)
    };
  }

  async getPassengerSettings(token: string) {
    const session = await this.getActiveSession(token);
    await this.touchSession(session.id);

    if (session.user.role !== UserRole.PASSENGER || !session.user.passengerProfile) {
      throw new AppError("Passenger access is required", 403, "PASSENGER_ACCESS_REQUIRED");
    }

    return this.serializePassengerSettings(session.user as PassengerSettingsUser);
  }

  async updatePassengerSettings(token: string, input: PassengerSettingsUpdateInput) {
    const session = await this.getActiveSession(token);

    if (session.user.role !== UserRole.PASSENGER || !session.user.passengerProfile) {
      throw new AppError("Passenger access is required", 403, "PASSENGER_ACCESS_REQUIRED");
    }

    const user = await prisma.user.update({
      where: {
        id: session.user.id
      },
      data: {
        fullName: input.fullName,
        email: input.email,
        passengerProfile: {
          update: {
            defaultServiceCity: input.defaultServiceCity,
            preferredPayment: mapPaymentMethod(input.preferredPayment ?? undefined) ?? null
          }
        }
      },
      include: {
        passengerProfile: true,
        riderProfile: true,
        adminProfile: true,
        dispatcherProfile: true
      }
    });

    await this.touchSession(session.id);

    return {
      token,
      expiresAt: session.expiresAt.toISOString(),
      user: this.serializeUser(user),
      settings: this.serializePassengerSettings(user as PassengerSettingsUser)
    };
  }

  async logout(token: string) {
    const session = await prisma.userSession.findUnique({
      where: {
        refreshTokenId: token
      }
    });

    if (!session) {
      return {
        revoked: false
      };
    }

    await prisma.userSession.update({
      where: {
        id: session.id
      },
      data: {
        revokedAt: new Date()
      }
    });

    return {
      revoked: true
    };
  }

  private async loginByRole(
    role: "PASSENGER" | "RIDER",
    input: PassengerLoginInput | RiderLoginInput,
    device?: PassengerLoginInput["device"]
  ) {
    const user = await prisma.user.findFirst({
      where: {
        role,
        deletedAt: null,
        OR: [
          input.phoneE164 ? { phoneE164: input.phoneE164 } : undefined,
          input.phoneLocal ? { phoneLocal: input.phoneLocal } : undefined
        ].filter(Boolean) as Array<{ phoneE164?: string; phoneLocal?: string }>
      },
      include: {
        passengerProfile: true,
        riderProfile: true,
        adminProfile: true,
        dispatcherProfile: true
      }
    });

    if (!user?.passwordHash) {
      throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    const isValid = await verifyPassword(input.password, user.passwordHash);
    if (!isValid) {
      throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    return this.createSession(user.id, device);
  }

  private async createSession(
    userId: string,
    device?: {
      deviceId?: string;
      platform?: string;
      userAgent?: string;
    }
  ) {
    const token = makeSessionToken();
    const expiresAt = makeExpiryDate();

    const session = await prisma.userSession.create({
      data: {
        userId,
        refreshTokenId: token,
        userAgent: device?.userAgent,
        expiresAt,
        lastUsedAt: new Date()
      },
      include: {
        user: {
          include: {
            passengerProfile: true,
            riderProfile: true,
            adminProfile: true,
            dispatcherProfile: true
          }
        }
      }
    });

    if (device?.deviceId && device.platform) {
      await prisma.userDevice.upsert({
        where: {
          userId_deviceId: {
            userId,
            deviceId: device.deviceId
          }
        },
        update: {
          platform: device.platform,
          lastSeenAt: new Date()
        },
        create: {
          userId,
          deviceId: device.deviceId,
          platform: device.platform,
          lastSeenAt: new Date()
        }
      });
    }

    await prisma.user.update({
      where: {
        id: userId
      },
      data: {
        lastSeenAt: new Date()
      }
    });

    return {
      token,
      expiresAt: expiresAt.toISOString(),
      user: this.serializeUser(session.user)
    };
  }

  private async getActiveSession(token: string) {
    const session = await prisma.userSession.findUnique({
      where: {
        refreshTokenId: token
      },
      include: {
        user: {
          include: {
            passengerProfile: true,
            riderProfile: true,
            adminProfile: true,
            dispatcherProfile: true
          }
        }
      }
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new AppError("Session is invalid or expired", 401, "SESSION_INVALID");
    }

    return session;
  }

  private async requireAdminSession(token: string) {
    const session = await this.getActiveSession(token);

    if (session.user.role !== UserRole.ADMIN || !session.user.adminProfile) {
      throw new AppError("Admin access is required", 403, "ADMIN_ACCESS_REQUIRED");
    }

    await this.touchSession(session.id);

    return session;
  }

  private async touchSession(sessionId: string) {
    await prisma.userSession.update({
      where: {
        id: sessionId
      },
      data: {
        lastUsedAt: new Date()
      }
    });
  }

  private serializeUser(user: UserWithProfiles) {
    return {
      id: user.id,
      role: user.role.toLowerCase(),
      accountStatus: user.accountStatus.toLowerCase(),
      fullName: user.fullName,
      email: user.email,
      phoneCountryCode: user.phoneCountryCode,
      phoneLocal: user.phoneLocal,
      phoneE164: user.phoneE164,
      preferredCurrency: user.preferredCurrency,
      passengerProfileId: user.passengerProfile?.id ?? null,
      riderProfileId: user.riderProfile?.id ?? null,
      riderApprovalStatus: user.riderProfile?.approvalStatus.toLowerCase() ?? null,
      adminProfileId: user.adminProfile?.id ?? null,
      dispatcherProfileId: user.dispatcherProfile?.id ?? null
    };
  }

  private serializePassengerSettings(user: PassengerSettingsUser) {
    return {
      fullName: user.fullName,
      email: user.email,
      phoneCountryCode: user.phoneCountryCode,
      phoneLocal: user.phoneLocal,
      phoneE164: user.phoneE164,
      preferredCurrency: user.preferredCurrency,
      defaultServiceCity: user.passengerProfile?.defaultServiceCity ?? null,
      preferredPayment: user.passengerProfile?.preferredPayment?.toLowerCase() ?? null,
      referralCode: user.passengerProfile?.referralCode ?? null
    };
  }
}
