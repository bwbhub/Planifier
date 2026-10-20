import "server-only";

import { ORPCError } from "@orpc/client";
import type { MeOutput } from "@planifier/api-contract";
import { cache } from "react";

import { createServerApiClient } from "@/lib/orpc.server";

/**
 * Utilisateur de la session, ou `null` sans session valide. Un seul appel par rendu (`cache`). Sert aux redirections
 * des pages ; l'autorité reste l'API, qui revérifie la session à chaque procédure.
 */
export const getCurrentUser = cache(async (): Promise<MeOutput | null> => {
  const api = await createServerApiClient();
  try {
    return await api.account.me.get({});
  } catch (error) {
    if (error instanceof ORPCError && error.code === "UNAUTHORIZED") return null;
    throw error;
  }
});
