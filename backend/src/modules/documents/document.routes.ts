import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import type { FastifyPluginAsync } from "fastify";
import { AppError } from "../../common/errors.js";
import { parseBody, parseParams } from "../../common/validation.js";
import {
  documentIdParamsSchema,
  reviewDocumentSchema,
  riderDocumentsParamsSchema,
  uploadDocumentSchema,
} from "./document.schemas.js";
import { DocumentService } from "./document.service.js";

const documentService = new DocumentService();
const uploadsRoot = path.join(process.cwd(), "uploads", "documents");

function extractBearerToken(authorizationHeader?: string) {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    throw new AppError("Authorization header is required", 401, "AUTHORIZATION_REQUIRED");
  }

  return authorizationHeader.slice("Bearer ".length).trim();
}

export const documentRoutes: FastifyPluginAsync = async (server) => {
  server.post("/riders/documents", async (request, reply) => {
    const token = extractBearerToken(request.headers.authorization);
    const input = parseBody(request, uploadDocumentSchema);
    const doc = await documentService.uploadRiderDocument(token, input);
    return reply.status(201).send(doc);
  });

  server.get("/riders/documents", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    return documentService.listMyDocuments(token);
  });

  server.get("/admin/riders/:riderProfileId/documents", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const params = parseParams(request, riderDocumentsParamsSchema);
    return documentService.listRiderDocumentsAdmin(token, params.riderProfileId);
  });

  server.get("/admin/documents", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const limitRaw = (request.query as { limit?: string }).limit;
    const limit = limitRaw ? Number(limitRaw) : 200;
    return documentService.listAllDocumentsAdmin(token, Number.isFinite(limit) ? limit : 200);
  });

  server.patch("/admin/documents/:documentId/review", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const params = parseParams(request, documentIdParamsSchema);
    const input = parseBody(request, reviewDocumentSchema);
    return documentService.reviewDocument(token, params.documentId, input);
  });

  server.get("/uploads/documents/*", async (request, reply) => {
    const wildcard = (request.params as { "*": string })["*"];
    const safePath = path.normalize(wildcard).replace(/^(\.\.[/\\])+/, "");
    const absolutePath = path.join(uploadsRoot, safePath);

    if (!absolutePath.startsWith(uploadsRoot)) {
      throw new AppError("Invalid file path", 400, "INVALID_FILE_PATH");
    }

    try {
      await stat(absolutePath);
    } catch {
      throw new AppError("File not found", 404, "FILE_NOT_FOUND");
    }

    return reply.send(createReadStream(absolutePath));
  });
};
