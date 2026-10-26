import { EMAIL_LINK_VALIDITY } from "@planifier/constants/account";

import type { MailContent } from "../mail";
import { actionMail } from "./action-mail";

const SUBJECT = "Tu as déjà un compte Planifier";
const ATTEMPT =
  "Quelqu'un, toi sans doute, a voulu créer un compte avec cette adresse : elle en a déjà un.";
const FOOTER = "Ce n'était pas toi ? Ignore cet e-mail : rien n'a changé.";

/**
 * Inscription sur une adresse déjà inscrite : l'écran répond comme pour une inscription neuve (rien ne dit qui est
 * inscrit), et c'est cet e-mail qui donne la suite. Adresse confirmée : un lien vers la connexion. Pas encore
 * confirmée : un nouveau lien de vérification. Sans nom : celui du compte a pu être choisi par un autre.
 */
export function existingAccountMail(
  link: { verified: true; signInUrl: string } | { verified: false; verificationUrl: string },
): MailContent {
  if (link.verified) {
    return actionMail({
      subject: SUBJECT,
      preview: "Connecte-toi avec ton compte existant.",
      paragraphs: [
        ATTEMPT,
        "Connecte-toi. Mot de passe oublié ? La page de connexion permet d'en choisir un nouveau.",
      ],
      action: { label: "Me connecter", url: link.signInUrl },
      footer: FOOTER,
    });
  }
  return actionMail({
    subject: SUBJECT,
    preview: "Confirme ton adresse pour ouvrir ton compte.",
    paragraphs: [
      ATTEMPT,
      `Elle n'est pas encore confirmée : ce lien la confirme et ouvre ton espace. Il est valable ${EMAIL_LINK_VALIDITY}.`,
    ],
    action: { label: "Confirmer mon adresse", url: link.verificationUrl },
    footer: FOOTER,
  });
}
