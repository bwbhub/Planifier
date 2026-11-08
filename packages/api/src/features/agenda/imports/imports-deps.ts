import type { SecretBox } from "./secret-box";

/** Ce que l'import d'agendas demande au monde extérieur, injecté pour tester sans réseau ni horloge. */
export interface ImportsDeps {
  /** Lit le flux d'un lien privé (liste blanche, adresses publiques, taille et durée bornées). */
  fetchFeed: (link: string) => Promise<string>;
  /** Chiffre les liens privés stockés. */
  secretBox: SecretBox;
  now: () => Date;
}
