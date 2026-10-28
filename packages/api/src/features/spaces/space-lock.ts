import { ORPCError } from "@orpc/server";
import type { DbTransaction } from "@planifier/db";
import type { SpaceMembership } from "@planifier/domain-access/space";

/**
 * Verrouille la ligne de l'Espace jusqu'à la fin de la transaction : les changements de membres d'un même Espace
 * passent l'un après l'autre (pas de course sur « dernier propriétaire » ni sur le nombre de membres).
 * Espace supprimé entre-temps ⇒ NOT_FOUND. Rend le créateur et les membres lus sous le verrou.
 */
export async function lockSpace(tx: DbTransaction, spaceId: string) {
  const locked = await tx.$queryRaw<
    unknown[]
  >`SELECT 1 FROM spaces WHERE id = ${spaceId} FOR UPDATE`;
  if (locked.length === 0) throw new ORPCError("NOT_FOUND");
  return tx.space.findUniqueOrThrow({
    where: { id: spaceId },
    select: { createdById: true, members: { select: { userId: true, role: true } } },
  });
}

type LockedSpace = Awaited<ReturnType<typeof lockSpace>>;

/** Situation d'un membre dans l'Espace, pour les règles de `domain-access` ; null s'il n'en est pas membre. */
export function membershipOf(
  { createdById, members }: LockedSpace,
  userId: string,
): SpaceMembership | null {
  const member = members.find((candidate) => candidate.userId === userId);
  if (member === undefined) return null;
  return {
    role: member.role,
    isCreator: createdById === userId,
    ownerCount: members.filter(({ role }) => role === "OWNER").length,
    memberCount: members.length,
  };
}
