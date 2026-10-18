import type { ContractRouterClient } from "@orpc/contract";

import { healthContract } from "./features/system/health/health.contract";

/** Contrat complet de l'API : source unique des types côté serveur et côté client (ADR 0003). */
export const contract = {
  system: { health: healthContract },
};

/** Client typé de l'API, dérivé du contrat. */
export type ApiClient = ContractRouterClient<typeof contract>;

export type { HealthOutput } from "./features/system/health/health.schemas";
