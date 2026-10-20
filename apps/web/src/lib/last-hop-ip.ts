import { isIP } from "node:net";

/**
 * IP du client vue par le dernier relais : entrée la plus à droite de `x-forwarded-for`. Next la renseigne avec
 * l'adresse du socket quand l'en-tête est absent ; derrière le répartiteur de l'hébergeur, c'est lui qui l'ajoute.
 * Les entrées plus à gauche viennent du navigateur et ne sont jamais crues. `null` si absente ou invalide.
 */
export function lastHopIpOf(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  const last = forwarded?.split(",").at(-1)?.trim() ?? "";
  return isIP(last) === 0 ? null : last;
}
