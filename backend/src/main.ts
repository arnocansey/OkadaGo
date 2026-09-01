import { buildServer } from "./server.js";
import { appConfig } from "./common/config.js";
import { detectPostgisSupport } from "./common/geo.js";
import { attachRealtimeServer } from "./modules/realtime/realtime.server.js";
import { RideService } from "./modules/rides/ride.service.js";
import { adminJobsService } from "./modules/admin/admin-jobs.service.js";

const SCHEDULED_RIDE_DISPATCH_INTERVAL_MS = 60 * 1000;
const ADMIN_JOBS_INTERVAL_MS = 60 * 1000;

async function main() {
  const server = buildServer();

  try {
    await server.listen({
      host: appConfig.host,
      port: appConfig.port
    });

    attachRealtimeServer(server.server);
    server.log.info(`OkadaGo backend listening on ${appConfig.host}:${appConfig.port}`);
    server.log.info("Realtime websocket server attached at /socket.io"); // reloaded

    const postgisEnabled = await detectPostgisSupport();
    if (postgisEnabled) {
      server.log.info("PostGIS detected — rider matching will use the GiST-indexed geography fast path");
    } else {
      server.log.warn(
        "PostGIS not detected — rider matching will use the in-memory Haversine fallback. " +
          "Run `npm run db:postgis` to enable the fast path (see backend/README.md)."
      );
    }

    if (appConfig.googlePlacesApiKey) {
      server.log.info(
        { source: appConfig.googlePlacesApiKeySource },
        "Google Places API key configured"
      );
      if (appConfig.googlePlacesApiKeySource === "GOOGLE_MAPS_API_KEY") {
        server.log.warn(
          "Places uses GOOGLE_MAPS_API_KEY fallback — set GOOGLE_PLACES_API_KEY to a dedicated server key (no Android/iOS/HTTP referrer restrictions)"
        );
      }
    } else {
      server.log.warn(
        "GOOGLE_PLACES_API_KEY is not set — /bootstrap/places/* (Food & groceries) will return PLACES_NOT_CONFIGURED"
      );
    }

    const rideService = new RideService();
    setInterval(() => {
      void rideService.dispatchScheduledRides().catch((error) => {
        server.log.error(error, "Scheduled ride dispatch tick failed");
      });
    }, SCHEDULED_RIDE_DISPATCH_INTERVAL_MS);
    server.log.info(
      `Scheduled-ride dispatcher running every ${SCHEDULED_RIDE_DISPATCH_INTERVAL_MS / 1000}s`
    );

    setInterval(() => {
      void adminJobsService.dispatchDueBroadcasts().catch((error) => {
        server.log.error(error, "Scheduled broadcast dispatch tick failed");
      });
      void adminJobsService.runEscalationRules().catch((error) => {
        server.log.error(error, "Escalation rules tick failed");
      });
    }, ADMIN_JOBS_INTERVAL_MS);
    server.log.info(`Admin jobs (broadcasts + escalations) running every ${ADMIN_JOBS_INTERVAL_MS / 1000}s`);
  } catch (error) {
    server.log.error(error, "Failed to start OkadaGo backend");
    process.exit(1);
  }
}

void main();
