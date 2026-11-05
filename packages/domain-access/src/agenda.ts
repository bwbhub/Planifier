import type { AppModule } from "@planifier/constants/spaces";

import type { ResourceAction } from "./resource";

/** Ce que l'on sait d'une entrée d'agenda et de l'appelant. */
export interface AgendaEntryAccess {
  userId: string;
  ownerId: string;
  /** Cachée de la vue fusionnée. */
  hidden: boolean;
  /** L'appelant partage avec le propriétaire un Espace dont `spaceAgendaScope` vaut `MEMBERS`. */
  sharesAgendaSpace: boolean;
}

/**
 * L'agenda est personnel : tout à son propriétaire. Les autres ne font que lire, par un Espace commun, et jamais une
 * entrée masquée. Rien n'est stocké côté partage : quitter l'Espace coupe l'accès. `read` faux ⇒ NOT_FOUND.
 */
export function canAccessAgendaEntry(
  { userId, ownerId, hidden, sharesAgendaSpace }: AgendaEntryAccess,
  action: ResourceAction,
): boolean {
  if (userId === ownerId) return true;
  return action === "read" && sharesAgendaSpace && !hidden;
}

/** Réglages d'un Espace qui décident de sa vue fusionnée. */
export interface AgendaSpace {
  modules: readonly AppModule[];
  restrictVisibility: boolean;
}

/**
 * Vue fusionnée d'un Espace, pour un de ses membres : `DISABLED`, Agenda non activé ; `OWN`, l'Espace restreint sa
 * visibilité et chacun n'y voit que ses entrées ; `MEMBERS`, les entrées de tous.
 */
export function spaceAgendaScope({
  modules,
  restrictVisibility,
}: AgendaSpace): "DISABLED" | "OWN" | "MEMBERS" {
  if (!modules.includes("AGENDA")) return "DISABLED";
  return restrictVisibility ? "OWN" : "MEMBERS";
}
