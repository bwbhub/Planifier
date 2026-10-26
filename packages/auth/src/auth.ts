import {
  EMAIL_LINK_TTL_SECONDS,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  THEME_PREFERENCES,
} from "@planifier/constants/account";
import { AUTH_BASE_PATH, CLIENT_IP_HEADER } from "@planifier/constants/http";
import type { Db } from "@planifier/db";
import type { SendMail } from "@planifier/mails";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { z } from "zod";

import { createAuthMails } from "./auth-mails";
import { parseDisplayName } from "./display-name";
import type { AuthEnv } from "./env";

/** Préfixe des cookies (`planifier.session_token`…). */
export const AUTH_COOKIE_PREFIX = "planifier";

/** Nom affiché validé, ou refus `BAD_REQUEST` (rien n'est écrit). */
function requireDisplayName(name: unknown): string {
  const parsed = parseDisplayName(name);
  if (parsed === null) throw new APIError("BAD_REQUEST", { message: "Nom affiché invalide." });
  return parsed;
}

/** Vrai si le corps de requête porte ce champ (même vide). */
function hasField(body: unknown, field: string): boolean {
  return typeof body === "object" && body !== null && field in body;
}

/** Instance Better Auth configurée pour Planifier (ADR 0004). */
export function createAuth(db: Db, env: AuthEnv, sendMail: SendMail) {
  const mails = createAuthMails(sendMail, {
    secret: env.BETTER_AUTH_SECRET,
    webOrigin: env.BETTER_AUTH_URL,
  });
  return betterAuth({
    appName: "Planifier",
    baseURL: env.BETTER_AUTH_URL,
    basePath: AUTH_BASE_PATH,
    secret: env.BETTER_AUTH_SECRET,
    // Seule origine admise pour les requêtes avec cookie (contrôle CSRF) et les URL de redirection.
    trustedOrigins: [new URL(env.BETTER_AUTH_URL).origin],
    database: prismaAdapter(db, { provider: "postgresql", transaction: true }),
    telemetry: { enabled: false },
    // Explicite : au niveau `info`, Better Auth journalise des adresses e-mail (inscription en double).
    logger: { level: "warn" },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: PASSWORD_MIN_LENGTH,
      maxPasswordLength: PASSWORD_MAX_LENGTH,
      // Pas de session avant l'adresse confirmée. Effet voulu : l'inscription répond pareil, que l'adresse ait déjà
      // un compte ou non (elle ne révèle plus qui est inscrit).
      requireEmailVerification: true,
      // Adresse déjà inscrite : l'écran ne le dit pas, l'e-mail à son propriétaire donne la suite.
      onExistingUserSignUp: mails.sendExistingAccount,
      sendResetPassword: mails.sendResetPassword,
      resetPasswordTokenExpiresIn: EMAIL_LINK_TTL_SECONDS,
      // Mot de passe oublié : celui qui l'avait peut-être volé perd ses sessions.
      revokeSessionsOnPasswordReset: true,
    },
    emailVerification: {
      sendVerificationEmail: mails.sendVerificationEmail,
      sendOnSignUp: true,
      // Connexion tentée avant confirmation : un nouveau lien part (le premier a pu expirer ou se perdre).
      sendOnSignIn: true,
      // Le lien ouvre la session : pas de mot de passe à retaper juste après.
      autoSignInAfterVerification: true,
      expiresIn: EMAIL_LINK_TTL_SECONDS,
    },
    user: {
      fields: { image: "avatarUrl" },
      // Modifiable par l'utilisateur (`/update-user`) ; toute autre valeur est refusée avant écriture.
      additionalFields: {
        preferredTheme: {
          type: [...THEME_PREFERENCES],
          // Toujours présent : posé à la création quand l'inscription ne le donne pas.
          required: true,
          defaultValue: "SYSTEM",
          validator: { input: z.enum(THEME_PREFERENCES) },
        },
      },
    },
    // Le nom est validé à chaque écriture (inscription, modification du profil).
    databaseHooks: {
      user: {
        create: {
          before: (user) =>
            Promise.resolve({ data: { ...user, name: requireDisplayName(user.name) } }),
        },
        update: {
          before: (user) =>
            Promise.resolve(
              user.name === undefined
                ? undefined
                : { data: { ...user, name: requireDisplayName(user.name) } },
            ),
        },
      },
    },
    // Avatar pas encore géré : `/update-user` écrirait n'importe quelle URL dans `avatarUrl`.
    hooks: {
      before: createAuthMiddleware((ctx) => {
        if (ctx.path === "/update-user" && hasField(ctx.body, "image")) {
          throw new APIError("BAD_REQUEST", { message: "Avatar non modifiable." });
        }
        return Promise.resolve();
      }),
    },
    // Toujours active, y compris en local, pour que les tests l'exercent. Mémoire : une seule instance d'API
    // pour l'instant ; à déplacer vers un stockage partagé avant d'en lancer plusieurs.
    rateLimit: { enabled: true, storage: "memory" },
    advanced: {
      // Explicite : Better Auth coupe ce contrôle (et le CSRF avec) quand il détecte un environnement de test.
      disableOriginCheck: false,
      cookiePrefix: AUTH_COOKIE_PREFIX,
      useSecureCookies: env.NODE_ENV === "production",
      // Identifiants uuid v7 générés par Prisma (`@default(uuid(7))`), comme le reste du schéma.
      database: { generateId: false },
      // Seul en-tête d'IP cru : posé par le proxy du web, jamais par le navigateur.
      ipAddress: { ipAddressHeaders: [CLIENT_IP_HEADER] },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
