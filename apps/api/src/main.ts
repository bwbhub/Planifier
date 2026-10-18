import { getEnv } from "./config/env";
import { createApiServer } from "./server";

const env = getEnv();
const server = createApiServer(env);

server.listen(env.PORT, () => {
  console.log(JSON.stringify({ level: "info", message: "api prête", port: env.PORT }));
});

// Arrêt propre (conteneur) : plus de nouvelles connexions, les requêtes en cours se terminent.
for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.once(signal, () => {
    server.close(() => process.exit(0));
  });
}
