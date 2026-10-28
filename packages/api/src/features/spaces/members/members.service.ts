import { ORPCError } from "@orpc/server";
import type { SpaceMemberOutput } from "@planifier/api-contract";
import type { SpaceRole } from "@planifier/constants/spaces";
import type { Db } from "@planifier/db";
import {
  type MemberChangeOutcome,
  removalOutcome,
  roleChangeOutcome,
} from "@planifier/domain-access/space";

import { spaceConflict } from "../space-errors";
import { lockSpace, membershipOf } from "../space-lock";
import { MEMBER_SELECT, toMemberOutput } from "../space-member";

/** Refus d'un changement de membre, en `CONFLICT` typé. */
function assertAllowed(outcome: MemberChangeOutcome) {
  if (outcome === "creator") throw spaceConflict("CREATOR");
  if (outcome === "last_owner") throw spaceConflict("LAST_OWNER");
}

/** Nommer ou rétrograder un propriétaire ; jamais le créateur, jamais le dernier propriétaire. */
export async function setMemberRole(
  db: Db,
  { spaceId, userId, role }: { spaceId: string; userId: string; role: SpaceRole },
): Promise<SpaceMemberOutput> {
  return db.$transaction(async (tx) => {
    const locked = await lockSpace(tx, spaceId);
    const membership = membershipOf(locked, userId);
    if (membership === null) throw new ORPCError("NOT_FOUND");
    assertAllowed(roleChangeOutcome(membership, role));
    const member = await tx.spaceMember.update({
      where: { spaceId_userId: { spaceId, userId } },
      data: { role },
      select: MEMBER_SELECT,
    });
    return toMemberOutput(member, locked.createdById);
  });
}

/** Retirer un autre membre : jamais le créateur, jamais le dernier propriétaire (`removalOutcome`). */
export async function removeMember(
  db: Db,
  { spaceId, userId, callerId }: { spaceId: string; userId: string; callerId: string },
): Promise<void> {
  if (userId === callerId) {
    throw new ORPCError("BAD_REQUEST", { message: "Pour partir soi-même, quitter l'Espace." });
  }
  await db.$transaction(async (tx) => {
    const membership = membershipOf(await lockSpace(tx, spaceId), userId);
    if (membership === null) throw new ORPCError("NOT_FOUND");
    assertAllowed(removalOutcome(membership));
    await tx.spaceMember.delete({ where: { spaceId_userId: { spaceId, userId } } });
  });
}
