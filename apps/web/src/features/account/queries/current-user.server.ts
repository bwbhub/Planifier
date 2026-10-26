import "server-only";

import { ORPCError } from "@orpc/client";
import type { MeOutput } from "@planifier/api-contract";
import type { ThemePreference } from "@planifier/constants/account";
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

/**
 * Thème préféré de la session, pour le layout racine. `SYSTEM` sans session, et aussi si l'API ne répond pas : le
 * thème est cosmétique, et une erreur ici empêcherait d'afficher la page d'erreur elle-même (elle vit sous ce layout).
 */
export async function getThemePreference(): Promise<ThemePreference> {
  try {
    return (await getCurrentUser())?.preferredTheme ?? "SYSTEM";
  } catch {
    return "SYSTEM";
  }
}
