import { ORPCError } from "@orpc/server";
import type { CreatedInviteOutput, InvitePreviewOutput } from "@planifier/api-contract";
import {
  SPACE_INVITE_TTL_DAYS,
  SPACE_MAX_ACTIVE_INVITES,
  SPACE_MAX_MEMBERS,
} from "@planifier/constants/spaces";
import type { Db } from "@planifier/db";
import { roleOfNewMember } from "@planifier/domain-access/space";

import { spaceConflict } from "../space-errors";
import { lockSpaceMembers, membershipOf } from "../space-lock";
import { createInviteToken, hashInviteToken } from "./invite-token";

const DAY_MS = 24 * 60 * 60 * 1000;
const INVITE_SELECT = { id: true, expiresAt: true, createdAt: true } as const;

/** Lien en cours de validité : ni utilisé (supprimé à l'usage), ni expiré. */
const activeAt = (now: Date) => ({ expiresAt: { gt: now } });

/** Nouveau lien ; les liens expirés de l'Espace sont purgés au passage. */
export async function createInvite(
  db: Db,
  { spaceId, createdById }: { spaceId: string; createdById: string },
  now = new Date(),
): Promise<CreatedInviteOutput> {
  return db.$transaction(async (tx) => {
    await lockSpaceMembers(tx, spaceId);
    await tx.spaceInvite.deleteMany({ where: { spaceId, expiresAt: { lte: now } } });
    if ((await tx.spaceInvite.count({ where: { spaceId } })) >= SPACE_MAX_ACTIVE_INVITES) {
      throw spaceConflict("TOO_MANY_INVITES");
    }
    const { token, tokenHash } = createInviteToken();
    const invite = await tx.spaceInvite.create({
      data: {
        spaceId,
        createdById,
        tokenHash,
        expiresAt: new Date(now.getTime() + SPACE_INVITE_TTL_DAYS * DAY_MS),
      },
      select: INVITE_SELECT,
    });
    return { ...invite, token };
  });
}

export async function listInvites(db: Db, spaceId: string, now = new Date()) {
  const items = await db.spaceInvite.findMany({
    where: { spaceId, ...activeAt(now) },
    orderBy: { createdAt: "asc" },
    take: SPACE_MAX_ACTIVE_INVITES,
    select: INVITE_SELECT,
  });
  return { items };
}

/** Lien d'un autre Espace ⇒ NOT_FOUND : l'identifiant seul ne suffit pas, l'Espace parent est vérifié. */
export async function revokeInvite(
  db: Db,
  { spaceId, inviteId }: { spaceId: string; inviteId: string },
): Promise<void> {
  const { count } = await db.spaceInvite.deleteMany({ where: { id: inviteId, spaceId } });
  if (count === 0) throw new ORPCError("NOT_FOUND");
}

/** Ce que montre le lien avant de rejoindre. Le jeton tient lieu de droit : inconnu, utilisé ou expiré ⇒ NOT_FOUND. */
export async function previewInvite(
  db: Db,
  { token, userId }: { token: string; userId: string },
  now = new Date(),
): Promise<InvitePreviewOutput> {
  const invite = await db.spaceInvite.findFirst({
    where: { tokenHash: hashInviteToken(token), ...activeAt(now) },
    select: {
      space: {
        select: {
          id: true,
          name: true,
          _count: { select: { members: true } },
          members: { where: { userId }, select: { id: true } },
        },
      },
    },
  });
  if (invite === null) throw new ORPCError("NOT_FOUND");
  const { space } = invite;
  return {
    spaceId: space.id,
    spaceName: space.name,
    memberCount: space._count.members,
    alreadyMember: space.members.length > 0,
  };
}

/**
 * Rejoindre l'Espace du lien, sous son verrou : rôle selon `roleOfNewMember`, lien consommé. Déjà membre : rien ne
 * change et le lien reste valable pour la personne à qui il était destiné.
 */
export async function acceptInvite(
  db: Db,
  { token, userId }: { token: string; userId: string },
  now = new Date(),
): Promise<{ spaceId: string }> {
  const tokenHash = hashInviteToken(token);
  return db.$transaction(async (tx) => {
    const invite = await tx.spaceInvite.findFirst({
      where: { tokenHash, ...activeAt(now) },
      select: { id: true, spaceId: true },
    });
    if (invite === null) throw new ORPCError("NOT_FOUND");
    const { spaceId } = invite;
    const members = await lockSpaceMembers(tx, spaceId);
    if (membershipOf(members, userId) !== null) return { spaceId };
    if (members.length >= SPACE_MAX_MEMBERS) throw spaceConflict("SPACE_FULL");
    // Consommé par une acceptation concurrente pendant l'attente du verrou.
    const { count } = await tx.spaceInvite.deleteMany({ where: { id: invite.id } });
    if (count === 0) throw new ORPCError("NOT_FOUND");
    await tx.spaceMember.create({
      data: { spaceId, userId, role: roleOfNewMember(members.length) },
    });
    return { spaceId };
  });
}
