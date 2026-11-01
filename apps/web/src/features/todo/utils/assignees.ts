import type { TaskOutput } from "@planifier/api-contract";

type Person = NonNullable<TaskOutput["assignee"]>;

/**
 * Choix du champ « Assignée à » : personne d'abord, jamais imposé. L'assigné actuel reste proposé même absent d'une
 * liste de personnes périmée : le formulaire ne l'effacerait pas sans qu'on l'ait demandé.
 */
export function assigneeOptions(members: readonly Person[], current: Person | null) {
  const listed = current === null || members.some(({ userId }) => userId === current.userId);
  const people = listed ? members : [...members, current];
  return [
    { value: "", label: "Personne" },
    ...people.map(({ userId, name }) => ({ value: userId, label: name })),
  ];
}

/** Champ absent (liste perso, personnes pas encore lues) : `undefined`, rien ne change ; « Personne » : `null`. */
export function assigneeFromForm(value: FormDataEntryValue | null): string | null | undefined {
  if (typeof value !== "string") return undefined;
  return value === "" ? null : value;
}
