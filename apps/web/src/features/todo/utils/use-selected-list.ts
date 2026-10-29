"use client";

import { useEffect } from "react";

import { useTodoLists } from "../queries/todo.queries";
import { allLists } from "./list-pages";

/**
 * Listes lues page par page, jusqu'à trouver celle de l'adresse (`?liste=`, lien partagé ou liste tout juste créée) :
 * sans cela, une liste au-delà de la première page serait remplacée sans un mot par la première.
 */
export function useSelectedList(selectedListId: string | null) {
  const lists = useTodoLists();
  const items = lists.isSuccess ? allLists(lists.data) : [];
  // Échec d'une page : la requête passe en erreur (plus `isSuccess`), la recherche s'arrête sans boucler.
  const searching =
    lists.isSuccess &&
    selectedListId !== null &&
    lists.hasNextPage &&
    !items.some(({ id }) => id === selectedListId);
  const { fetchNextPage, isFetchingNextPage } = lists;

  useEffect(() => {
    if (searching && !isFetchingNextPage) void fetchNextPage();
  }, [searching, isFetchingNextPage, fetchNextPage]);

  return { lists, items, searching };
}
