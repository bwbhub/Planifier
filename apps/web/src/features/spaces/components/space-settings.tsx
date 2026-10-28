"use client";

import { canAccessSpace } from "@planifier/domain-access/space";

import { SpaceForm } from "../forms/space-form";
import { SpaceGate } from "./space-gate";

/** Réglages d'un Espace, pour ses propriétaires : le formulaire de création, prérempli. */
export function SpaceSettings({ spaceId }: { spaceId: string }) {
  return (
    <SpaceGate spaceId={spaceId}>
      {(space, reload) =>
        canAccessSpace(space.myRole, "update") ? (
          // Nouvelle version relue (après un refus STALE_VERSION) : formulaire repris de zéro sur les valeurs à jour.
          <SpaceForm key={space.version} space={space} onReload={reload} />
        ) : (
          <p className="rounded-card bg-surface p-4.5">
            Seuls les propriétaires de « {space.name} » changent ses réglages.
          </p>
        )
      }
    </SpaceGate>
  );
}
