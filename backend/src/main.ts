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
  } catch (error) {
    server.log.error(error, "Failed to start OkadaGo backend");
    process.exit(1);
  }
}

void main();
