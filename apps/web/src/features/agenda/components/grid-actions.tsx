"use client";

import { createContext, type ReactNode, useContext } from "react";

import { EntryBlock, type EntryBlockProps } from "../atoms/entry-block";
import type { AgendaItem } from "../utils/agenda-items";
import type { EntryMove } from "../utils/use-entry-move";

interface GridActions {
  move: EntryMove;
  onOpen: (item: AgendaItem) => void;
}

const GridActionsContext = createContext<GridActions | null>(null);

/** Ce que font les entrées d'une grille : s'ouvrir, se déplacer. Évite de le faire descendre de colonne en colonne. */
export function GridActionsProvider({
  value,
  children,
}: {
  value: GridActions;
  children: ReactNode;
}) {
  return <GridActionsContext value={value}>{children}</GridActionsContext>;
}

export function useGridActions(): GridActions {
  const actions = useContext(GridActionsContext);
  if (actions === null) throw new Error("Entrée de grille hors de `GridActionsProvider`.");
  return actions;
}

/** Bloc d'une entrée de la grille, branché sur l'ouverture et le déplacement. */
export function GridEntry(props: Omit<EntryBlockProps, "onOpen" | "onPress" | "moving">) {
  const { move, onOpen } = useGridActions();
  return (
    <EntryBlock
      {...props}
      onOpen={onOpen}
      onPress={move.onPress}
      moving={move.movingOf(props.item.id)}
    />
  );
}
