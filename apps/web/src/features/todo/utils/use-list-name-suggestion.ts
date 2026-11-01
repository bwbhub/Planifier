"use client";

import { type ChangeEvent, useRef } from "react";

import { useSharingSpaces } from "../queries/todo.queries";
import { nameAfterSpaceChange } from "./list-name-suggestion";

/**
 * À la création, choisir un Espace propose « Liste <Espace> » dans le champ du nom, toujours modifiable
 * (`nameAfterSpaceChange`). À brancher sur `onChange` du formulaire : le choix d'Espace s'y entend par bulle.
 */
export function useListNameSuggestion() {
  const spaces = useSharingSpaces();
  const lastSuggestion = useRef("");

  return (event: ChangeEvent<HTMLFormElement>) => {
    const { target } = event;
    if (!(target instanceof HTMLInputElement) || target.name !== "spaceId") return;
    const nameInput = event.currentTarget.elements.namedItem("name");
    if (!(nameInput instanceof HTMLInputElement)) return;
    const space = spaces.data?.items.find(({ id }) => id === target.value);
    const next = nameAfterSpaceChange(nameInput.value, lastSuggestion.current, space?.name ?? null);
    lastSuggestion.current = next;
    nameInput.value = next;
  };
}
