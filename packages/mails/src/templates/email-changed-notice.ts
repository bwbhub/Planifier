import type { MailContent } from "../mail";
import { actionMail } from "./action-mail";

/**
 * Avis à l'**ancienne** adresse, après le changement. Sans lien (un avis qui porte un lien se copie en hameçonnage) :
 * la marche à suivre est dite en toutes lettres. Sans nom ni nouvelle adresse : l'ancienne boîte peut être celle d'un
 * tiers qui a pris le compte.
 */
export function emailChangedNoticeMail(): MailContent {
  return actionMail({
    subject: "L'adresse de ton compte Planifier a changé",
    preview: "Ton compte utilise maintenant une autre adresse.",
    paragraphs: [
      "L'adresse e-mail de ton compte Planifier vient d'être remplacée : cette adresse n'y est plus liée.",
      "Ce n'était pas toi ? Va sur Planifier, utilise « Mot de passe oublié » avec l'adresse que tu connais, puis choisis un nouveau mot de passe.",
    ],
    footer: "Tu as fait ce changement toi-même ? Rien d'autre à faire.",
  });
}
