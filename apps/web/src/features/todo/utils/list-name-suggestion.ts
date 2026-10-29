import { TODO_LIST_NAME_MAX_LENGTH } from "@planifier/constants/todo";

/** Nom proposé pour une liste partagée avec un Espace (« Liste Coloc »), coupé à la longueur permise. */
export function suggestedListName(spaceName: string): string {
  return `Liste ${spaceName}`.slice(0, TODO_LIST_NAME_MAX_LENGTH);
}

/**
 * Nom après un changement d'Espace à la création : il suit l'Espace choisi (vide pour une liste perso) tant que
 * l'utilisateur n'a pas écrit le sien, c'est-à-dire tant que le champ est vide ou garde la dernière proposition.
 */
export function nameAfterSpaceChange(
  currentName: string,
  lastSuggestion: string,
  spaceName: string | null,
): string {
  if (currentName !== "" && currentName !== lastSuggestion) return currentName;
  return spaceName === null ? "" : suggestedListName(spaceName);
}
