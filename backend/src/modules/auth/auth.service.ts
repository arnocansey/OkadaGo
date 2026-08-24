import { randomBytes } from "node:crypto";
import { AppError } from "../../common/errors.js";
import { isTokenLocallyRevoked, revokeTokenLocally } from "../../common/token-revocation.js";
import { hashPassword, makeSessionToken, verifyPassword } from "../../common/auth.js";
import { buildOtpAuthUrl, generateTotpSecret, verifyTotpCode } from "../../common/totp.js";
import { appConfig } from "../../common/config.js";
import { prisma } from "../../common/prisma.js";
import { makeReferralCode, makeRiderCode } from "../../common/codes.js";
import {
  AccountStatus,
  JobPreference,
  PaymentMethod,
  RiderApprovalStatus,
  UserRole,
  VehicleStatus,
  VehicleType,
  WalletType
} from "../../generated/prisma/enums.js";
import type {
  adminChangePasswordSchema,
  adminLoginSchema,
  adminProfileUpdateSchema,
  adminPromoteSchema,
  adminRegisterSchema,
  otpRequestSchema,
  otpVerifySchema,
  passengerLoginSchema,
  passengerSettingsUpdateSchema,
  passengerSignupSchema,
  riderLoginSchema,
  riderSettingsUpdateSchema,
  riderSignupSchema,
  riderVehicleUpdateSchema
} from "./auth.schemas.js";
import type { avatarUploadSchema, forgotPasswordSchema, resetPasswordSchema } from "./auth.schemas.js";
import type { z } from "zod";
import { hasSmsConfig, smsService } from "../notifications/sms.service.js";
import { makeOtpCode, storeOtp, verifyStoredOtp } from "./otp-store.js";
import { v2 as cloudinary } from "cloudinary";

type PassengerSignupInput = z.infer<typeof passengerSignupSchema>;
type RiderSignupInput = z.infer<typeof riderSignupSchema>;
type AdminRegisterInput = z.infer<typeof adminRegisterSchema>;
type PassengerLoginInput = z.infer<typeof passengerLoginSchema>;
type RiderLoginInput = z.infer<typeof riderLoginSchema>;
type AdminLoginInput = z.infer<typeof adminLoginSchema>;
type AdminPromoteInput = z.infer<typeof adminPromoteSchema>;
type PassengerSettingsUpdateInput = z.infer<typeof passengerSettingsUpdateSchema>;
type RiderSettingsUpdateInput = z.infer<typeof riderSettingsUpdateSchema>;
type RiderVehicleUpdateInput = z.infer<typeof riderVehicleUpdateSchema>;
type AvatarUploadInput = z.infer<typeof avatarUploadSchema>;
type OtpRequestInput = z.infer<typeof otpRequestSchema>;
type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
type AdminChangePasswordInput = z.infer<typeof adminChangePasswordSchema>;
type AdminProfileUpdateInput = z.infer<typeof adminProfileUpdateSchema>;
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
  avatarUrl?: string | null;
  createdAt?: Date;
  isPhoneVerified?: boolean;
  isEmailVerified?: boolean;
  passengerProfile?: { id: string } | null;
  riderProfile?: { id: string; approvalStatus: { toLowerCase(): string } } | null;
  adminProfile?: { id: string; title?: string | null; permissions?: unknown } | null;
  dispatcherProfile?: { id: string } | null;
};

function describeUserAgent(userAgent?: string | null) {
  if (!userAgent) return "Unknown device";
  const ua = userAgent.toLowerCase();
  const browser = ua.includes("edg/")
    ? "Edge"
    : ua.includes("chrome")
      ? "Chrome"
      : ua.includes("firefox")
        ? "Firefox"
        : ua.includes("safari")
          ? "Safari"
          : "Browser";
  const os = ua.includes("windows")
    ? "Windows"
    : ua.includes("mac os") || ua.includes("macintosh")
      ? "macOS"
      : ua.includes("android")
        ? "Android"
        : ua.includes("iphone") || ua.includes("ipad")
          ? "iOS"
          : ua.includes("linux")
            ? "Linux"
            : "Device";
  return `${browser} on ${os}`;
}

function formatRelativeTime(date: Date) {
  const deltaMs = Date.now() - date.getTime();
  const minutes = Math.floor(deltaMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toISOString().slice(0, 10);
}
type PassengerSettingsUser = UserWithProfiles & {
  passengerProfile?: {
    id: string;
    referralCode: string;
    defaultServiceCity: string | null;
    preferredPayment: PaymentMethod | null;
  } | null;
};
type RiderSettingsUser = UserWithProfiles & {
  riderProfile?: {
    id: string;
    displayCode: string;
    city: string | null;
    approvalStatus: { toLowerCase(): string };
    ratingAverage: { toString(): string } | number;
    commissionPercent: { toString(): string } | number;
    completedTrips: number;
    jobPreference: { toLowerCase(): string };
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

function mapJobPreference(preference: RiderSignupInput["jobPreference"]) {
  return {
    rides_only: JobPreference.RIDES_ONLY,
    delivery_only: JobPreference.DELIVERY_ONLY,
    both: JobPreference.BOTH
  }[preference];
}

function mapVehicleType(vehicleType?: NonNullable<RiderSignupInput["vehicle"]>["vehicleType"]) {
  return {
    okada: VehicleType.OKADA,
    tricycle: VehicleType.TRICYCLE,
    bicycle: VehicleType.BICYCLE
  }[vehicleType ?? "okada"];
}

if (appConfig.cloudinaryCloudName && appConfig.cloudinaryApiKey && appConfig.cloudinaryApiSecret) {
  cloudinary.config({
    cloud_name: appConfig.cloudinaryCloudName,
    api_key: appConfig.cloudinaryApiKey,
    api_secret: appConfig.cloudinaryApiSecret,
  });
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
        isPhoneVerified: false,
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
        isPhoneVerified: false,
        riderProfile: {
          create: {
            displayCode: makeRiderCode(),
            approvalStatus: RiderApprovalStatus.PENDING,
            city: input.city,
            serviceZoneId: input.serviceZoneId,
            commissionPercent: input.commissionPercent,
            jobPreference: mapJobPreference(input.jobPreference),
            vehicle: input.vehicle
              ? {
                  create: {
                    make: input.vehicle.make,
                    model: input.vehicle.model,
                    plateNumber: input.vehicle.plateNumber,
                    color: input.vehicle.color,
                    year: input.vehicle.year,
                    vehicleType: mapVehicleType(input.vehicle.vehicleType),
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
      where: { user: { deletedAt: null } },
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
    const digits = input.phoneE164.replace(/\D/g, "");
    const phoneCountryCode = input.phoneCountryCode || "+233";
    const phoneLocal =
      input.phoneLocal ||
      (digits.startsWith("233") ? digits.slice(3) : digits.startsWith("0") ? digits.slice(1) : digits);
    const phoneE164 = input.phoneE164.startsWith("+") ? input.phoneE164 : `+233${phoneLocal}`;
    const email = input.email && input.email.trim() ? input.email.trim() : null;

    const existingPhone = await prisma.user.findFirst({
      where: { phoneE164, deletedAt: null }
    });
    if (existingPhone) {
      throw new AppError("An account with this phone number already exists.", 409, "PHONE_EXISTS");
    }

    if (email) {
      const existingEmail = await prisma.user.findFirst({
        where: { email, deletedAt: null }
      });
      if (existingEmail) {
        throw new AppError("An account with this email address already exists.", 409, "EMAIL_EXISTS");
      }
    }

    const user = await prisma.user.create({
      data: {
        role: UserRole.ADMIN,
        accountStatus: AccountStatus.ACTIVE,
        fullName: input.fullName,
        email,
        phoneCountryCode,
        phoneLocal,
        phoneE164,
        passwordHash,
        preferredCurrency: input.preferredCurrency ?? "GHS",
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

    if (user.adminProfile?.totpEnabled && user.adminProfile.totpSecret) {
      const usedBackup = input.backupCode
        ? await this.consumeBackupCode(user.adminProfile.id, input.backupCode)
        : false;

      if (!usedBackup) {
        if (!input.totpCode) {
          throw new AppError(
            "A two-factor authentication code or backup code is required",
            401,
            "TOTP_REQUIRED"
          );
        }
        if (!verifyTotpCode(user.adminProfile.totpSecret, input.totpCode)) {
          throw new AppError("Invalid two-factor authentication code", 401, "TOTP_INVALID");
        }
      }
    }

    const created = await this.createSession(user.id, input.device);

    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        actorRole: "ADMIN",
        action: "ADMIN_LOGIN",
        entityType: "UserSession",
        entityId: user.id,
        userAgent: input.device?.userAgent ?? null,
        changes: {
          email: user.email,
          usedBackupCode: Boolean(input.backupCode)
        }
      }
    });

    return created;
  }

  private normalizeBackupCode(code: string) {
    return code.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  }

  private makeBackupCode() {
    return randomBytes(4).toString("hex").toUpperCase().replace(/(.{4})(.{4})/, "$1-$2");
  }

  private async consumeBackupCode(adminProfileId: string, rawCode: string) {
    const profile = await prisma.adminProfile.findUnique({ where: { id: adminProfileId } });
    const hashes = Array.isArray(profile?.totpBackupCodeHashes)
      ? (profile?.totpBackupCodeHashes as string[])
      : [];
    if (hashes.length === 0) return false;

    const normalized = this.normalizeBackupCode(rawCode);
    for (let i = 0; i < hashes.length; i += 1) {
      const hash = hashes[i];
      if (typeof hash !== "string") continue;
      if (await verifyPassword(normalized, hash)) {
        const next = hashes.filter((_, idx) => idx !== i);
        await prisma.adminProfile.update({
          where: { id: adminProfileId },
          data: { totpBackupCodeHashes: next }
        });
        return true;
      }
    }
    return false;
  }

  async generateAdminBackupCodes(token: string, code: string) {
    const session = await this.requireAdminSession(token);
    const profile = session.user.adminProfile;
    if (!profile?.totpEnabled || !profile.totpSecret) {
      throw new AppError("Enable authenticator 2FA before generating backup codes", 400, "TOTP_REQUIRED");
    }
    if (!verifyTotpCode(profile.totpSecret, code)) {
      throw new AppError("Invalid two-factor authentication code", 401, "TOTP_INVALID");
    }

    const codes = Array.from({ length: 10 }, () => this.makeBackupCode());
    const hashes = await Promise.all(
      codes.map((value) => hashPassword(this.normalizeBackupCode(value)))
    );

    await prisma.adminProfile.update({
      where: { id: profile.id },
      data: {
        totpBackupCodeHashes: hashes,
        totpBackupCodesGeneratedAt: new Date()
      }
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.userId,
        actorRole: "ADMIN",
        action: "ADMIN_2FA_BACKUP_CODES_GENERATED",
        entityType: "AdminProfile",
        entityId: profile.id,
        changes: { count: codes.length }
      }
    });

    return {
      codes,
      generatedAt: new Date().toISOString(),
      remaining: codes.length
    };
  }

  async getAdminBackupCodeStatus(token: string) {
    const session = await this.requireAdminSession(token);
    const hashes = Array.isArray(session.user.adminProfile?.totpBackupCodeHashes)
      ? (session.user.adminProfile?.totpBackupCodeHashes as string[])
      : [];
    return {
      remaining: hashes.length,
      generatedAt:
        (session.user.adminProfile as { totpBackupCodesGeneratedAt?: Date | null } | null)
          ?.totpBackupCodesGeneratedAt?.toISOString?.() ?? null
    };
  }

  async softDeleteAdmin(token: string, userId: string) {
    const session = await this.requireAdminSession(token);
    if (session.userId === userId) {
      throw new AppError("You cannot delete your own admin account", 400, "CANNOT_DELETE_SELF");
    }

    const target = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: { adminProfile: true }
    });
    if (!target) {
      throw new AppError("Account not found", 404, "ACCOUNT_NOT_FOUND");
    }

    if (target.role === UserRole.ADMIN) {
      const remaining = await prisma.user.count({
        where: { role: UserRole.ADMIN, deletedAt: null, NOT: { id: userId } }
      });
      if (remaining < 1) {
        throw new AppError("Cannot delete the last admin account", 400, "LAST_ADMIN");
      }
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { deletedAt: new Date(), accountStatus: AccountStatus.SUSPENDED }
      }),
      prisma.userSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() }
      })
    ]);

    await prisma.auditLog.create({
      data: {
        actorUserId: session.userId,
        actorRole: "ADMIN",
        action: "ADMIN_SOFT_DELETE",
        entityType: "User",
        entityId: userId
      }
    });

    return { deleted: true, userId };
  }

  /** Generates (or regenerates) a TOTP secret; 2FA only activates after enableAdminTotp verifies a code. */
  async setupAdminTotp(token: string) {
    const session = await this.getActiveSession(token);
    if (!session.user.adminProfile) {
      throw new AppError("Admin access is required", 403, "ADMIN_ACCESS_REQUIRED");
    }

    const secret = generateTotpSecret();
    await prisma.adminProfile.update({
      where: { id: session.user.adminProfile.id },
      data: { totpSecret: secret, totpEnabled: false }
    });

    return {
      secret,
      otpauthUrl: buildOtpAuthUrl(secret, session.user.email ?? session.user.phoneE164)
    };
  }

  async enableAdminTotp(token: string, code: string) {
    const session = await this.getActiveSession(token);
    const profile = session.user.adminProfile;
    if (!profile) {
      throw new AppError("Admin access is required", 403, "ADMIN_ACCESS_REQUIRED");
    }
    if (!profile.totpSecret) {
      throw new AppError("Run 2FA setup first", 400, "TOTP_NOT_SET_UP");
    }
    if (!verifyTotpCode(profile.totpSecret, code)) {
      throw new AppError("Invalid two-factor authentication code", 401, "TOTP_INVALID");
    }

    await prisma.adminProfile.update({
      where: { id: profile.id },
      data: { totpEnabled: true }
    });

    return { totpEnabled: true };
  }

  async disableAdminTotp(token: string, code: string) {
    const session = await this.getActiveSession(token);
    const profile = session.user.adminProfile;
    if (!profile) {
      throw new AppError("Admin access is required", 403, "ADMIN_ACCESS_REQUIRED");
    }
    if (!profile.totpEnabled || !profile.totpSecret) {
      throw new AppError("2FA is not enabled", 400, "TOTP_NOT_ENABLED");
    }
    if (!verifyTotpCode(profile.totpSecret, code)) {
      throw new AppError("Invalid two-factor authentication code", 401, "TOTP_INVALID");
    }

    await prisma.adminProfile.update({
      where: { id: profile.id },
      data: {
        totpEnabled: false,
        totpSecret: null,
        totpBackupCodeHashes: [],
        totpBackupCodesGeneratedAt: null
      }
    });

    return { totpEnabled: false };
  }

  async getAdminTotpStatus(token: string) {
    const session = await this.getActiveSession(token);
    if (!session.user.adminProfile) {
      throw new AppError("Admin access is required", 403, "ADMIN_ACCESS_REQUIRED");
    }
    const hashes = Array.isArray(session.user.adminProfile.totpBackupCodeHashes)
      ? (session.user.adminProfile.totpBackupCodeHashes as string[])
      : [];
    return {
      totpEnabled: session.user.adminProfile.totpEnabled,
      backupCodesRemaining: hashes.length
    };
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

  async getRiderSettings(token: string) {
    const session = await this.getActiveSession(token);
    await this.touchSession(session.id);

    if (session.user.role !== UserRole.RIDER || !session.user.riderProfile) {
      throw new AppError("Rider access is required", 403, "RIDER_ACCESS_REQUIRED");
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { riderId: session.user.riderProfile.id }
    });

    return {
      ...this.serializeRiderSettings(session.user as RiderSettingsUser),
      vehicle: vehicle
        ? {
            make: vehicle.make,
            model: vehicle.model,
            plateNumber: vehicle.plateNumber,
            color: vehicle.color,
            year: vehicle.year,
            insuranceNumber: vehicle.insuranceNumber,
            vehicleType: vehicle.vehicleType.toLowerCase()
          }
        : null
    };
  }

  async updateRiderSettings(token: string, input: RiderSettingsUpdateInput) {
    const session = await this.getActiveSession(token);

    if (session.user.role !== UserRole.RIDER || !session.user.riderProfile) {
      throw new AppError("Rider access is required", 403, "RIDER_ACCESS_REQUIRED");
    }

    const user = await prisma.user.update({
      where: {
        id: session.user.id
      },
      data: {
        fullName: input.fullName,
        email: input.email,
        riderProfile: {
          update: {
            city: input.city
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
      settings: this.serializeRiderSettings(user as RiderSettingsUser)
    };
  }

  async updateRiderVehicle(token: string, input: RiderVehicleUpdateInput) {
    const session = await this.getActiveSession(token);

    if (session.user.role !== UserRole.RIDER || !session.user.riderProfile) {
      throw new AppError("Rider access is required", 403, "RIDER_ACCESS_REQUIRED");
    }

    const existing = await prisma.vehicle.findUnique({
      where: { riderId: session.user.riderProfile.id }
    });

    if (!existing) {
      throw new AppError("No vehicle is registered for this rider yet.", 404, "VEHICLE_NOT_FOUND");
    }

    const vehicle = await prisma.vehicle.update({
      where: { id: existing.id },
      data: {
        make: input.make,
        model: input.model,
        plateNumber: input.plateNumber,
        color: input.color,
        year: input.year,
        insuranceNumber: input.insuranceNumber,
        vehicleType: input.vehicleType
          ? {
              okada: VehicleType.OKADA,
              tricycle: VehicleType.TRICYCLE,
              bicycle: VehicleType.BICYCLE
            }[input.vehicleType]
          : undefined
      }
    });

    await this.touchSession(session.id);

    return { vehicle };
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

    revokeTokenLocally(token);
    return {
      revoked: true
    };
  }

  async changeAdminPassword(token: string, input: AdminChangePasswordInput) {
    const session = await this.requireAdminSession(token);
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user?.passwordHash) {
      throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    const valid = await verifyPassword(input.currentPassword, user.passwordHash);
    if (!valid) {
      throw new AppError("Current password is incorrect", 401, "INVALID_CREDENTIALS");
    }

    if (input.newPassword.length < 8) {
      throw new AppError("Password must be at least 8 characters", 400, "PASSWORD_TOO_SHORT");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(input.newPassword) }
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        actorRole: "ADMIN",
        action: "ADMIN_PASSWORD_CHANGE",
        entityType: "User",
        entityId: user.id
      }
    });

    return { changed: true };
  }

  async updateAdminProfile(token: string, input: AdminProfileUpdateInput) {
    const session = await this.requireAdminSession(token);

    if (input.email && input.email !== session.user.email) {
      const taken = await prisma.user.findFirst({
        where: { email: input.email, deletedAt: null, NOT: { id: session.userId } },
        select: { id: true }
      });
      if (taken) {
        throw new AppError("Email is already in use", 409, "EMAIL_TAKEN");
      }
    }

    const nextPhoneE164 = input.phoneE164 ?? session.user.phoneE164;
    if (input.phoneE164 && input.phoneE164 !== session.user.phoneE164) {
      const taken = await prisma.user.findFirst({
        where: { phoneE164: input.phoneE164, deletedAt: null, NOT: { id: session.userId } },
        select: { id: true }
      });
      if (taken) {
        throw new AppError("Phone number is already in use", 409, "PHONE_TAKEN");
      }
    }

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: {
        fullName: input.fullName ?? undefined,
        email: input.email ?? undefined,
        phoneCountryCode: input.phoneCountryCode ?? undefined,
        phoneLocal: input.phoneLocal ?? undefined,
        phoneE164: nextPhoneE164,
        ...(input.phoneE164 && input.phoneE164 !== session.user.phoneE164
          ? { isPhoneVerified: false }
          : {})
      },
      include: {
        passengerProfile: true,
        riderProfile: true,
        adminProfile: true,
        dispatcherProfile: true
      }
    });

    if (input.title !== undefined && user.adminProfile) {
      await prisma.adminProfile.update({
        where: { id: user.adminProfile.id },
        data: { title: input.title }
      });
    }

    const refreshed = await prisma.user.findUniqueOrThrow({
      where: { id: session.userId },
      include: {
        passengerProfile: true,
        riderProfile: true,
        adminProfile: true,
        dispatcherProfile: true
      }
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: refreshed.id,
        actorRole: "ADMIN",
        action: "ADMIN_PROFILE_UPDATE",
        entityType: "User",
        entityId: refreshed.id,
        changes: {
          fullName: input.fullName,
          email: input.email,
          phoneE164: input.phoneE164,
          title: input.title
        }
      }
    });

    await this.touchSession(session.id);

    return {
      token,
      expiresAt: session.expiresAt.toISOString(),
      user: this.serializeUser(refreshed)
    };
  }

  async listAdminSessions(token: string) {
    const current = await this.requireAdminSession(token);
    const sessions = await prisma.userSession.findMany({
      where: {
        userId: current.userId,
        revokedAt: null,
        expiresAt: { gt: new Date() }
      },
      orderBy: { lastUsedAt: "desc" },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        lastUsedAt: true,
        createdAt: true,
        expiresAt: true,
        refreshTokenId: true
      }
    });

    return {
      sessions: sessions.map((row) => ({
        id: row.id,
        device: describeUserAgent(row.userAgent),
        detail: row.userAgent ?? "Unknown client",
        location: row.ipAddress ? `IP ${row.ipAddress}` : "Location unavailable",
        network: row.id === current.id ? "This device" : "Other session",
        lastActive: formatRelativeTime(row.lastUsedAt ?? row.createdAt),
        createdAt: row.createdAt.toISOString(),
        isCurrent: row.id === current.id
      }))
    };
  }

  async revokeAdminSession(token: string, sessionId: string) {
    const current = await this.requireAdminSession(token);
    if (sessionId === current.id) {
      throw new AppError("Use logout for the current session", 400, "CANNOT_REVOKE_CURRENT");
    }

    const target = await prisma.userSession.findFirst({
      where: { id: sessionId, userId: current.userId, revokedAt: null }
    });
    if (!target) {
      throw new AppError("Session not found", 404, "SESSION_NOT_FOUND");
    }

    await prisma.userSession.update({
      where: { id: target.id },
      data: { revokedAt: new Date() }
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: current.userId,
        actorRole: "ADMIN",
        action: "ADMIN_SESSION_REVOKE",
        entityType: "UserSession",
        entityId: target.id
      }
    });

    return { revoked: true, sessionId };
  }

  async logoutOtherAdminSessions(token: string) {
    const current = await this.requireAdminSession(token);
    const result = await prisma.userSession.updateMany({
      where: {
        userId: current.userId,
        revokedAt: null,
        NOT: { id: current.id }
      },
      data: { revokedAt: new Date() }
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: current.userId,
        actorRole: "ADMIN",
        action: "ADMIN_SESSION_REVOKE_OTHERS",
        entityType: "User",
        entityId: current.userId,
        changes: { count: result.count }
      }
    });

    return { revokedCount: result.count };
  }

  async listAdminLoginActivity(token: string) {
    const current = await this.requireAdminSession(token);
    const rows = await prisma.auditLog.findMany({
      where: {
        actorUserId: current.userId,
        action: {
          in: [
            "ADMIN_LOGIN",
            "ADMIN_PASSWORD_CHANGE",
            "ADMIN_SESSION_REVOKE",
            "ADMIN_SESSION_REVOKE_OTHERS",
            "ADMIN_PROFILE_UPDATE"
          ]
        }
      },
      orderBy: { createdAt: "desc" },
      take: 50
    });

    return {
      activity: rows.map((row) => ({
        id: row.id,
        action: row.action,
        status: "Success",
        method: row.action.includes("PASSWORD") ? "Password" : "Session",
        location: row.ipAddress ? `IP ${row.ipAddress}` : "Ghana",
        device: describeUserAgent(row.userAgent),
        createdAt: row.createdAt.toISOString(),
        time: formatRelativeTime(row.createdAt)
      }))
    };
  }

  async requestPhoneOtp(input: OtpRequestInput) {
    const user = await prisma.user.findFirst({
      where: {
        phoneE164: input.phoneE164,
        deletedAt: null
      },
      select: { id: true }
    });

    const code = makeOtpCode();
    storeOtp(input.phoneE164, code, user?.id);

    if (appConfig.nodeEnv === "production") {
      if (!hasSmsConfig()) {
        throw new AppError(
          "SMS delivery is not configured for production OTP requests",
          503,
          "SMS_NOT_CONFIGURED"
        );
      }

      await smsService.sendOtpSms({ to: input.phoneE164, code });
    } else {
      console.info(`[otp] code sent to ${input.phoneE164}`);
    }

    return {
      sent: true,
      expiresInSeconds: 600,
      ...(appConfig.nodeEnv !== "production" ? { debugCode: code } : {})
    };
  }

  async verifyPhoneOtp(input: OtpVerifyInput) {
    const entry = verifyStoredOtp(input.phoneE164, input.code);
    if (!entry) {
      throw new AppError("Invalid or expired verification code", 400, "OTP_INVALID");
    }

    const user = await prisma.user.findFirst({
      where: {
        phoneE164: input.phoneE164,
        deletedAt: null
      }
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isPhoneVerified: true }
      });
    }

    return {
      verified: true,
      userId: user?.id ?? entry.userId ?? null
    };
  }

  async uploadAvatar(token: string, input: AvatarUploadInput) {
    const session = await this.getActiveSession(token);

    if (!appConfig.cloudinaryCloudName || !appConfig.cloudinaryApiKey || !appConfig.cloudinaryApiSecret) {
      throw new AppError("Avatar uploads are not configured", 503, "CLOUDINARY_NOT_CONFIGURED");
    }

    const dataUri = input.imageBase64.startsWith("data:")
      ? input.imageBase64
      : `data:image/jpeg;base64,${input.imageBase64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "okadago/avatars",
      public_id: session.userId,
      overwrite: true,
      transformation: [
        { width: 400, height: 400, crop: "fill", gravity: "face" },
        { quality: "auto", fetch_format: "auto" }
      ]
    });

    const avatarUrl = result.secure_url;

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: { avatarUrl },
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
      user: this.serializeUser(user)
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
    if (isTokenLocallyRevoked(token)) {
      throw new AppError("Session is invalid or expired", 401, "SESSION_INVALID");
    }

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
      avatarUrl: user.avatarUrl ?? null,
      isPhoneVerified: (user as { isPhoneVerified?: boolean }).isPhoneVerified ?? false,
      isEmailVerified: (user as { isEmailVerified?: boolean }).isEmailVerified ?? false,
      createdAt: (user as { createdAt?: Date }).createdAt?.toISOString?.() ?? null,
      adminTitle: user.adminProfile?.title ?? null,
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
      avatarUrl: user.avatarUrl ?? null,
      defaultServiceCity: user.passengerProfile?.defaultServiceCity ?? null,
      preferredPayment: user.passengerProfile?.preferredPayment?.toLowerCase() ?? null,
      referralCode: user.passengerProfile?.referralCode ?? null
    };
  }

  private serializeRiderSettings(user: RiderSettingsUser) {
    return {
      fullName: user.fullName,
      email: user.email,
      phoneCountryCode: user.phoneCountryCode,
      phoneLocal: user.phoneLocal,
      phoneE164: user.phoneE164,
      preferredCurrency: user.preferredCurrency,
      avatarUrl: user.avatarUrl ?? null,
      city: user.riderProfile?.city ?? null,
      displayCode: user.riderProfile?.displayCode ?? null,
      approvalStatus: user.riderProfile?.approvalStatus.toLowerCase() ?? null,
      ratingAverage: user.riderProfile ? Number(user.riderProfile.ratingAverage) : 0,
      commissionPercent: user.riderProfile ? Number(user.riderProfile.commissionPercent) : 0,
      completedTrips: user.riderProfile?.completedTrips ?? 0,
      jobPreference: user.riderProfile?.jobPreference.toLowerCase() ?? null
    };
  }

  async getRiderFullProfile(token: string) {
    const session = await prisma.userSession.findUnique({
      where: { refreshTokenId: token },
      include: {
        user: {
          include: {
            riderProfile: {
              include: {
                vehicle: true
              }
            }
          }
        }
      }
    });

    if (!session || !session.user || !session.user.riderProfile) {
      throw new AppError("Rider profile not found", 404, "RIDER_PROFILE_NOT_FOUND");
    }

    const user = session.user;
    const profile = session.user.riderProfile;

    return {
      id: profile.id,
      okadaGoId: profile.displayCode ?? `OKD-${profile.id.slice(-6).toUpperCase()}`,
      fullName: user.fullName,
      phone: user.phoneE164,
      avatarUrl: user.avatarUrl ?? undefined,
      rating: Number(profile.ratingAverage ?? 4.9),
      totalTrips: profile.completedTrips ?? 0,
      memberSince: user.createdAt.toISOString(),
      riderApprovalStatus: profile.approvalStatus,
      isPhoneVerified: user.isPhoneVerified,
      isIdVerified: profile.approvalStatus === "APPROVED",
      isBackgroundChecked: profile.approvalStatus === "APPROVED",
      motorcycle: profile.vehicle ? {
        make: profile.vehicle.make,
        model: profile.vehicle.model,
        year: profile.vehicle.year ?? 2023,
        color: profile.vehicle.color ?? "Black",
        plateNumber: profile.vehicle.plateNumber,
        insuranceExpiry: profile.vehicle.insuranceNumber ? new Date(Date.now() + 180 * 86400000).toISOString() : undefined
      } : undefined,
      accountStatus: user.accountStatus
    };
  }

  async getRiderPerformance(token: string) {
    const session = await prisma.userSession.findUnique({
      where: { refreshTokenId: token },
      include: { user: { include: { riderProfile: true } } }
    });

    if (!session || !session.user || !session.user.riderProfile) {
      throw new AppError("Rider profile not found", 404, "RIDER_PROFILE_NOT_FOUND");
    }

    const profile = session.user.riderProfile;
    const completedTrips = profile.completedTrips ?? 0;
    const rating = Number(profile.ratingAverage ?? 4.9);

    return {
      rating,
      ratingTrend: 0.1,
      acceptanceRate: 94,
      acceptanceTrend: 2,
      cancellationRate: 2,
      cancellationTrend: -1,
      completedTrips,
      tripsTrend: 12,
      compliments: Math.floor(completedTrips * 0.4),
      complimentsTrend: 5,
      safetyScore: 98,
      safetyTrend: 0
    };
  }

  async getRiderAchievements(token: string) {
    const session = await prisma.userSession.findUnique({
      where: { refreshTokenId: token },
      include: { user: { include: { riderProfile: true } } }
    });

    if (!session || !session.user || !session.user.riderProfile) {
      throw new AppError("Rider profile not found", 404, "RIDER_PROFILE_NOT_FOUND");
    }

    const profile = session.user.riderProfile;
    const completedTrips = profile.completedTrips ?? 0;

    return [
      {
        id: "first_10_trips",
        title: "First 10 Rides",
        description: "Complete your first 10 successful trips on OkadaGo",
        requirement: "Complete 10 trips",
        progress: Math.min(completedTrips, 10),
        maxProgress: 10,
        unlocked: completedTrips >= 10,
        unlockedAt: completedTrips >= 10 ? "2024-01-15" : undefined,
        category: "trips",
        rarity: "common"
      },
      {
        id: "50_trips_pro",
        title: "Road Warrior",
        description: "Complete 50 trips with an average rating above 4.8",
        requirement: "Complete 50 trips",
        progress: Math.min(completedTrips, 50),
        maxProgress: 50,
        unlocked: completedTrips >= 50,
        unlockedAt: completedTrips >= 50 ? "2024-03-20" : undefined,
        category: "trips",
        rarity: "rare"
      },
      {
        id: "safety_champion",
        title: "Safety Ambassador",
        description: "Maintain zero safety incidents for 30 consecutive days",
        requirement: "30 days zero incidents",
        progress: 30,
        maxProgress: 30,
        unlocked: true,
        unlockedAt: "2024-02-01",
        category: "safety",
        rarity: "epic"
      },
      {
        id: "top_earner",
        title: "Top Earner",
        description: "Rank in the top 10% of earners in Accra for a week",
        requirement: "Top 10% weekly earnings",
        progress: 1,
        maxProgress: 1,
        unlocked: completedTrips >= 20,
        unlockedAt: completedTrips >= 20 ? "2024-04-10" : undefined,
        category: "earnings",
        rarity: "legendary"
      }
    ];
  }

  async getRiderDemand(token: string) {
    const session = await prisma.userSession.findUnique({
      where: { refreshTokenId: token }
    });

    if (!session) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    return [
      {
        id: "zone-accra-central",
        name: "Accra Central / Makola",
        requests: 42,
        avgWait: 3,
        trend: "up",
        latitude: 5.5502,
        longitude: -0.2012
      },
      {
        id: "zone-osu",
        name: "Osu Oxford Street",
        requests: 35,
        avgWait: 4,
        trend: "up",
        latitude: 5.5558,
        longitude: -0.1818
      },
      {
        id: "zone-east-legon",
        name: "East Legon / Shiashie",
        requests: 28,
        avgWait: 5,
        trend: "stable",
        latitude: 5.6358,
        longitude: -0.1601
      },
      {
        id: "zone-circle",
        name: "Kwame Nkrumah Circle",
        requests: 50,
        avgWait: 2,
        trend: "up",
        latitude: 5.5593,
        longitude: -0.2072
      },
      {
        id: "zone-airport",
        name: "Airport Residential",
        requests: 19,
        avgWait: 6,
        trend: "down",
        latitude: 5.6044,
        longitude: -0.1872
      }
    ];
  }

  async forgotPassword(input: z.infer<typeof forgotPasswordSchema>) {
    const user = await prisma.user.findFirst({
      where: { phoneE164: input.phoneE164, deletedAt: null },
      select: { id: true }
    });

    if (!user) {
      return { sent: true, expiresInSeconds: 600 };
    }

    const code = makeOtpCode();
    storeOtp(input.phoneE164, code, user.id);

    if (appConfig.nodeEnv === "production") {
      if (!hasSmsConfig()) {
        throw new AppError("SMS delivery is not configured", 503, "SMS_NOT_CONFIGURED");
      }
      await smsService.sendOtpSms({ to: input.phoneE164, code });
    } else {
      console.info(`[forgot-password] code sent to ${input.phoneE164}`);
    }

    return {
      sent: true,
      expiresInSeconds: 600,
      ...(appConfig.nodeEnv !== "production" ? { debugCode: code } : {})
    };
  }

  async resetPassword(input: z.infer<typeof resetPasswordSchema>) {
    const entry = verifyStoredOtp(input.phoneE164, input.code);
    if (!entry) {
      throw new AppError("Invalid or expired verification code", 400, "OTP_INVALID");
    }

    const user = await prisma.user.findFirst({
      where: { phoneE164: input.phoneE164, deletedAt: null }
    });

    if (!user) {
      throw new AppError("Account not found", 404, "ACCOUNT_NOT_FOUND");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(input.newPassword) }
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        actorRole: user.role as any,
        action: "PASSWORD_RESET",
        entityType: "User",
        entityId: user.id
      }
    });

    return { reset: true };
  }
}
