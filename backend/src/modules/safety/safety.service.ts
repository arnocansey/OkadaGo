import { AppError } from "../../common/errors.js";
import { prisma } from "../../common/prisma.js";
import { sendOtpEmail } from "../../common/mailer.js";
import {
  IncidentSeverity,
  IncidentStatus,
  NotificationChannel,
  NotificationStatus,
  RideStatus,
  UserRole
} from "../../generated/prisma/enums.js";
import type { z } from "zod";
import {
  adminIncidentReviewSchema,
  adminIncidentsQuerySchema,
  createSafetyContactSchema,
  createSafetyIncidentSchema,
  createSafetyShareEventSchema,
  requestSafetyContactVerificationSchema,
  verifySafetyContactOtpSchema
} from "./safety.schemas.js";

type CreateSafetyContactInput = z.infer<typeof createSafetyContactSchema>;
type CreateSafetyIncidentInput = z.infer<typeof createSafetyIncidentSchema>;
type CreateSafetyShareEventInput = z.infer<typeof createSafetyShareEventSchema>;
type RequestSafetyContactVerificationInput = z.infer<typeof requestSafetyContactVerificationSchema>;
type VerifySafetyContactOtpInput = z.infer<typeof verifySafetyContactOtpSchema>;
type AdminIncidentsQueryInput = z.infer<typeof adminIncidentsQuerySchema>;
type AdminIncidentReviewInput = z.infer<typeof adminIncidentReviewSchema>;

const activeRideStatuses: RideStatus[] = [
  RideStatus.SEARCHING,
  RideStatus.ASSIGNED,
  RideStatus.ARRIVING,
  RideStatus.ARRIVED,
  RideStatus.STARTED
];

export class SafetyService {
  private makeVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async getCurrentUserSession(token: string) {
    const session = await prisma.userSession.findUnique({
      where: {
        refreshTokenId: token
      },
      include: {
        user: {
          include: {
            passengerProfile: true,
            riderProfile: true
          }
        }
      }
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new AppError("Session is invalid or expired", 401, "SESSION_INVALID");
    }

    if (
      session.user.role !== UserRole.PASSENGER &&
      session.user.role !== UserRole.RIDER &&
      session.user.role !== UserRole.ADMIN
    ) {
      throw new AppError("User access is required", 403, "USER_ACCESS_REQUIRED");
    }

    return session;
  }

  private async getCurrentAdminSession(token: string) {
    const session = await prisma.userSession.findUnique({
      where: {
        refreshTokenId: token
      },
      include: {
        user: true
      }
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new AppError("Session is invalid or expired", 401, "SESSION_INVALID");
    }

    if (session.user.role !== UserRole.ADMIN) {
      throw new AppError("Admin access is required", 403, "ADMIN_ACCESS_REQUIRED");
    }

    return session;
  }

  async getSafetyOverview(token: string) {
    const session = await this.getCurrentUserSession(token);

    const contactsPromise = prisma.emergencyContact.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
      take: 20
    });

    const incidentsPromise = prisma.incident.findMany({
      where: {
        reporterId: session.user.id
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 20
    });

    const activeRidePromise = session.user.passengerProfile
      ? prisma.ride.findFirst({
          where: {
            passengerId: session.user.passengerProfile.id,
            status: {
              in: activeRideStatuses
            }
          },
          orderBy: {
            requestedAt: "desc"
          },
          select: {
            id: true,
            status: true,
            pickupAddress: true,
            destinationAddress: true
          }
        })
      : session.user.riderProfile
        ? prisma.ride.findFirst({
            where: {
              riderId: session.user.riderProfile.id,
              status: {
                in: activeRideStatuses
              }
            },
            orderBy: {
              requestedAt: "desc"
            },
            select: {
              id: true,
              status: true,
              pickupAddress: true,
              destinationAddress: true
            }
          })
        : Promise.resolve(null);

    const verifiedContactEventsPromise = prisma.notification.findMany({
      where: {
        userId: session.user.id,
        title: "TRUSTED_CONTACT_VERIFIED"
      },
      select: {
        data: true
      }
    });

    const [contacts, incidents, activeRide, verifiedContactEvents] = await Promise.all([
      contactsPromise,
      incidentsPromise,
      activeRidePromise,
      verifiedContactEventsPromise
    ]);

    const verifiedContactIds = new Set(
      verifiedContactEvents
        .map((event) => (event.data as { contactId?: string } | null)?.contactId)
        .filter((value): value is string => Boolean(value))
    );

    return {
      contacts: contacts.map((contact) => ({
        ...contact,
        isVerified: verifiedContactIds.has(contact.id)
      })),
      incidents,
      activeRide
    };
  }

  async createSafetyContact(token: string, input: CreateSafetyContactInput) {
    const session = await this.getCurrentUserSession(token);

    return prisma.$transaction(async (tx) => {
      if (input.isPrimary) {
        await tx.emergencyContact.updateMany({
          where: {
            userId: session.user.id
          },
          data: {
            isPrimary: false
          }
        });
      }

      return tx.emergencyContact.create({
        data: {
          userId: session.user.id,
          name: input.name.trim(),
          phoneE164: input.phoneE164.trim(),
          relationship: input.relationship?.trim() || null,
          isPrimary: input.isPrimary ?? false
        }
      });
    });
  }

  async removeSafetyContact(token: string, contactId: string) {
    const session = await this.getCurrentUserSession(token);

    const contact = await prisma.emergencyContact.findUnique({
      where: {
        id: contactId
      }
    });

    if (!contact || contact.userId !== session.user.id) {
      throw new AppError("Emergency contact not found.", 404, "CONTACT_NOT_FOUND");
    }

    await prisma.emergencyContact.delete({
      where: {
        id: contactId
      }
    });

    return {
      ok: true
    };
  }

  async reportSafetyIncident(token: string, input: CreateSafetyIncidentInput) {
    const session = await this.getCurrentUserSession(token);
    const ride = input.rideId
      ? await prisma.ride.findUnique({
          where: {
            id: input.rideId
          }
        })
      : null;

    if (input.rideId && !ride) {
      throw new AppError("Ride could not be found.", 404, "RIDE_NOT_FOUND");
    }

    return prisma.incident.create({
      data: {
        reporterId: session.user.id,
        rideId: ride?.id,
        riderId: ride?.riderId ?? null,
        severity: input.severity as IncidentSeverity,
        category: input.category.trim(),
        description: input.description.trim(),
        evidence: input.evidence ?? []
      }
    });
  }

  async createSafetyShareEvent(token: string, input: CreateSafetyShareEventInput) {
    const session = await this.getCurrentUserSession(token);

    const ride = await prisma.ride.findUnique({
      where: {
        id: input.rideId
      },
      select: {
        id: true,
        passenger: {
          select: {
            userId: true
          }
        },
        rider: {
          select: {
            userId: true
          }
        }
      }
    });

    if (!ride) {
      throw new AppError("Ride could not be found.", 404, "RIDE_NOT_FOUND");
    }

    const canAccessRide =
      ride.passenger?.userId === session.user.id || ride.rider?.userId === session.user.id;
    if (!canAccessRide) {
      throw new AppError("You cannot share this ride.", 403, "RIDE_ACCESS_FORBIDDEN");
    }

    return prisma.rideEvent.create({
      data: {
        rideId: ride.id,
        actorUserId: session.user.id,
        eventType: input.mode === "START" ? "TRIP_SHARE_STARTED" : "TRIP_SHARE_STOPPED",
        payload: {
          channel: input.channel,
          contactId: input.contactId,
          note: input.note ?? null
        }
      }
    });
  }

  async requestSafetyContactVerification(
    token: string,
    input: RequestSafetyContactVerificationInput
  ) {
    const session = await this.getCurrentUserSession(token);

    const contact = await prisma.emergencyContact.findUnique({
      where: {
        id: input.contactId
      }
    });

    if (!contact || contact.userId !== session.user.id) {
      throw new AppError("Emergency contact not found.", 404, "CONTACT_NOT_FOUND");
    }

    const code = this.makeVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const destinationEmail = session.user.email?.trim();

    if (!destinationEmail) {
      throw new AppError(
        "Your account has no email address for OTP delivery. Add an email first.",
        409,
        "EMAIL_REQUIRED_FOR_OTP"
      );
    }

    await sendOtpEmail({
      to: destinationEmail,
      code,
      contactName: contact.name
    });

    await prisma.notification.create({
      data: {
        userId: session.user.id,
        channel: NotificationChannel.EMAIL,
        status: NotificationStatus.SENT,
        title: "TRUSTED_CONTACT_OTP",
        body: `Verification code sent to ${destinationEmail}`,
        data: {
          contactId: contact.id,
          code,
          expiresAt: expiresAt.toISOString(),
          destinationEmail
        },
        sentAt: new Date()
      }
    });

    return {
      ok: true,
      contactId: contact.id,
      expiresAt: expiresAt.toISOString()
    };
  }

  async verifySafetyContactOtp(token: string, input: VerifySafetyContactOtpInput) {
    const session = await this.getCurrentUserSession(token);

    const contact = await prisma.emergencyContact.findUnique({
      where: {
        id: input.contactId
      }
    });

    if (!contact || contact.userId !== session.user.id) {
      throw new AppError("Emergency contact not found.", 404, "CONTACT_NOT_FOUND");
    }

    const latestOtp = await prisma.notification.findFirst({
      where: {
        userId: session.user.id,
        title: "TRUSTED_CONTACT_OTP",
        status: NotificationStatus.SENT
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    const payload = (latestOtp?.data as {
      contactId?: string;
      code?: string;
      expiresAt?: string;
    } | null) ?? {
      contactId: undefined,
      code: undefined,
      expiresAt: undefined
    };

    if (!latestOtp || payload.contactId !== contact.id || !payload.code || !payload.expiresAt) {
      throw new AppError("No pending verification code for this contact.", 409, "OTP_NOT_FOUND");
    }

    if (new Date(payload.expiresAt).getTime() < Date.now()) {
      throw new AppError("Verification code has expired.", 409, "OTP_EXPIRED");
    }

    if (payload.code !== input.code.trim()) {
      throw new AppError("Verification code is invalid.", 409, "OTP_INVALID");
    }

    await prisma.$transaction(async (tx) => {
      await tx.notification.update({
        where: {
          id: latestOtp.id
        },
        data: {
          status: NotificationStatus.READ,
          readAt: new Date()
        }
      });

      await tx.notification.create({
        data: {
          userId: session.user.id,
          channel: NotificationChannel.IN_APP,
          status: NotificationStatus.SENT,
          title: "TRUSTED_CONTACT_VERIFIED",
          body: `${contact.name} was verified.`,
          data: {
            contactId: contact.id
          },
          sentAt: new Date()
        }
      });
    });

    return {
      ok: true,
      contactId: contact.id
    };
  }

  async listAdminIncidents(token: string, query: AdminIncidentsQueryInput) {
    await this.getCurrentAdminSession(token);

    const fromDate = query.fromDate ? new Date(`${query.fromDate}T00:00:00.000Z`) : null;
    const toDate = query.toDate ? new Date(`${query.toDate}T23:59:59.999Z`) : null;

    return prisma.incident.findMany({
      where: {
        status: query.status as IncidentStatus | undefined,
        severity: query.severity as IncidentSeverity | undefined,
        riderId: query.riderId,
        rideId: query.rideId,
        createdAt:
          fromDate || toDate
            ? {
                gte: fromDate ?? undefined,
                lte: toDate ?? undefined
              }
            : undefined
      },
      include: {
        reporter: {
          select: {
            id: true,
            fullName: true,
            phoneE164: true
          }
        },
        rider: {
          select: {
            id: true,
            displayCode: true,
            user: {
              select: {
                fullName: true,
                phoneE164: true
              }
            }
          }
        },
        assignedTo: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        ride: {
          select: {
            id: true,
            status: true,
            pickupAddress: true,
            destinationAddress: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 120
    });
  }

  async reviewAdminIncident(token: string, incidentId: string, input: AdminIncidentReviewInput) {
    const session = await this.getCurrentAdminSession(token);

    const incident = await prisma.incident.findUnique({
      where: {
        id: incidentId
      }
    });

    if (!incident) {
      throw new AppError("Incident could not be found.", 404, "INCIDENT_NOT_FOUND");
    }

    return prisma.incident.update({
      where: {
        id: incidentId
      },
      data: {
        status: input.status as IncidentStatus,
        assignedToId: session.user.id,
        resolvedAt: input.status === "RESOLVED" || input.status === "CLOSED" ? new Date() : null
      },
      include: {
        reporter: {
          select: {
            id: true,
            fullName: true,
            phoneE164: true
          }
        },
        rider: {
          select: {
            id: true,
            displayCode: true,
            user: {
              select: {
                fullName: true,
                phoneE164: true
              }
            }
          }
        },
        assignedTo: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        ride: {
          select: {
            id: true,
            status: true,
            pickupAddress: true,
            destinationAddress: true
          }
        }
      }
    });
  }
}
