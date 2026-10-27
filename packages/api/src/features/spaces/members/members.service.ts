import { ORPCError } from "@orpc/server";
import type { SpaceMemberOutput } from "@planifier/api-contract";
import type { SpaceRole } from "@planifier/constants/spaces";
import type { Db } from "@planifier/db";
import { canChangeRole, departureOutcome } from "@planifier/domain-access/space";

import { lockSpaceMembers, membershipOf, spaceConflict } from "../space-lock";

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
      select: { userId: true, role: true, joinedAt: true, user: { select: { name: true } } },
    });
    const { user, ...rest } = member;
    return { ...rest, name: user.name };
  });
}

/**
 * Retirer un autre membre : mêmes règles qu'un départ. L'appelant, propriétaire et différent de la personne visée,
 * reste dans l'Espace : `last_owner` n'arrive que s'il a été rétrogradé entre la garde et le verrou.
 */
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
    if (departureOutcome(membership) === "last_owner") throw spaceConflict("LAST_OWNER");
    await tx.spaceMember.delete({ where: { spaceId_userId: { spaceId, userId } } });
  });
}
