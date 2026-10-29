import type { AppModule, SpaceRole } from "@planifier/constants/spaces";

import { COMMON_LABELS } from "@/lib/labels";

/** Libellés du module repris à plusieurs endroits. Catalogue unique : les traductions le remplaceront par langue. */
export const SPACE_LABELS = {
  myList: "Mes Espaces",
  newSpace: "Nouvel Espace",
  settings: "Réglages de l'Espace",
  join: "Rejoindre l'Espace",
  open: "Ouvrir l'Espace",
  create: "Créer un Espace",
  leave: "Quitter l'Espace",
  remove: "Retirer de l'Espace",
  backToList: "Retour à mes Espaces",
  backToSpace: "Retour à l'Espace",
  loading: "Chargement de l'Espace…",
  loadFailed: `L'Espace n'a pas pu être chargé. ${COMMON_LABELS.nothingLost}`,
  opening: "Ouverture de l'invitation…",
  members: "Membres",
  inviteLink: "Lien d'invitation",
  inviteLinks: "Liens d'invitation",
  modules: "Modules de l'Espace",
  noModules: "aucun module",
  /** Après un départ ou un retrait : on ne revient que par un nouveau lien. */
  comeBackWithLink: "Pour revenir, il faudra un nouveau lien d'invitation.",
} as const;

export const SPACE_ROLE_LABELS: Record<SpaceRole, string> = {
  OWNER: "Propriétaire",
  MEMBER: "Membre",
};

/** Modules qu'un Espace peut activer, dans l'ordre de la navigation. Le Journal n'en fait pas partie : jamais partagé. */
export const SPACE_MODULE_LABELS: Record<AppModule, { label: string; hint: string }> = {
  TODO: { label: "Todo", hint: "Des listes de tâches à plusieurs." },
  AGENDA: { label: "Agenda", hint: "Voir vos agendas ensemble." },
  EVENTS: { label: "Événements", hint: "Organiser une sortie, un repas, un week-end." },
};

/** Visibilité dans l'Espace : `restricted` = chacun voit seulement ce qu'on partage avec lui. */
export const VISIBILITY_LABELS = {
  title: "Visibilité",
  toggle: "Restreindre la visibilité",
  restricted: { value: "Restreinte", hint: "Chacun voit seulement ce qu'on partage avec lui." },
  open: { value: "Pour tous", hint: "Chaque membre voit tout ce qui est dans l'Espace." },
} as const;

/** « 1 personne », « 4 personnes ». */
export function peopleCount(count: number): string {
  return `${String(count)} ${count > 1 ? "personnes" : "personne"}`;
}
