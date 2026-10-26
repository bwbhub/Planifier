import type { SendMail } from "../mail";

/** Domaine d'une adresse, en minuscules. */
function domainOf(address: string): string {
  return address.slice(address.lastIndexOf("@") + 1).toLowerCase();
}

/**
 * Bac à sable : n'envoie qu'aux domaines listés, écarte le reste sans erreur (l'appelant ne doit pas savoir si
 * l'e-mail est parti). L'écart est journalisé sans l'adresse.
 */
export function restrictToDomains(send: SendMail, domains: readonly string[]): SendMail {
  const allowed = new Set(domains);
  return (mail) => {
    if (allowed.has(domainOf(mail.to))) return send(mail);
    console.warn(
      JSON.stringify({ level: "warn", message: "e-mail écarté : domaine hors bac à sable" }),
    );
    return Promise.resolve();
  };
}
