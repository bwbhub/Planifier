import { EMAIL_LINK_VALIDITY } from "@planifier/constants/account";

import type { MailContent } from "../mail";
import { actionMail } from "./action-mail";

/** Mot de passe oublié : le lien mène au formulaire du nouveau mot de passe. Ne part qu'à un compte vérifié. */
export function resetPasswordMail({ name, url }: { name: string; url: string }): MailContent {
  return actionMail({
    subject: "Choisis un nouveau mot de passe",
    preview: "Le lien pour choisir un nouveau mot de passe.",
    paragraphs: [
      `Bonjour ${name}, tu as demandé à changer ton mot de passe.`,
      `Le lien est valable ${EMAIL_LINK_VALIDITY}.`,
    ],
    action: { label: "Choisir un mot de passe", url },
    footer: "Tu n'as rien demandé ? Ignore cet e-mail : ton mot de passe ne change pas.",
  });
}
