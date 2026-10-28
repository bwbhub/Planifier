"use client";

import type { SpaceDetailOutput } from "@planifier/api-contract";
import type { ReactNode } from "react";

import { ListSkeleton } from "@planifier/ui/components/list-skeleton";
import { LoadError } from "@planifier/ui/components/load-error";
import { COMMON_LABELS } from "@/lib/labels";

import { SpaceNotFound } from "../atoms/space-not-found";
import { SPACE_LABELS } from "../labels";
import { useSpace } from "../queries/spaces.queries";
import { isSpaceNotFound } from "../utils/space-error-message";

interface SpaceGateProps {
  spaceId: string;
  /** Lignes fantômes pendant le chargement. */
  rows?: number;
  /** `reload` : relire l'Espace (après une modification concurrente) ; résolue une fois la lecture finie. */
  children: (space: SpaceDetailOutput, reload: () => Promise<void>) => ReactNode;
}

/** Lit un Espace et ne rend la suite qu'une fois lu : chargement, introuvable et erreur traités ici, une fois. */
export function SpaceGate({ spaceId, rows, children }: SpaceGateProps) {
  const space = useSpace(spaceId);
  const reload = async () => {
    await space.refetch();
  };

  if (space.isPending) return <ListSkeleton label={SPACE_LABELS.loading} rows={rows} />;
  if (space.isError) {
    if (isSpaceNotFound(space.error)) return <SpaceNotFound />;
    return (
      <LoadError
        retryLabel={COMMON_LABELS.retry}
        message={SPACE_LABELS.loadFailed}
        onRetry={() => {
          void reload();
        }}
      />
    );
  }
  return children(space.data, reload);
}
