import { EMAIL_LINK_VALIDITY } from "@planifier/constants/account";

import type { MailContent } from "../mail";
import { actionMail } from "./action-mail";

/**
 * Vérification d'adresse : le lien confirme l'adresse et ouvre la session. Sans le nom du compte : il est choisi par
 * qui s'inscrit, et partirait vers une adresse qui n'est peut-être pas la sienne (hameçonnage).
 */
export function verifyEmailMail({ url }: { url: string }): MailContent {
  return actionMail({
    subject: "Confirme ton adresse e-mail",
    preview: "Un clic pour confirmer ton adresse.",
    paragraphs: [
      "Confirme ton adresse pour ouvrir ton espace Planifier.",
      `Le lien est valable ${EMAIL_LINK_VALIDITY}.`,
    ],
    action: { label: "Confirmer mon adresse", url },
    footer: "Tu n'as pas créé de compte Planifier ? Ignore cet e-mail : rien ne sera fait.",
  });
}
