import type { IncomingHttpHeaders } from "node:http";

import type { User } from "@planifier/db";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";

import type { Auth } from "./auth";

/** Utilisateur de la session, tel que l'API le reçoit dans son contexte (jamais depuis l'entrée). */
export type SessionUser = Pick<User, "id" | "name" | "email">;

/** Utilisateur de la session portée par le cookie, ou `null` (absente, expirée ou révoquée). */
export async function getSessionUser(
  auth: Auth,
  headers: IncomingHttpHeaders,
): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(headers) });
  if (session === null) return null;
  const { id, name, email } = session.user;
  return { id, name, email };
}

/** Gestionnaire HTTP Node des routes de Better Auth (`AUTH_BASE_PATH`), monté par `apps/api`. */
export function createAuthNodeHandler(auth: Auth) {
  return toNodeHandler(auth);
}
