import { meRouter } from "./features/account/me/me.router";
import { healthRouter } from "./features/system/health/health.router";
import { routerBuilder } from "./procedures";

/** Routeur complet, vérifié contre le contrat. */
export const router = routerBuilder.router({
  system: { health: healthRouter },
  account: { me: meRouter },
});

export type ApiRouter = typeof router;
