"use client";

import type { SpaceDetailOutput } from "@planifier/api-contract";
import type { ReactNode } from "react";

import { ListSkeleton } from "../atoms/list-skeleton";
import { LoadError } from "../atoms/load-error";
import { SpaceNotFound } from "../atoms/space-not-found";
import { SPACE_LABELS } from "../labels";
import { useSpace } from "../queries/spaces.queries";
import { isSpaceNotFound } from "../utils/space-error-message";

interface SpaceGateProps {
  spaceId: string;
  /** Lignes fantômes pendant le chargement. */
  rows?: number;
  /** `reload` : relire l'Espace (après une modification concurrente). */
  children: (space: SpaceDetailOutput, reload: () => void) => ReactNode;
}

/** Lit un Espace et ne rend la suite qu'une fois lu : chargement, introuvable et erreur traités ici, une fois. */
export function SpaceGate({ spaceId, rows, children }: SpaceGateProps) {
  const space = useSpace(spaceId);
  const reload = () => void space.refetch();

  if (space.isPending) return <ListSkeleton label={SPACE_LABELS.loading} rows={rows} />;
  if (space.isError) {
    if (isSpaceNotFound(space.error)) return <SpaceNotFound />;
    return <LoadError message={SPACE_LABELS.loadFailed} onRetry={reload} />;
  }
  return children(space.data, reload);
}
