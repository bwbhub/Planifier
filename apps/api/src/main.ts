import { getEnv } from "./config/env";
import { createApiServer } from "./server";

const env = getEnv();
const server = createApiServer(env);

server.listen(env.PORT, () => {
  console.log(JSON.stringify({ level: "info", message: "api prête", port: env.PORT }));
});

const SHUTDOWN_DEADLINE_MS = 10_000;

// Arrêt propre (conteneur) : plus de nouvelles connexions, les requêtes en cours se terminent ;
// au-delà du délai, les connexions restantes sont coupées.
function shutdown() {
  server.close(() => process.exit(0));
  server.closeIdleConnections();
  setTimeout(() => {
    server.closeAllConnections();
    process.exit(1);
  }, SHUTDOWN_DEADLINE_MS).unref();
}

for (const signal of ["SIGTERM", "SIGINT"] as const) process.once(signal, shutdown);
