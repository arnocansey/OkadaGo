import type { FastifyPluginAsync } from "fastify";
import { parseBody, parseQuery } from "../../common/validation.js";
import {
  createPassengerSchema,
  createRiderSchema,
  createServiceZoneSchema
} from "./bootstrap.schemas.js";
import {
  forwardGeocodeQuerySchema,
  listQuerySchema,
  reverseGeocodeQuerySchema,
  routePreviewQuerySchema
} from "./bootstrap.query-schemas.js";
import { BootstrapService } from "./bootstrap.service.js";

const bootstrapService = new BootstrapService();

export const bootstrapRoutes: FastifyPluginAsync = async (server) => {
  server.get("/bootstrap/passengers", async (request) => {
    const query = parseQuery(request, listQuerySchema);
    return bootstrapService.listPassengers(query.limit);
  });

  server.post("/bootstrap/passengers", async (request, reply) => {
    const input = parseBody(request, createPassengerSchema);
    const passenger = await bootstrapService.createPassenger(input);
    return reply.status(201).send(passenger);
  });

  server.get("/bootstrap/riders", async (request) => {
    const query = parseQuery(request, listQuerySchema);
    return bootstrapService.listRiders(query.limit);
  });

  server.post("/bootstrap/riders", async (request, reply) => {
    const input = parseBody(request, createRiderSchema);
    const rider = await bootstrapService.createRider(input);
    return reply.status(201).send(rider);
  });

  server.get("/bootstrap/service-zones", async (request) => {
    const query = parseQuery(request, listQuerySchema);
    return bootstrapService.listServiceZones(query.limit);
  });

  server.post("/bootstrap/service-zones", async (request, reply) => {
    const input = parseBody(request, createServiceZoneSchema);
    const zone = await bootstrapService.createServiceZone(input);
    return reply.status(201).send(zone);
  });

  server.get("/bootstrap/reverse-geocode", async (request) => {
    const query = parseQuery(request, reverseGeocodeQuerySchema);
    return bootstrapService.reverseGeocode(query.lat, query.lon);
  });

  server.get("/bootstrap/forward-geocode", async (request) => {
    const query = parseQuery(request, forwardGeocodeQuerySchema);
    return bootstrapService.forwardGeocode(query.q);
  });

  server.get("/bootstrap/route-preview", async (request) => {
    const query = parseQuery(request, routePreviewQuerySchema);
    return bootstrapService.routePreview({
      startLatitude: query.startLat,
      startLongitude: query.startLon,
      endLatitude: query.endLat,
      endLongitude: query.endLon
    });
  });
};
