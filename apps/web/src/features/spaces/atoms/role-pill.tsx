import type { SpaceRole } from "@planifier/constants/spaces";
import { Badge, type BadgeTone } from "@planifier/ui/components/badge";

import { SPACE_ROLE_LABELS } from "../labels";

const ROLE_TONES: Record<SpaceRole, BadgeTone> = { OWNER: "accent", MEMBER: "neutral" };

/** Rôle d'une personne dans l'Espace, écrit en toutes lettres (la couleur n'est qu'un appui). */
export function RolePill({ role }: { role: SpaceRole }) {
  return <Badge tone={ROLE_TONES[role]}>{SPACE_ROLE_LABELS[role]}</Badge>;
}
