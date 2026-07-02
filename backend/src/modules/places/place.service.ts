import { AppError } from "../../common/errors.js";
import { prisma } from "../../common/prisma.js";
import type { z } from "zod";
import {
  createSavedPlaceSchema,
  updateSavedPlaceSchema
} from "./place.schemas.js";

type CreateSavedPlaceInput = z.infer<typeof createSavedPlaceSchema>;
type UpdateSavedPlaceInput = z.infer<typeof updateSavedPlaceSchema>;

export class PlaceService {
  private async getSession(token: string) {
    const session = await prisma.userSession.findUnique({
      where: { refreshTokenId: token },
      include: { user: true }
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new AppError("Session is invalid or expired", 401, "SESSION_INVALID");
    }

    return session;
  }

  async listSavedPlaces(token: string) {
    const session = await this.getSession(token);
    return prisma.savedPlace.findMany({
      where: { userId: session.user.id },
      orderBy: [{ label: "asc" }, { createdAt: "desc" }]
    });
  }

  async createSavedPlace(token: string, input: CreateSavedPlaceInput) {
    const session = await this.getSession(token);

    return prisma.savedPlace.create({
      data: {
        userId: session.user.id,
        label: input.label,
        address: input.address,
        latitude: input.latitude,
        longitude: input.longitude,
        notes: input.notes
      }
    });
  }

  async updateSavedPlace(token: string, placeId: string, input: UpdateSavedPlaceInput) {
    const session = await this.getSession(token);
    const place = await prisma.savedPlace.findUnique({ where: { id: placeId } });

    if (!place || place.userId !== session.user.id) {
      throw new AppError("Saved place not found", 404, "SAVED_PLACE_NOT_FOUND");
    }

    return prisma.savedPlace.update({
      where: { id: placeId },
      data: input
    });
  }

  async deleteSavedPlace(token: string, placeId: string) {
    const session = await this.getSession(token);
    const place = await prisma.savedPlace.findUnique({ where: { id: placeId } });

    if (!place || place.userId !== session.user.id) {
      throw new AppError("Saved place not found", 404, "SAVED_PLACE_NOT_FOUND");
    }

    await prisma.savedPlace.delete({ where: { id: placeId } });
    return { deleted: true };
  }
}
