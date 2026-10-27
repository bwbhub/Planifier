import { ORPCError } from "@orpc/server";
import type {
  CreateSpaceInput,
  ListSpacesInput,
  ListSpacesOutput,
  SpaceDetailOutput,
  SpaceOutput,
  UpdateSpaceInput,
} from "@planifier/api-contract";
import type { SpaceRole } from "@planifier/constants/spaces";
import type { Db } from "@planifier/db";
import { departureOutcome, roleOfNewMember } from "@planifier/domain-access/space";

import { spaceConflict } from "../space-errors";
import { lockSpace, membershipOf } from "../space-lock";
import { MEMBER_SELECT, toMemberOutput } from "../space-member";

const SPACE_SELECT = {
  id: true,
  name: true,
  modules: true,
  restrictVisibility: true,
  version: true,
} as const;

/** L'appelant est le créateur et le premier membre : propriétaire (`roleOfNewMember`). */
export async function createSpace(
  db: Db,
  userId: string,
  input: CreateSpaceInput,
): Promise<SpaceOutput> {
  const myRole = roleOfNewMember(0);
  const space = await db.space.create({
    data: { ...input, createdById: userId, members: { create: { userId, role: myRole } } },
    select: SPACE_SELECT,
  });
  return { ...space, myRole };
}

/** Curseur : identifiant d'adhésion (`uuid(7)`, croissant), donc ordre d'arrivée dans les Espaces. */
export async function listSpaces(
  db: Db,
  userId: string,
  { limit, cursor }: ListSpacesInput,
): Promise<ListSpacesOutput> {
  const rows = await db.spaceMember.findMany({
    where: { userId, ...(cursor === undefined ? {} : { id: { gt: cursor } }) },
    orderBy: { id: "asc" },
    take: limit + 1,
    select: {
      id: true,
      role: true,
      space: { select: { id: true, name: true, _count: { select: { members: true } } } },
    },
  });
  const page = rows.slice(0, limit);
  return {
    items: page.map(({ role, space }) => ({
      id: space.id,
      name: space.name,
      myRole: role,
      memberCount: space._count.members,
    })),
    nextCursor: rows.length > limit ? (page.at(-1)?.id ?? null) : null,
  };
}

export async function getSpace(
  db: Db,
  spaceId: string,
  myRole: SpaceRole,
): Promise<SpaceDetailOutput> {
  const space = await db.space.findUnique({
    where: { id: spaceId },
    select: {
      ...SPACE_SELECT,
      createdById: true,
      members: { orderBy: { joinedAt: "asc" }, select: MEMBER_SELECT },
    },
  });
  // Supprimé entre la garde et la lecture.
  if (space === null) throw new ORPCError("NOT_FOUND");
  const { members, createdById, ...settings } = space;
  return {
    ...settings,
    myRole,
    members: members.map((member) => toMemberOutput(member, createdById)),
  };
}

export async function updateSpace(
  db: Db,
  myRole: SpaceRole,
  { spaceId, version, name, modules, restrictVisibility }: UpdateSpaceInput,
): Promise<SpaceOutput> {
  const { count } = await db.space.updateMany({
    where: { id: spaceId, version },
    // Champ absent : inchangé (Prisma refuse `undefined` explicite avec `exactOptionalPropertyTypes`).
    data: {
      ...(name === undefined ? {} : { name }),
      ...(modules === undefined ? {} : { modules }),
      ...(restrictVisibility === undefined ? {} : { restrictVisibility }),
      version: { increment: 1 },
    },
  });
  if (count === 0) throw spaceConflict("STALE_VERSION");
  const space = await db.space.findUnique({ where: { id: spaceId }, select: SPACE_SELECT });
  if (space === null) throw new ORPCError("NOT_FOUND");
  return { ...space, myRole };
}

/** Les événements de l'Espace deviennent personnels (`onDelete: SetNull`), ses membres et liens disparaissent. */
export async function deleteSpace(db: Db, spaceId: string): Promise<void> {
  await db.space.deleteMany({ where: { id: spaceId } });
}

/** Règles de `departureOutcome`, appliquées sous le verrou de l'Espace. Le créateur qui part perd sa protection. */
export async function leaveSpace(
  db: Db,
  spaceId: string,
  userId: string,
): Promise<{ spaceDeleted: boolean }> {
  return db.$transaction(async (tx) => {
    const membership = membershipOf(await lockSpace(tx, spaceId), userId);
    // Parti entre la garde et le verrou.
    if (membership === null) throw new ORPCError("NOT_FOUND");
    switch (departureOutcome(membership)) {
      case "last_owner":
        throw spaceConflict("LAST_OWNER");
      case "delete_space":
        await tx.space.delete({ where: { id: spaceId } });
        return { spaceDeleted: true };
      case "leave":
        await tx.spaceMember.delete({ where: { spaceId_userId: { spaceId, userId } } });
        if (membership.isCreator) {
          await tx.space.update({ where: { id: spaceId }, data: { createdById: null } });
        }
        return { spaceDeleted: false };
    }
  });
}
