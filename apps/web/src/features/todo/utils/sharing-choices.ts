import type { TodoListOutput, UpdateListInput } from "@planifier/api-contract";
import type { AppModule, ShareLevel } from "@planifier/constants/spaces";

/** Valeur du choix « Partager avec » pour une liste perso. */
export const PERSONAL = "";

/** Ce que les membres de l'Espace choisi peuvent faire. */
export type SharingLevel = Exclude<ShareLevel, "NONE">;

type ListSharing = Pick<TodoListOutput, "space" | "readOnlySpace">;

/** Espace avec lequel la liste est partagée, à un niveau ou l'autre. */
export function sharedSpace({ space, readOnlySpace }: ListSharing) {
  return space ?? readOnlySpace;
}

/** Champ de partage d'une liste à créer : aucun pour une liste perso. */
function creationFields(chosen: string, level: SharingLevel) {
  if (chosen === PERSONAL) return {};
  return level === "WRITE" ? { spaceId: chosen } : { readOnlySpaceId: chosen };
}

/** Les deux champs, l'un à `null` ; aucun si rien ne change (changer le partage demande d'en être propriétaire). */
function updateFields(chosen: string, level: SharingLevel, list: ListSharing) {
  const shared = chosen === PERSONAL ? null : chosen;
  const spaceId = level === "WRITE" ? shared : null;
  const readOnlySpaceId = level === "READ" ? shared : null;
  const sameSpace = spaceId === (list.space?.id ?? null);
  const sameReadOnlySpace = readOnlySpaceId === (list.readOnlySpace?.id ?? null);
  return sameSpace && sameReadOnlySpace ? {} : { spaceId, readOnlySpaceId };
}

/** Champs de partage à envoyer pour l'Espace `chosen` (`PERSONAL` : aucun) au niveau `level`. */
export function sharingFields(
  chosen: string,
  level: SharingLevel,
  list: ListSharing | undefined,
): Partial<Pick<UpdateListInput, "spaceId" | "readOnlySpaceId">> {
  return list === undefined ? creationFields(chosen, level) : updateFields(chosen, level, list);
}

interface SpaceChoice {
  id: string;
  name: string;
}

/**
 * Espaces proposés pour partager une liste : ceux de `spaces` où Todo est activé, plus son Espace actuel s'il n'en
 * fait plus partie (Todo désactivé depuis) : on le voit encore choisi, et le garder ne change rien.
 */
export function sharingChoices(
  spaces: readonly (SpaceChoice & { modules: readonly AppModule[] })[],
  current: SpaceChoice | null,
): SpaceChoice[] {
  const withTodo = spaces
    .filter(({ modules }) => modules.includes("TODO"))
    .map(({ id, name }) => ({ id, name }));
  if (current === null || withTodo.some(({ id }) => id === current.id)) return withTodo;
  return [current, ...withTodo];
}
