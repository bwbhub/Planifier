"use client";

import { canAccessSpace } from "@planifier/domain-access/space";
import { useState } from "react";

import { SpaceForm } from "../forms/space-form";
import { SpaceGate } from "./space-gate";

/** Réglages d'un Espace, pour ses propriétaires : le formulaire de création, prérempli. */
export function SpaceSettings({ spaceId }: { spaceId: string }) {
  // Une relecture demandée (après un refus STALE_VERSION) remonte le formulaire sur les valeurs à jour ; un
  // rafraîchissement en arrière-plan, lui, ne touche pas à la saisie en cours.
  const [epoch, setEpoch] = useState(0);
  return (
    <SpaceGate spaceId={spaceId}>
      {(space, reload) =>
        canAccessSpace(space.myRole, "update") ? (
          <SpaceForm
            key={epoch}
            space={space}
            onReload={() => {
              void reload().then(() => {
                setEpoch((current) => current + 1);
              });
            }}
          />
        ) : (
          <p className="rounded-card bg-surface p-4.5">
            Seuls les propriétaires de « {space.name} » changent ses réglages.
          </p>
        )
      }
    </SpaceGate>
  );
}
