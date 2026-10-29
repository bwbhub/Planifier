"use client";

import type { SpaceDetailOutput } from "@planifier/api-contract";
import { suggestsOwnerPromotion } from "@planifier/domain-access/space";
import { Button } from "@planifier/ui/components/button";
import { useState } from "react";

import { ActionError } from "../atoms/action-error";
import { useSetMemberRole } from "../queries/spaces.queries";
import { overviewOf } from "../utils/space-membership";

/**
 * Espace retombé à deux avec un seul propriétaire (moi) : proposer de nommer l'autre (CONTEXT.md). Rien ne change
 * sans clic ; « Plus tard » masque la proposition jusqu'au prochain affichage de l'Espace.
 */
export function PromotionTip({ space }: { space: SpaceDetailOutput }) {
  const [dismissed, setDismissed] = useState(false);
  const setRole = useSetMemberRole();

  const other = space.members.find((member) => member.role === "MEMBER");
  if (dismissed || other === undefined || !suggestsOwnerPromotion(overviewOf(space))) return null;

  return (
    <aside
      aria-label="Proposition"
      className="flex flex-col gap-2.5 rounded-card bg-accent-tint px-4 py-3.5 leading-relaxed"
    >
      <p>
        Vous n&apos;êtes plus que deux : tu peux nommer {other.name} propriétaire, pour que vous
        gériez l&apos;Espace à égalité. Rien ne change si tu ne fais rien.
      </p>
      <ActionError error={setRole.error} />
      <div className="flex flex-wrap gap-2">
        <Button
          variant="strong"
          size="sm"
          disabled={setRole.isPending}
          onClick={() => {
            setRole.mutate({ spaceId: space.id, userId: other.userId, role: "OWNER" });
          }}
        >
          Nommer {other.name} propriétaire
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setDismissed(true);
          }}
        >
          Plus tard
        </Button>
      </div>
    </aside>
  );
}
