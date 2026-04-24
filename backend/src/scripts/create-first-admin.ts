import "dotenv/config";

import { hashPassword } from "../common/auth.js";
import { prisma } from "../common/prisma.js";
import { AccountStatus, UserRole } from "../generated/prisma/enums.js";

type FirstAdminEnv = {
  fullName: string;
  email: string;
  phoneCountryCode: string;
  phoneLocal: string;
  phoneE164: string;
  password: string;
  preferredCurrency: string;
  title: string | null;
  permissions: string[];
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function readFirstAdminEnv(): FirstAdminEnv {
  const permissions =
    process.env.FIRST_ADMIN_PERMISSIONS
      ?.split(",")
      .map((entry) => entry.trim())
      .filter(Boolean) ?? [];

  return {
    fullName: requireEnv("FIRST_ADMIN_FULL_NAME"),
    email: requireEnv("FIRST_ADMIN_EMAIL").toLowerCase(),
    phoneCountryCode: requireEnv("FIRST_ADMIN_PHONE_COUNTRY_CODE"),
    phoneLocal: requireEnv("FIRST_ADMIN_PHONE_LOCAL"),
    phoneE164: requireEnv("FIRST_ADMIN_PHONE_E164"),
    password: requireEnv("FIRST_ADMIN_PASSWORD"),
    preferredCurrency: process.env.FIRST_ADMIN_PREFERRED_CURRENCY?.trim().toUpperCase() || "GHS",
    title: process.env.FIRST_ADMIN_TITLE?.trim() || null,
    permissions
  };
}

async function main() {
  const input = readFirstAdminEnv();

  if (input.password.length < 8) {
    throw new Error("FIRST_ADMIN_PASSWORD must be at least 8 characters long.");
  }

  const existingAdmin = await prisma.user.findFirst({
    where: {
      role: UserRole.ADMIN,
      deletedAt: null
    },
    select: {
      id: true,
      email: true,
      phoneE164: true
    }
  });

  if (existingAdmin) {
    throw new Error(
      `An admin account already exists (${existingAdmin.email ?? existingAdmin.phoneE164}). Use /admin/admins for additional admin accounts.`
    );
  }

  const conflictingUser = await prisma.user.findFirst({
    where: {
      deletedAt: null,
      OR: [{ email: input.email }, { phoneE164: input.phoneE164 }]
    },
    select: {
      id: true,
      role: true,
      email: true,
      phoneE164: true
    }
  });

  if (conflictingUser) {
    throw new Error(
      `A user already exists with this email or phone (${conflictingUser.email ?? conflictingUser.phoneE164}, role ${conflictingUser.role}).`
    );
  }

  const passwordHash = await hashPassword(input.password);

  const admin = await prisma.user.create({
    data: {
      role: UserRole.ADMIN,
      accountStatus: AccountStatus.ACTIVE,
      fullName: input.fullName,
      email: input.email,
      phoneCountryCode: input.phoneCountryCode,
      phoneLocal: input.phoneLocal,
      phoneE164: input.phoneE164,
      passwordHash,
      isPhoneVerified: true,
      isEmailVerified: true,
      preferredCurrency: input.preferredCurrency,
      adminProfile: {
        create: {
          title: input.title,
          permissions: input.permissions
        }
      }
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phoneE164: true,
      preferredCurrency: true,
      adminProfile: {
        select: {
          title: true,
          permissions: true
        }
      }
    }
  });

  console.log("First admin created successfully.");
  console.log(`Name: ${admin.fullName}`);
  console.log(`Email: ${admin.email ?? "none"}`);
  console.log(`Phone: ${admin.phoneE164}`);
  console.log(`Currency: ${admin.preferredCurrency}`);
  console.log(`Title: ${admin.adminProfile?.title ?? "none"}`);
  console.log(
    `Permissions: ${
      Array.isArray(admin.adminProfile?.permissions) && admin.adminProfile.permissions.length > 0
        ? admin.adminProfile.permissions.join(", ")
        : "none"
    }`
  );
  console.log("You can now sign in at /admin/login and create additional admins from /admin/admins.");
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown error while creating first admin.";
    console.error(`First admin bootstrap failed: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
