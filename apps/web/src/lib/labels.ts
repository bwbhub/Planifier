/**
 * Libellés communs à toute l'app (actions, états). Un seul catalogue par portée : les traductions viendront le
 * remplacer langue par langue, sans toucher aux composants.
 */
export const COMMON_LABELS = {
  appName: "Planifier",
  cancel: "Annuler",
  save: "Enregistrer",
  saving: "Enregistrement…",
  creating: "Création…",
  loading: "Chargement…",
  retry: "Réessayer",
  showMore: "Afficher plus",
  goHome: "Aller à l'accueil",
} as const;

/** Titre d'onglet d'une page : « Mes Espaces · Planifier ». */
export function pageTitle(page: string): string {
  return `${page} · ${COMMON_LABELS.appName}`;
}
