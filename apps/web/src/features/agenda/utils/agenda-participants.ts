/** « Marie, Léo » ⇒ noms distincts, sans vide ; « marie » après « Marie » est le même nom. */
export function participantsFromText(text: string): string[] {
  const names = new Map<string, string>();
  for (const name of text.split(",").map((part) => part.trim())) {
    const key = name.toLocaleLowerCase("fr");
    if (name !== "" && !names.has(key)) names.set(key, name);
  }
  return [...names.values()];
}

/** « avec Marie, Léo », ou `null` sans participant. */
export function participantsLabel(participants: readonly string[]): string | null {
  return participants.length === 0 ? null : `avec ${participants.join(", ")}`;
}
