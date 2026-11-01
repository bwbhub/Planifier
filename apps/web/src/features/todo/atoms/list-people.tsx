"use client";

import { AvatarStack } from "@planifier/ui/components/avatar-stack";

import { useListMembers } from "../queries/todo.queries";

/**
 * Pastilles des personnes d'une liste partagée. Complément de l'en-tête : en chargement ou en échec, rien ne
 * s'affiche (l'Espace est déjà nommé à côté).
 */
export function ListPeople({ listId }: { listId: string }) {
  const members = useListMembers(listId);
  if (!members.isSuccess) return null;
  const people = members.data.items;
  return (
    <AvatarStack
      people={people.map(({ userId, name }) => ({ id: userId, name }))}
      label={`Personnes de la liste : ${people.map(({ name }) => name).join(", ")}`}
    />
  );
}
