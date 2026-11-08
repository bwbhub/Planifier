import { AGENDA_IMPORT_STALE_HOURS } from "@planifier/constants/agenda";
import { useEffect, useRef } from "react";

import { useImports, useRefreshImport } from "../queries/imports.queries";

const STALE_MS = AGENDA_IMPORT_STALE_HOURS * 3_600_000;

/**
 * Pas de tâche planifiée : à l'ouverture de l'Agenda, les agendas importés lus il y a plus de six heures sont relus
 * (une fois par ouverture). Un agenda en échec n'est pas relancé tout seul : l'écran des agendas importés dit
 * pourquoi, et « Actualiser » reste un geste de l'utilisateur.
 */
export function useAutoRefreshImports() {
  const { data } = useImports();
  const { mutate } = useRefreshImport();
  const done = useRef(false);

  useEffect(() => {
    if (data === undefined || done.current) return;
    done.current = true;
    const now = Date.now();
    for (const { id, lastFetchedAt, lastError } of data.items) {
      const stale = lastFetchedAt === null || now - lastFetchedAt.getTime() > STALE_MS;
      if (stale && lastError === null) mutate({ subscriptionId: id });
    }
  }, [data, mutate]);
}
