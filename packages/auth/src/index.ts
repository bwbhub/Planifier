import { getDb } from "@planifier/db";

import { type Auth, createAuth } from "./auth";
import { getAuthEnv } from "./env";

export { AUTH_COOKIE_PREFIX, createAuth, type Auth } from "./auth";
export { parseAuthEnv, type AuthEnv } from "./env";
export { createAuthNodeHandler, getSessionUser, type SessionUser } from "./session";

let cached: Auth | undefined;

/** Instance unique du processus, créée au premier appel (environnement validé à ce moment). */
export function getAuth(): Auth {
  cached ??= createAuth(getDb(), getAuthEnv());
  return cached;
}
