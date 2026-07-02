import { buildServer } from "./server.js";
import { appConfig } from "./common/config.js";
import { attachRealtimeServer } from "./modules/realtime/realtime.server.js";

async function main() {
  const server = buildServer();

  try {
    await server.listen({
      host: appConfig.host,
      port: appConfig.port
    });

    attachRealtimeServer(server.server);
    server.log.info(`OkadaGo backend listening on ${appConfig.host}:${appConfig.port}`);
    server.log.info("Realtime websocket server attached at /socket.io");

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
  } catch (error) {
    server.log.error(error, "Failed to start OkadaGo backend");
    process.exit(1);
  }
}

void main();
