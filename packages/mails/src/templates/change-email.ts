import { EMAIL_LINK_VALIDITY } from "@planifier/constants/account";

import type { MailContent } from "../mail";
import { actionMail } from "./action-mail";

/**
 * Changement d'adresse : part à la **nouvelle** adresse, le lien la confirme. Sans le nom du compte : l'adresse est
 * saisie par qui est connecté, elle n'est peut-être pas celle de la personne qui lit (hameçonnage).
 */
export function changeEmailMail({ url }: { url: string }): MailContent {
  return actionMail({
    subject: "Confirme ta nouvelle adresse e-mail",
    preview: "Un clic pour changer l'adresse de ton compte.",
    paragraphs: [
      "Quelqu'un, toi sans doute, veut utiliser cette adresse pour son compte Planifier.",
      `Confirme-la : elle remplacera l'ancienne. Le lien est valable ${EMAIL_LINK_VALIDITY}.`,
    ],
    action: { label: "Confirmer ma nouvelle adresse", url },
    footer: "Ce n'était pas toi ? Ignore cet e-mail : rien ne change.",
  });
}
