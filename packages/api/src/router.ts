import { healthRouter } from "./features/system/health/health.router";
import { routerBuilder } from "./procedures";

/** Routeur complet, vérifié contre le contrat. */
export const router = routerBuilder.router({
  system: { health: healthRouter },
});

export type ApiRouter = typeof router;
