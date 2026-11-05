import { type EntriesWindow, PAGE_MAX_LIMIT } from "@planifier/api-contract";
import {
  skipToken,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect } from "react";

import { orpc } from "@/lib/orpc";

/** Une grille a besoin de toute la période : les pages suivantes se lisent d'elles-mêmes. */
function useReadAllPages(query: {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isError: boolean;
  fetchNextPage: () => Promise<unknown>;
}) {
  const { hasNextPage, isFetchingNextPage, isError, fetchNextPage } = query;
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && !isError) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, isError, fetchNextPage]);
}

/** Mes entrées de la période. `null` : rien à lire, jour inconnu ou vue fusionnée affichée. */
export function useMyEntries(period: EntriesWindow | null) {
  const query = useInfiniteQuery(
    orpc.agenda.entries.list.infiniteOptions({
      input: period === null ? skipToken : (cursor: string | undefined) => ({ ...period, cursor }),
      initialPageParam: undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    }),
  );
  useReadAllPages(query);
  return query;
}

/** Vue fusionnée d'un Espace sur la période. */
export function useSpaceEntries(period: EntriesWindow | null, spaceId: string | null) {
  const query = useInfiniteQuery(
    orpc.agenda.entries.listInSpace.infiniteOptions({
      input:
        period === null || spaceId === null
          ? skipToken
          : (cursor: string | undefined) => ({ ...period, spaceId, cursor }),
      initialPageParam: undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    }),
  );
  useReadAllPages(query);
  return query;
}

/** Mes Espaces, candidats à la vue fusionnée. Lus du module Espaces de l'API, sans passer par son code web. */
export function useAgendaSpaces() {
  return useQuery(orpc.spaces.space.list.queryOptions({ input: { limit: PAGE_MAX_LIMIT } }));
}

/** Membres de l'Espace affiché, pour filtrer par personne. */
export function useSpacePeople(spaceId: string | null) {
  return useQuery(
    orpc.spaces.space.get.queryOptions({
      input: spaceId === null ? skipToken : { spaceId },
    }),
  );
}

/** Invalidation centralisée : toute écriture du module relit ses entrées. */
function useInvalidateAgenda() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: orpc.agenda.key() });
}

export function useCreateEntry() {
  const onSuccess = useInvalidateAgenda();
  return useMutation(orpc.agenda.entries.create.mutationOptions({ onSuccess }));
}

/** Relue aussi après un refus : un conflit de version se règle en repartant de la dernière version. */
export function useUpdateEntry() {
  const onSettled = useInvalidateAgenda();
  return useMutation(orpc.agenda.entries.update.mutationOptions({ onSettled }));
}

export function useDeleteEntry() {
  const onSuccess = useInvalidateAgenda();
  return useMutation(orpc.agenda.entries.delete.mutationOptions({ onSuccess }));
}
