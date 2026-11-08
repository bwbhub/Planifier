import { APIError, type createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { z } from "zod";

import { readEmailTokenPayload } from "./email-token";

type HookContext = Parameters<Parameters<typeof createAuthMiddleware>[0]>[0];

const BodyWithPassword = z.object({ currentPassword: z.string() });
const QueryWithToken = z.object({ token: z.string() });

/**
 * Changement d'adresse : le mot de passe actuel (`currentPassword`, lu dans le corps brut) est vérifié ici, côté
 * serveur, avant tout envoi. Une session volée ne suffit plus à rediriger le compte vers une autre adresse.
 */
export async function requireCurrentPassword(ctx: HookContext): Promise<void> {
  const session = await getSessionFromCtx(ctx);
  if (!session) throw new APIError("UNAUTHORIZED", { message: "Non connecté." });
  const password = BodyWithPassword.safeParse(ctx.body);
  const accounts = await ctx.context.internalAdapter.findAccounts(session.user.id);
  const hash = accounts.find((account) => account.providerId === "credential")?.password;
  const valid =
    password.success &&
    typeof hash === "string" &&
    (await ctx.context.password.verify({ hash, password: password.data.currentPassword }));
  if (!valid) {
    throw new APIError("BAD_REQUEST", {
      message: "Mot de passe actuel incorrect.",
      code: "INVALID_PASSWORD",
    });
  }
}

/**
 * Ancienne adresse d'un compte dont l'adresse vient d'être remplacée par un lien de changement, sinon `null`. Appelé
 * après l'écriture : le jeton de la requête a donc été validé par Better Auth, et son contenu peut être lu.
 */
function previousEmailFromChangeToken(query: unknown, newEmail: string): string | null {
  const token = QueryWithToken.safeParse(query);
  const payload = token.success ? readEmailTokenPayload(token.data.token) : null;
  return payload?.requestType === "change-email-verification" && payload.updateTo === newEmail
    ? payload.email
    : null;
}

/** Hook « après écriture » d'un compte : avis à l'ancienne adresse quand un lien de changement vient de servir. */
export function noticeOnEmailChange(sendNotice: (oldEmail: string) => Promise<void>) {
  return (
    user: { email: string },
    ctx: { path?: string; query?: unknown } | null,
  ): Promise<void> => {
    // Seul le lien de vérification porte un jeton validé par Better Auth : sur les autres routes, la requête est libre.
    if (ctx?.path !== "/verify-email") return Promise.resolve();
    const oldEmail = previousEmailFromChangeToken(ctx.query, user.email);
    return oldEmail === null ? Promise.resolve() : sendNotice(oldEmail);
  };
}
