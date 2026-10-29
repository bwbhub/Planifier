import type { SpaceRole } from "@planifier/constants/spaces";
import { cn } from "@planifier/ui/lib/cn";

import { SPACE_ROLE_LABELS } from "../labels";

const ROLE_STYLES: Record<SpaceRole, string> = {
  OWNER: "bg-accent-tint text-accent-text",
  MEMBER: "bg-field text-muted",
};

/** Rôle d'une personne dans l'Espace, écrit en toutes lettres (la couleur n'est qu'un appui). */
export function RolePill({ role }: { role: SpaceRole }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-pill px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        ROLE_STYLES[role],
      )}
    >
      {SPACE_ROLE_LABELS[role]}
    </span>
  );
}
