"use client";

import type { TaskOutput } from "@planifier/api-contract";
import { useState } from "react";

import { useListMembers } from "../queries/todo.queries";

/**
 * Option « Atténuer les tâches qui ne me sont pas assignées », liste partagée seulement. Choix de confort de celui
 * qui regarde : rien n'est écrit. Sans personnes lues (chargement, échec), l'option ne s'offre pas.
 */
export function useDimUnassigned(listId: string, shared: boolean) {
  const [dimmed, setDimmed] = useState(false);
  const members = useListMembers(listId, { enabled: shared });
  const callerId = members.data?.callerId;
  return {
    available: shared && callerId !== undefined,
    dimmed,
    setDimmed,
    isDimmed: (task: TaskOutput) => dimmed && shared && task.assignee?.userId !== callerId,
  };
}
