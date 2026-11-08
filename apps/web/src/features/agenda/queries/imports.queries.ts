import { useMutation, useQuery } from "@tanstack/react-query";

import { orpc } from "@/lib/orpc";

import { useInvalidateAgenda } from "./agenda.queries";

/** Mes agendas importés (jamais leur lien). */
export function useImports() {
  return useQuery(orpc.agenda.imports.list.queryOptions({ input: {} }));
}

export function useCreateImport() {
  const onSuccess = useInvalidateAgenda();
  return useMutation(orpc.agenda.imports.create.mutationOptions({ onSuccess }));
}

/** Relue aussi après un échec : la raison est gardée côté serveur, et des entrées ont pu changer. */
export function useRefreshImport() {
  const onSettled = useInvalidateAgenda();
  return useMutation(orpc.agenda.imports.refresh.mutationOptions({ onSettled }));
}

/** Retirer un agenda retire aussi ses entrées : toute la grille se relit. */
export function useDeleteImport() {
  const onSuccess = useInvalidateAgenda();
  return useMutation(orpc.agenda.imports.delete.mutationOptions({ onSuccess }));
}
