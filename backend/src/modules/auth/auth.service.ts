import { AppError } from "../../common/errors.js";
import { hashPassword, makeSessionToken, verifyPassword } from "../../common/auth.js";
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
  adminLoginSchema,
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
import type { avatarUploadSchema } from "./auth.schemas.js";
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
        isPhoneVerified: false,
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

    return {
      revoked: true
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
      console.info(`[otp] ${input.phoneE164} -> ${code}`);
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
}
