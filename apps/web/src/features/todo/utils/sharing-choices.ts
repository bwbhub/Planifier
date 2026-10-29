interface SpaceChoice {
  id: string;
  name: string;
}

/**
 * Espaces proposés pour partager une liste : ceux où Todo est activé, plus son Espace actuel s'il n'en fait plus
 * partie (Todo désactivé depuis) : on le voit encore choisi, et le garder ne change rien.
 */
export function sharingChoices(
  spaces: readonly SpaceChoice[],
  current: SpaceChoice | null,
): SpaceChoice[] {
  if (current === null || spaces.some(({ id }) => id === current.id)) return [...spaces];
  return [current, ...spaces];
}
