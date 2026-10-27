import { AUTH_PAGES, EMAIL_LINK_TTL_SECONDS } from "@planifier/constants/account";
import { AUTH_BASE_PATH } from "@planifier/constants/http";
import {
  existingAccountMail,
  type MailContent,
  resetPasswordMail,
  type SendMail,
  verifyEmailMail,
} from "@planifier/mails";
import { createEmailVerificationToken } from "better-auth/api";

/** Ce que Better Auth sait du compte quand il demande un envoi. */
interface MailUser {
  email: string;
  name: string;
  emailVerified: boolean;
}

/** Ce qu'il faut pour fabriquer des liens hors des routes de Better Auth (compte déjà inscrit). */
export interface AuthLinks {
  secret: string;
  /** Origine publique du web (`BETTER_AUTH_URL`). */
  webOrigin: string;
}

type MailKind = "verification" | "reset-password" | "existing-account";

/**
 * Rendu et envoi sans attente : la réponse de Better Auth ne doit pas durer plus longtemps quand le compte existe
 * (sinon le délai révélerait l'existence d'une adresse), ni échouer si l'e-mail échoue. Un échec est journalisé sans
 * adresse ni lien.
 */
function sendInBackground(
  sendMail: SendMail,
  kind: MailKind,
  to: string,
  render: () => MailContent | Promise<MailContent>,
) {
  Promise.resolve()
    .then(render)
    .then((content) => sendMail({ to, ...content }))
    .catch((error: unknown) => {
      const cause = error instanceof Error ? error.message : "inconnue";
      console.error(JSON.stringify({ level: "error", message: "e-mail non envoyé", kind, cause }));
    });
  return Promise.resolve();
}

/** Lien de vérification d'adresse, comme celui que fabrique Better Auth (`/verify-email`). */
async function verificationUrl(links: AuthLinks, email: string): Promise<string> {
  const token = await createEmailVerificationToken(
    links.secret,
    email,
    undefined,
    EMAIL_LINK_TTL_SECONDS,
  );
  const url = new URL(`${AUTH_BASE_PATH}/verify-email`, links.webOrigin);
  url.searchParams.set("token", token);
  url.searchParams.set("callbackURL", AUTH_PAGES.signIn);
  return url.toString();
}

/** Fonctions d'envoi branchées dans la configuration de Better Auth. */
export function createAuthMails(sendMail: SendMail, links: AuthLinks) {
  return {
    sendVerificationEmail: ({ user, url }: { user: MailUser; url: string }) =>
      sendInBackground(sendMail, "verification", user.email, () => verifyEmailMail({ url })),
    sendResetPassword: ({ user, url }: { user: MailUser; url: string }) =>
      sendInBackground(sendMail, "reset-password", user.email, () =>
        resetPasswordMail({ name: user.name, url }),
      ),
    sendExistingAccount: ({ user }: { user: MailUser }) =>
      sendInBackground(sendMail, "existing-account", user.email, async () =>
        user.emailVerified
          ? existingAccountMail({
              verified: true,
              signInUrl: new URL(AUTH_PAGES.signIn, links.webOrigin).toString(),
            })
          : existingAccountMail({
              verified: false,
              verificationUrl: await verificationUrl(links, user.email),
            }),
      ),
  };
}
