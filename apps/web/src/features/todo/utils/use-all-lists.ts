"use client";

import { useEffect } from "react";

import { useTodoLists } from "../queries/todo.queries";
import { allLists } from "./list-pages";

/** Toutes mes listes, pages suivantes lues d'elles-mêmes (le choix d'une liste ne doit pas en oublier). */
export function useAllLists() {
  const lists = useTodoLists();
  const { hasNextPage, isFetchingNextPage, isError, fetchNextPage } = lists;
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && !isError) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, isError, fetchNextPage]);
  return { lists, items: lists.isSuccess ? allLists(lists.data) : [], loading: hasNextPage };
}
