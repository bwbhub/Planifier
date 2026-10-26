import {
  type MailContent,
  resetPasswordMail,
  type SendMail,
  verifyEmailMail,
} from "@planifier/mails";

/** Données que Better Auth passe à ses fonctions d'envoi. */
interface LinkMailData {
  user: { email: string; name: string };
  url: string;
}

/**
 * Rendu et envoi sans attente : la réponse de Better Auth ne doit pas durer plus longtemps quand le compte existe
 * (sinon le délai révélerait l'existence d'une adresse), ni échouer si l'e-mail échoue. Un échec est journalisé sans
 * adresse ni lien.
 */
function sendInBackground(sendMail: SendMail, to: string, render: () => MailContent, kind: string) {
  Promise.resolve()
    .then(() => sendMail({ to, ...render() }))
    .catch((error: unknown) => {
      const cause = error instanceof Error ? error.message : "inconnue";
      console.error(JSON.stringify({ level: "error", message: "e-mail non envoyé", kind, cause }));
    });
  return Promise.resolve();
}

/** Fonctions d'envoi branchées dans la configuration de Better Auth. */
export function createAuthMails(sendMail: SendMail) {
  return {
    sendVerificationEmail: ({ user, url }: LinkMailData) =>
      sendInBackground(
        sendMail,
        user.email,
        () => verifyEmailMail({ name: user.name, url }),
        "verification",
      ),
    sendResetPassword: ({ user, url }: LinkMailData) =>
      sendInBackground(
        sendMail,
        user.email,
        () => resetPasswordMail({ name: user.name, url }),
        "reset-password",
      ),
  };
}
