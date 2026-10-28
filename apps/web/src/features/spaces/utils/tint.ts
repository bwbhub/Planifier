// Teintes des tokens (`packages/tokens`), écrites en entier pour que Tailwind les trouve dans le code.
const TINTS = [
  { background: "bg-tint-general", border: "border-tint-general" },
  { background: "bg-tint-work", border: "border-tint-work" },
  { background: "bg-tint-couple", border: "border-tint-couple" },
  { background: "bg-tint-trip", border: "border-tint-trip" },
] as const;

export type Tint = (typeof TINTS)[number];

/**
 * Teinte stable d'un Espace ou d'une personne, tirée de son identifiant : elle ne change pas quand on renomme.
 * Aucune couleur n'est stockée ; changer les teintes se fait dans les tokens.
 */
export function tintOf(id: string): Tint {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) % 1_000_003;
  return TINTS[hash % TINTS.length] ?? TINTS[0];
}

/** Initiale affichée dans une pastille, à partir d'un nom. */
export function initialOf(name: string): string {
  const first = name.trim().at(0);
  return first === undefined ? "?" : first.toLocaleUpperCase("fr");
}
