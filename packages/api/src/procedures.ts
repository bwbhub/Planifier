import type { AnyMiddleware } from "@orpc/server";
import { implement, ORPCError } from "@orpc/server";
import { contract } from "@planifier/api-contract";
import type { SessionUser } from "@planifier/auth";

/** Contexte fourni par le serveur HTTP à chaque requête. */
export interface ApiContext {
  /** Identifiant de requête, pour relier les journaux. */
  requestId: string;
  /** IP du client posée par le proxy du web ; le serveur refuse toute requête qui n'en a pas. */
  clientIp: string;
  /** Compte une requête pour une clé ; `false` si sa limite est atteinte (limiteur propre au serveur). */
  consumeRateLimit: (key: string) => boolean;
  /** Lit la session portée par le cookie. Appelée uniquement par la garde du plan utilisateur. */
  getSessionUser: () => Promise<SessionUser | null>;
}

const base = implement(contract).$context<ApiContext>();

/** Débit par IP, tous plans confondus : premier maillon de la chaîne d'accès. */
function enforceRateLimit(context: ApiContext) {
  if (!context.consumeRateLimit(context.clientIp)) throw new ORPCError("TOO_MANY_REQUESTS");
}

/** Garde du plan public (skill api-contracts-orpc) : appelable sans session, limitée en débit. */
export const publicGuard = base.middleware(({ context, next }) => {
  enforceRateLimit(context);
  return next();
});

/**
 * Garde du plan utilisateur : limitation de débit, puis session obligatoire. L'utilisateur vient de la session,
 * jamais de l'entrée ; il est ajouté au contexte sous `user`.
 */
export const userGuard = base.middleware(async ({ context, next }) => {
  enforceRateLimit(context);
  const user = await context.getSessionUser();
  if (user === null) throw new ORPCError("UNAUTHORIZED");
  return next({ context: { user } });
});

/** Gardes de plan connues : toute procédure doit commencer par l'une d'elles (test des gardes). */
export const PLAN_GUARDS: readonly AnyMiddleware[] = [publicGuard, userGuard];

export const publicProcedure = base.use(publicGuard);
export const userProcedure = base.use(userGuard);

export const routerBuilder = base;
