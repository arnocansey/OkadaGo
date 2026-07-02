import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { AppError } from "../../common/errors.js";
import { appConfig } from "../../common/config.js";
import { prisma } from "../../common/prisma.js";
import { DocumentStatus } from "../../generated/prisma/enums.js";
import type {
  reviewDocumentSchema,
  uploadDocumentSchema
} from "./document.schemas.js";
import type { z } from "zod";

type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
type ReviewDocumentInput = z.infer<typeof reviewDocumentSchema>;

const uploadsRoot = path.join(process.cwd(), "uploads", "documents");

function extensionFromContentType(contentType: string) {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  if (contentType.includes("pdf")) return "pdf";
  if (contentType.includes("webp")) return "webp";
  return "bin";
}

export class DocumentService {
  private async getActiveSession(token: string) {
    const session = await prisma.userSession.findUnique({
      where: { refreshTokenId: token },
      include: {
        user: {
          include: { riderProfile: true, adminProfile: true },
        },
      },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new AppError("Session is invalid or expired", 401, "SESSION_INVALID");
    }

    return session;
  }

  async uploadRiderDocument(token: string, input: UploadDocumentInput) {
    const session = await this.getActiveSession(token);
    const riderProfile = session.user.riderProfile;

    if (!riderProfile) {
      throw new AppError("Rider profile required", 409, "RIDER_PROFILE_REQUIRED");
    }

    const ext = extensionFromContentType(input.contentType);
    const fileId = randomUUID();
    const relativePath = `${riderProfile.id}/${fileId}.${ext}`;
    const absolutePath = path.join(uploadsRoot, relativePath);

    await mkdir(path.dirname(absolutePath), { recursive: true });

    const buffer = Buffer.from(input.dataBase64, "base64");
    if (buffer.length > 8 * 1024 * 1024) {
      throw new AppError("File exceeds 8MB limit", 413, "FILE_TOO_LARGE");
    }

    await writeFile(absolutePath, buffer);

    const fileUrl = `${appConfig.apiPublicUrl}/v1/uploads/documents/${relativePath}`;

    return prisma.riderDocument.create({
      data: {
        riderId: riderProfile.id,
        type: input.type,
        status: DocumentStatus.PENDING,
        fileUrl,
        notes: input.notes,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
      },
    });
  }

  async listMyDocuments(token: string) {
    const session = await this.getActiveSession(token);
    const riderProfile = session.user.riderProfile;

    if (!riderProfile) {
      throw new AppError("Rider profile required", 409, "RIDER_PROFILE_REQUIRED");
    }

    return prisma.riderDocument.findMany({
      where: { riderId: riderProfile.id },
      orderBy: { createdAt: "desc" },
    });
  }

  async listRiderDocumentsAdmin(token: string, riderProfileId: string) {
    const session = await this.getActiveSession(token);

    if (!session.user.adminProfile) {
      throw new AppError("Admin access is required", 403, "ADMIN_ACCESS_REQUIRED");
    }

    return prisma.riderDocument.findMany({
      where: { riderId: riderProfileId },
      orderBy: { createdAt: "desc" },
    });
  }

  async reviewDocument(token: string, documentId: string, input: ReviewDocumentInput) {
    const session = await this.getActiveSession(token);

    if (!session.user.adminProfile) {
      throw new AppError("Admin access is required", 403, "ADMIN_ACCESS_REQUIRED");
    }

    const document = await prisma.riderDocument.findUnique({ where: { id: documentId } });
    if (!document) {
      throw new AppError("Document not found", 404, "DOCUMENT_NOT_FOUND");
    }

    return prisma.riderDocument.update({
      where: { id: documentId },
      data: {
        status: input.status,
        notes: input.notes,
        reviewerId: session.userId,
        reviewedAt: new Date(),
      },
    });
  }
}

export const documentService = new DocumentService();
