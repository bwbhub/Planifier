import type { AnyMiddleware } from "@orpc/server";
import { implement } from "@orpc/server";
import { contract } from "@planifier/api-contract";

/** Contexte fourni par le serveur HTTP à chaque requête. La session s'y ajoutera (ticket auth). */
export interface ApiContext {
  /** Identifiant de requête, pour relier les journaux. */
  requestId: string;
}

const base = implement(contract).$context<ApiContext>();

/**
 * Garde du plan public (skill api-contracts-orpc) : procédure appelable sans session.
 * La limitation de débit s'y ajoutera avec l'authentification.
 */
export const publicGuard = base.middleware(({ next }) => next());

/** Gardes de plan connues : toute procédure doit commencer par l'une d'elles (test des gardes). */
export const PLAN_GUARDS: readonly AnyMiddleware[] = [publicGuard];

export const publicProcedure = base.use(publicGuard);

export const routerBuilder = base;
