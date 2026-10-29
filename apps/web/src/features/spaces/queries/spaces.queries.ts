import {
  skipToken,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { orpc } from "@/lib/orpc";

/**
 * Invalidation centralisée du module : toute écriture sur un Espace relit les Espaces (liste, détail, liens). Quitter,
 * supprimer ou rejoindre ne relit que la liste : la page encore affichée le temps de partir (détail, aperçu
 * d'invitation) ne vaut plus pour l'appelant et ne doit pas se relire.
 */
function useSpacesCache() {
  const queryClient = useQueryClient();
  return {
    refresh: () => queryClient.invalidateQueries({ queryKey: orpc.spaces.key() }),
    refreshList: () => queryClient.invalidateQueries({ queryKey: orpc.spaces.space.list.key() }),
  };
}

/** Mes Espaces, page par page (curseur). */
export function useSpaces() {
  return useInfiniteQuery(
    orpc.spaces.space.list.infiniteOptions({
      input: (cursor: string | undefined) => ({ cursor }),
      initialPageParam: undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    }),
  );
}

/** Réglages et membres d'un Espace. Rafraîchi au retour sur l'onglet : d'autres membres le modifient. */
export function useSpace(spaceId: string) {
  return useQuery(orpc.spaces.space.get.queryOptions({ input: { spaceId } }));
}

export function useCreateSpace() {
  const cache = useSpacesCache();
  return useMutation(
    orpc.spaces.space.create.mutationOptions({ onSuccess: () => cache.refresh() }),
  );
}

export function useUpdateSpace() {
  const cache = useSpacesCache();
  return useMutation(
    orpc.spaces.space.update.mutationOptions({ onSuccess: () => cache.refresh() }),
  );
}

export function useDeleteSpace() {
  const cache = useSpacesCache();
  return useMutation(
    orpc.spaces.space.delete.mutationOptions({
      onSuccess: () => cache.refreshList(),
    }),
  );
}

export function useLeaveSpace() {
  const cache = useSpacesCache();
  return useMutation(
    orpc.spaces.space.leave.mutationOptions({
      onSuccess: () => cache.refreshList(),
    }),
  );
}

export function useSetMemberRole() {
  const cache = useSpacesCache();
  return useMutation(
    orpc.spaces.members.setRole.mutationOptions({ onSuccess: () => cache.refresh() }),
  );
}

export function useRemoveMember() {
  const cache = useSpacesCache();
  return useMutation(
    orpc.spaces.members.remove.mutationOptions({ onSuccess: () => cache.refresh() }),
  );
}

/** Liens d'invitation en cours : réservé aux propriétaires, la section n'est montrée qu'à eux. */
export function useSpaceInvites(spaceId: string) {
  return useQuery(orpc.spaces.invites.list.queryOptions({ input: { spaceId } }));
}

export function useCreateInvite() {
  const cache = useSpacesCache();
  return useMutation(
    orpc.spaces.invites.create.mutationOptions({ onSuccess: () => cache.refresh() }),
  );
}

export function useRevokeInvite() {
  const cache = useSpacesCache();
  return useMutation(
    orpc.spaces.invites.revoke.mutationOptions({ onSuccess: () => cache.refresh() }),
  );
}

/** Aperçu d'une invitation, avant de la rejoindre. Lien mort : NOT_FOUND, sans nouvel essai. */
export function useInvitePreview(token: string | null) {
  return useQuery({
    ...orpc.spaces.invites.preview.queryOptions({
      input: token === null ? skipToken : { token },
    }),
    retry: false,
  });
}

export function useAcceptInvite() {
  const cache = useSpacesCache();
  return useMutation(
    orpc.spaces.invites.accept.mutationOptions({ onSuccess: () => cache.refreshList() }),
  );
}
