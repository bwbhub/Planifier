"use client";

import type { TaskOutput } from "@planifier/api-contract";
import { createContext, useContext } from "react";

/** Ce que la liste affichée dit à ses tâches et formulaires, à toute profondeur (sous-tâches comprises). */
export interface ListView {
  /** Liste partagée : une tâche s'assigne et, cochée, dit par qui. */
  shared: boolean;
  /** Lecture seule : ni ajout, ni coche, ni modification. */
  readOnly: boolean;
  /** Ligne par ligne : une sous-tâche garde son propre état sous sa tâche. */
  isDimmed: (task: TaskOutput) => boolean;
}

const ListViewContext = createContext<ListView>({
  shared: false,
  readOnly: false,
  isDimmed: () => false,
});

export const ListViewProvider = ListViewContext.Provider;

export function useListView() {
  return useContext(ListViewContext);
}
