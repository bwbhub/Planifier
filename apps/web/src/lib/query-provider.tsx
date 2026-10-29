"use client";

import { ORPCError } from "@orpc/client";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";

import { ROUTES } from "./routes";

function isUnauthorized(error: unknown): boolean {
  return error instanceof ORPCError && error.code === "UNAUTHORIZED";
}

const MAX_QUERY_RETRIES = 3;

/**
 * Réessayer une lecture seulement si l'échec peut passer (réseau, serveur) : un refus (introuvable, interdit…)
 * resterait le même, et ferait attendre plusieurs secondes avant de l'expliquer.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ORPCError && error.status < 500) return false;
  return failureCount < MAX_QUERY_RETRIES;
}

/**
 * Un QueryClient par navigateur, et par requête pendant le rendu serveur (jamais partagé entre utilisateurs).
 * Session expirée ou révoquée (`UNAUTHORIZED` sur n'importe quel appel) : retour à la connexion, cache vidé.
 * Lectures réessayées sur panne seulement (`shouldRetry`).
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [queryClient] = useState(() => {
    const onError = (error: unknown) => {
      if (!isUnauthorized(error)) return;
      client.clear();
      router.replace(ROUTES.signIn);
    };
    const client: QueryClient = new QueryClient({
      queryCache: new QueryCache({ onError }),
      mutationCache: new MutationCache({ onError }),
      defaultOptions: { queries: { retry: shouldRetry } },
    });
    return client;
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
