import type { ContractRouterClient } from "@orpc/contract";

import { meContract } from "./features/account/me/me.contract";
import { healthContract } from "./features/system/health/health.contract";

/** Contrat complet de l'API : source unique des types côté serveur et côté client (ADR 0003). */
export const contract = {
  system: { health: healthContract },
  account: { me: meContract },
};

/** Client typé de l'API, dérivé du contrat. */
export type ApiClient = ContractRouterClient<typeof contract>;

export type { HealthOutput } from "./features/system/health/health.schemas";
export type { MeOutput } from "./features/account/me/me.schemas";
export {
  AUTH_ERROR_CODES,
  AUTH_ROUTES,
  authErrorBodySchema,
  signInInputSchema,
  signUpInputSchema,
  type SignInInput,
  type SignUpInput,
} from "./features/account/auth/auth.schemas";
