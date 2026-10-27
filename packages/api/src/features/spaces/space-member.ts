import type { SpaceMemberOutput } from "@planifier/api-contract";
import type { SpaceRole } from "@planifier/constants/spaces";

/** Sélection d'un membre pour la sortie : nom affiché seul, jamais l'e-mail. */
export const MEMBER_SELECT = {
  userId: true,
  role: true,
  joinedAt: true,
  user: { select: { name: true } },
} as const;

interface SelectedMember {
  userId: string;
  role: SpaceRole;
  joinedAt: Date;
  user: { name: string };
}

export function toMemberOutput({ user, ...member }: SelectedMember): SpaceMemberOutput {
  return { ...member, name: user.name };
}
