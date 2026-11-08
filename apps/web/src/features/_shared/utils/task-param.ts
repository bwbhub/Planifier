import { TASK_PARAM } from "@/lib/routes";

/** Adresse de `pathname` avec `?tache=<id>` (autres paramètres gardés) ; `taskId` nul : le paramètre est retiré. */
export function hrefWithTask(
  pathname: string,
  searchParams: URLSearchParams,
  taskId: string | null,
): string {
  const params = new URLSearchParams(searchParams);
  if (taskId === null) params.delete(TASK_PARAM);
  else params.set(TASK_PARAM, taskId);
  const query = params.toString();
  return query === "" ? pathname : `${pathname}?${query}`;
}

// Le détail s'est ouvert depuis l'application (pas par un lien profond) : l'entrée d'historique qu'on y a ajoutée
// se défait en revenant en arrière, au lieu d'en empiler une autre. Perdu au rechargement, comme l'historique interne.
let openedInApp = false;

export function markTaskOpenedInApp(): void {
  openedInApp = true;
}

/** Lit puis efface : vrai une seule fois par ouverture. */
export function consumeTaskOpenedInApp(): boolean {
  const value = openedInApp;
  openedInApp = false;
  return value;
}
