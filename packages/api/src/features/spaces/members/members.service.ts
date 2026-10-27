import { ORPCError } from "@orpc/server";
import type { SpaceMemberOutput } from "@planifier/api-contract";
import type { SpaceRole } from "@planifier/constants/spaces";
import type { Db } from "@planifier/db";
import { canChangeRole, canRemoveMember } from "@planifier/domain-access/space";

import { spaceConflict } from "../space-errors";
import { lockSpaceMembers, membershipOf } from "../space-lock";
import { MEMBER_SELECT, toMemberOutput } from "../space-member";

/** Nommer ou rétrograder un propriétaire ; jamais au point de laisser l'Espace sans propriétaire. */
export async function setMemberRole(
  db: Db,
  { spaceId, userId, role }: { spaceId: string; userId: string; role: SpaceRole },
): Promise<SpaceMemberOutput> {
  return db.$transaction(async (tx) => {
    const membership = membershipOf(await lockSpaceMembers(tx, spaceId), userId);
    if (membership === null) throw new ORPCError("NOT_FOUND");
    if (!canChangeRole(membership, role)) throw spaceConflict("LAST_OWNER");
    const member = await tx.spaceMember.update({
      where: { spaceId_userId: { spaceId, userId } },
      data: { role },
      select: MEMBER_SELECT,
    });
    return toMemberOutput(member);
  });
}

/** Retirer un autre membre, sans jamais laisser l'Espace sans propriétaire (`canRemoveMember`). */
export async function removeMember(
  db: Db,
  { spaceId, userId, callerId }: { spaceId: string; userId: string; callerId: string },
): Promise<void> {
  if (userId === callerId) {
    throw new ORPCError("BAD_REQUEST", { message: "Pour partir soi-même, quitter l'Espace." });
  }
  await db.$transaction(async (tx) => {
    const membership = membershipOf(await lockSpaceMembers(tx, spaceId), userId);
    if (membership === null) throw new ORPCError("NOT_FOUND");
    if (!canRemoveMember(membership)) throw spaceConflict("LAST_OWNER");
    await tx.spaceMember.delete({ where: { spaceId_userId: { spaceId, userId } } });
  });
}
