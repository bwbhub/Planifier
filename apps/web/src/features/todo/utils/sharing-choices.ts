import type { AppModule } from "@planifier/constants/spaces";

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
