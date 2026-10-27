/** E-mail prêt à partir : une version HTML et une version texte, pour les clients qui n'affichent pas le HTML. */
export interface Mail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/** Contenu d'un gabarit rendu, sans destinataire. */
export type MailContent = Omit<Mail, "to">;

/** Envoi d'un e-mail. Rejette si le fournisseur refuse ; le message d'erreur ne contient jamais l'adresse. */
export type SendMail = (mail: Mail) => Promise<void>;
