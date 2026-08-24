import type { FastifyPluginAsync } from "fastify";
import { parseBody, parseParams, parseQuery } from "../../common/validation.js";
import { appConfig } from "../../common/config.js";
import {
  createRideRequestSchema,
  matchingPreviewSchema,
  rideIdParamsSchema,
  rideLocationQuerySchema,
  rideLocationUpdateSchema,
  rideEstimateSchema,
  riderAvailabilityParamsSchema,
  riderAvailabilitySchema,
  rideLifecycleValidationSchema,
  rideStatusUpdateSchema
} from "./ride.schemas.js";
import { RideService } from "./ride.service.js";

const rideService = new RideService();

export const rideRoutes: FastifyPluginAsync = async (server) => {
  server.post("/rides/estimate", async (request) => {
    const input = parseBody(request, rideEstimateSchema);
    return rideService.estimateRide(input);
  });

  server.post("/rides/lifecycle/validate", async (request) => {
    const input = parseBody(request, rideLifecycleValidationSchema);
    return rideService.validateLifecycle(input);
  });

  server.post("/matching/preview", async (request) => {
    const input = parseBody(request, matchingPreviewSchema);
    return rideService.previewMatching(input);
  });

  server.get("/riders/:riderProfileId", async (request) => {
    const params = parseParams(request, riderAvailabilityParamsSchema);
    return rideService.getRiderProfile(params.riderProfileId);
  });

  server.patch("/riders/:riderProfileId/availability", async (request) => {
    const params = parseParams(request, riderAvailabilityParamsSchema);
    const input = parseBody(request, riderAvailabilitySchema);
    return rideService.updateRiderAvailability(params.riderProfileId, input);
  });

  server.post("/rides/request", async (request, reply) => {
    const input = parseBody(request, createRideRequestSchema);
    const ride = await rideService.createRideRequest(input);
    return reply.status(201).send(ride);
  });

  server.get("/rides/:rideId", async (request) => {
    const params = parseParams(request, rideIdParamsSchema);
    return rideService.getRide(params.rideId);
  });

  server.get("/rides/:rideId/locations", async (request) => {
    const params = parseParams(request, rideIdParamsSchema);
    const query = parseQuery(request, rideLocationQuerySchema);
    return rideService.listRideLocations(params.rideId, query.limit);
  });

  server.get("/rides/:rideId/share", async (request) => {
    const params = parseParams(request, rideIdParamsSchema);
    const ride = await rideService.getRide(params.rideId);
    return {
      id: ride.id,
      status: ride.status,
      pickupAddress: ride.pickupAddress,
      destinationAddress: ride.destinationAddress,
      pickupLatitude: ride.pickupLatitude,
      pickupLongitude: ride.pickupLongitude,
      destinationLatitude: ride.destinationLatitude,
      destinationLongitude: ride.destinationLongitude,
      estimatedFare: ride.estimatedFare,
      estimatedDurationMinutes: ride.estimatedDurationMinutes,
      rider: ride.rider
        ? {
            id: ride.rider.id,
            ratingAverage: ride.rider.ratingAverage,
            user: {
              fullName: ride.rider.user.fullName,
              avatarUrl: ride.rider.user.avatarUrl,
            },
          }
        : null,
      shareableUrl: `${appConfig.apiPublicUrl}/rides/${ride.id}/share`,
    };
  });

  server.post("/rides/:rideId/location", async (request) => {
    const params = parseParams(request, rideIdParamsSchema);
    const input = parseBody(request, rideLocationUpdateSchema);
    return rideService.recordRideLocation(params.rideId, input);
  });

  server.get("/rides/active", async (request) => {
    const query = request.query as { userId?: string };
    if (!query.userId) {
      return null;
    }
    return rideService.getActiveRide(query.userId);
  });

  server.get("/rides", async (request) => {
    const query = request.query as { limit?: string; page?: string; riderId?: string; passengerId?: string; status?: string };
    return rideService.listRides({
      limit: query.limit ? Number(query.limit) || undefined : undefined,
      page: query.page ? Number(query.page) || undefined : undefined,
      riderId: query.riderId,
      passengerId: query.passengerId,
      status: query.status
    });
  });

  server.patch("/rides/:rideId/status", async (request) => {
    const params = parseParams(request, rideIdParamsSchema);
    const input = parseBody(request, rideStatusUpdateSchema);
    return rideService.updateRideStatus(params.rideId, input);
  });
};
