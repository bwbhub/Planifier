import { call } from "@orpc/server";
import type { SessionUser } from "@planifier/auth";
import { SPACE_MAX_ACTIVE_INVITES, SPACE_MAX_MEMBERS } from "@planifier/constants/spaces";
import { createTestDatabase } from "@planifier/db/testing";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import type { ApiContext } from "../../procedures";
import { createRateLimiter, PLAN_RATE_LIMIT } from "../../rate-limit";
import { router } from "../../router";
import { acceptInvite, listInvites } from "./invites/invites.service";

// Base réelle dédiée en `_test` (`createTestDatabase`), vidée avant chaque test. Lancement : `pnpm test:integration`.
const { db, reset } = createTestDatabase();
const { space, members, invites } = router.spaces;

let users: Record<"alice" | "bob" | "carol" | "dave", SessionUser>;

/** Contexte d'une requête de `user` (null : sans session) ; limiteur neuf, aucun état partagé. */
function asUser(user: SessionUser | null): { context: ApiContext } {
  return {
    context: {
      requestId: "test",
      clientIp: "192.0.2.1",
      consumeRateLimit: createRateLimiter(PLAN_RATE_LIMIT),
      getSessionUser: () => Promise.resolve(user),
      getDb: () => db,
    },
  };
}

async function createUser(name: string): Promise<SessionUser> {
  return db.user.create({
    data: { name, email: `${name}@example.test`, emailVerified: true },
    select: { id: true, name: true, email: true, preferredTheme: true },
  });
}

/** `person` rejoint l'Espace par un lien neuf créé par `owner`. */
async function join(spaceId: string, owner: SessionUser, person: SessionUser) {
  const { token } = await call(invites.create, { spaceId }, asUser(owner));
  return call(invites.accept, { token }, asUser(person));
}

/** Espace « Coloc » d'Alice seule. */
const createSolo = () => call(space.create, { name: "Coloc", modules: [] }, asUser(users.alice));

/** Espace d'Alice (créatrice), Bob (deuxième, donc propriétaire) et Carol (membre). */
async function createTrio() {
  const created = await call(
    space.create,
    { name: "Coloc", modules: ["TODO"] },
    asUser(users.alice),
  );
  await join(created.id, users.alice, users.bob);
  await join(created.id, users.alice, users.carol);
  return created.id;
}

const roleOf = (spaceId: string, user: SessionUser) =>
  db.spaceMember.findUnique({
    where: { spaceId_userId: { spaceId, userId: user.id } },
    select: { role: true },
  });

beforeEach(async () => {
  await reset();
  users = {
    alice: await createUser("alice"),
    bob: await createUser("bob"),
    carol: await createUser("carol"),
    dave: await createUser("dave"),
  };
});

afterAll(async () => {
  await db.$disconnect();
});

describe("spaces.space : création et liste (base réelle)", () => {
  it("crée un Espace dont l'appelant est propriétaire, et le liste", async () => {
    const created = await call(
      space.create,
      { name: "  Coloc  ", modules: ["TODO", "AGENDA"] },
      asUser(users.alice),
    );
    expect(created).toMatchObject({
      name: "Coloc",
      modules: ["TODO", "AGENDA"],
      myRole: "OWNER",
      version: 1,
    });

    await expect(call(space.list, {}, asUser(users.alice))).resolves.toEqual({
      items: [{ id: created.id, name: "Coloc", myRole: "OWNER", memberCount: 1 }],
      nextCursor: null,
    });
    await expect(call(space.list, {}, asUser(users.bob))).resolves.toEqual({
      items: [],
      nextCursor: null,
    });
  });

  it("pagine la liste par curseur", async () => {
    const first = await call(space.create, { name: "Un", modules: [] }, asUser(users.alice));
    const second = await call(space.create, { name: "Deux", modules: [] }, asUser(users.alice));

    const page1 = await call(space.list, { limit: 1 }, asUser(users.alice));
    expect(page1.items.map(({ id }) => id)).toEqual([first.id]);
    expect(page1.nextCursor).not.toBeNull();
    const page2 = await call(
      space.list,
      { limit: 1, cursor: page1.nextCursor ?? undefined },
      asUser(users.alice),
    );
    expect(page2).toEqual({
      items: [expect.objectContaining({ id: second.id })],
      nextCursor: null,
    });
  });
});

describe("spaces.space : lecture et droits (base réelle)", () => {
  it("rend réglages et membres (nom seul, sans e-mail) à un membre", async () => {
    const spaceId = await createTrio();
    const detail = await call(space.get, { spaceId }, asUser(users.carol));
    expect(detail.myRole).toBe("MEMBER");
    expect(detail.members.map(({ name, role, isCreator }) => ({ name, role, isCreator }))).toEqual([
      { name: "alice", role: "OWNER", isCreator: true },
      { name: "bob", role: "OWNER", isCreator: false },
      { name: "carol", role: "MEMBER", isCreator: false },
    ]);
    expect(Object.keys(detail.members[0] ?? {}).sort()).toEqual([
      "isCreator",
      "joinedAt",
      "name",
      "role",
      "userId",
    ]);
  });
});

describe("spaces.space : réglages et suppression (base réelle)", () => {
  it("modifie les réglages avec la bonne version, CONFLICT STALE_VERSION sinon", async () => {
    const { id: spaceId } = await createSolo();
    const updated = await call(
      space.update,
      { spaceId, version: 1, restrictVisibility: true, modules: ["EVENTS"] },
      asUser(users.alice),
    );
    expect(updated).toMatchObject({
      name: "Coloc",
      restrictVisibility: true,
      modules: ["EVENTS"],
      version: 2,
    });
    await expect(
      call(space.update, { spaceId, version: 1, name: "Trop tard" }, asUser(users.alice)),
    ).rejects.toMatchObject({ code: "CONFLICT", data: { reason: "STALE_VERSION" } });
  });

  it("refuse une modification sans aucun réglage", async () => {
    const { id: spaceId } = await createSolo();
    await expect(
      call(space.update, { spaceId, version: 1 }, asUser(users.alice)),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("supprime l'Espace, ses membres et ses liens", async () => {
    const spaceId = await createTrio();
    await call(invites.create, { spaceId }, asUser(users.alice));
    await expect(call(space.delete, { spaceId }, asUser(users.bob))).resolves.toEqual({});
    await expect(db.space.count()).resolves.toBe(0);
    await expect(db.spaceMember.count()).resolves.toBe(0);
    await expect(db.spaceInvite.count()).resolves.toBe(0);
  });
});

describe("départs et rôles (base réelle)", () => {
  it("le deuxième membre est propriétaire, le troisième membre", async () => {
    const spaceId = await createTrio();
    await expect(roleOf(spaceId, users.bob)).resolves.toEqual({ role: "OWNER" });
    await expect(roleOf(spaceId, users.carol)).resolves.toEqual({ role: "MEMBER" });
  });

  it("refuse le départ du dernier propriétaire tant qu'il reste des membres", async () => {
    const spaceId = await createTrio();
    await call(
      members.setRole,
      { spaceId, userId: users.bob.id, role: "MEMBER" },
      asUser(users.alice),
    );
    await expect(call(space.leave, { spaceId }, asUser(users.alice))).rejects.toMatchObject({
      code: "CONFLICT",
      data: { reason: "LAST_OWNER" },
    });
    // Un autre propriétaire nommé : le départ passe.
    await call(
      members.setRole,
      { spaceId, userId: users.carol.id, role: "OWNER" },
      asUser(users.alice),
    );
    await expect(call(space.leave, { spaceId }, asUser(users.alice))).resolves.toEqual({
      spaceDeleted: false,
    });
    await expect(roleOf(spaceId, users.alice)).resolves.toBeNull();
  });

  it("supprime l'Espace quand le dernier membre part", async () => {
    const { id: spaceId } = await call(
      space.create,
      { name: "Solo", modules: [] },
      asUser(users.alice),
    );
    await expect(call(space.leave, { spaceId }, asUser(users.alice))).resolves.toEqual({
      spaceDeleted: true,
    });
    await expect(db.space.count()).resolves.toBe(0);
  });
});

describe("créateur et rôles (base réelle)", () => {
  it("protège le créateur : ni rétrogradé ni retiré, même par un autre propriétaire", async () => {
    const spaceId = await createTrio();
    const target = { spaceId, userId: users.alice.id };
    await expect(
      call(members.setRole, { ...target, role: "MEMBER" }, asUser(users.bob)),
    ).rejects.toMatchObject({ code: "CONFLICT", data: { reason: "CREATOR" } });
    await expect(
      call(members.setRole, { ...target, role: "MEMBER" }, asUser(users.alice)),
    ).rejects.toMatchObject({ code: "CONFLICT", data: { reason: "CREATOR" } });
    await expect(call(members.remove, target, asUser(users.bob))).rejects.toMatchObject({
      code: "CONFLICT",
      data: { reason: "CREATOR" },
    });
    await expect(roleOf(spaceId, users.alice)).resolves.toEqual({ role: "OWNER" });
  });

  it("lève la protection quand le créateur part", async () => {
    const spaceId = await createTrio();
    await call(space.leave, { spaceId }, asUser(users.alice));
    await expect(
      db.space.findUnique({ where: { id: spaceId }, select: { createdById: true } }),
    ).resolves.toEqual({
      createdById: null,
    });
    // Revenu par un lien, Alice n'est plus protégée : Bob peut la retirer.
    await join(spaceId, users.bob, users.alice);
    await expect(
      call(members.remove, { spaceId, userId: users.alice.id }, asUser(users.bob)),
    ).resolves.toEqual({});
  });

  it("refuse de rétrograder le dernier propriétaire, même soi-même", async () => {
    const spaceId = await createTrio();
    // Alice (créatrice) partie, Bob reste seul propriétaire.
    await call(space.leave, { spaceId }, asUser(users.alice));
    await expect(
      call(members.setRole, { spaceId, userId: users.bob.id, role: "MEMBER" }, asUser(users.bob)),
    ).rejects.toMatchObject({ code: "CONFLICT", data: { reason: "LAST_OWNER" } });
  });

  it("change le rôle d'un membre, NOT_FOUND pour une personne hors de l'Espace", async () => {
    const spaceId = await createTrio();
    await expect(
      call(members.setRole, { spaceId, userId: users.carol.id, role: "OWNER" }, asUser(users.bob)),
    ).resolves.toMatchObject({ userId: users.carol.id, name: "carol", role: "OWNER" });
    await expect(
      call(members.setRole, { spaceId, userId: users.dave.id, role: "OWNER" }, asUser(users.bob)),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("retire un autre membre ; se retirer soi-même ⇒ BAD_REQUEST", async () => {
    const spaceId = await createTrio();
    await expect(
      call(members.remove, { spaceId, userId: users.carol.id }, asUser(users.alice)),
    ).resolves.toEqual({});
    await expect(roleOf(spaceId, users.carol)).resolves.toBeNull();
    await expect(
      call(members.remove, { spaceId, userId: users.alice.id }, asUser(users.alice)),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("spaces.invites : création et révocation (base réelle)", () => {
  it("ne stocke que l'empreinte du jeton, et ne le rend qu'à la création", async () => {
    const { id: spaceId } = await createSolo();
    const created = await call(invites.create, { spaceId }, asUser(users.alice));
    const stored = await db.spaceInvite.findUniqueOrThrow({ where: { id: created.id } });
    expect(stored.tokenHash).not.toContain(created.token);
    expect(stored.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    await expect(call(invites.list, { spaceId }, asUser(users.alice))).resolves.toEqual({
      items: [{ id: created.id, expiresAt: created.expiresAt, createdAt: created.createdAt }],
    });
  });
});

describe("spaces.invites : rejoindre (base réelle)", () => {
  it("montre l'Espace avant de rejoindre, puis consomme le lien", async () => {
    const { id: spaceId } = await createSolo();
    const { token } = await call(invites.create, { spaceId }, asUser(users.alice));
    await expect(call(invites.preview, { token }, asUser(users.bob))).resolves.toEqual({
      spaceId,
      spaceName: "Coloc",
      memberCount: 1,
      alreadyMember: false,
    });
    await expect(call(invites.accept, { token }, asUser(users.bob))).resolves.toEqual({ spaceId });
    // Usage unique.
    await expect(call(invites.accept, { token }, asUser(users.carol))).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(call(invites.preview, { token }, asUser(users.carol))).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("ne consomme pas le lien d'une personne déjà membre", async () => {
    const { id: spaceId } = await createSolo();
    const { token } = await call(invites.create, { spaceId }, asUser(users.alice));
    await expect(call(invites.preview, { token }, asUser(users.alice))).resolves.toMatchObject({
      alreadyMember: true,
    });
    await expect(call(invites.accept, { token }, asUser(users.alice))).resolves.toEqual({
      spaceId,
    });
    await expect(call(invites.accept, { token }, asUser(users.bob))).resolves.toEqual({ spaceId });
  });

  it("refuse un lien expiré ou inconnu (horloge injectée)", async () => {
    const { id: spaceId } = await createSolo();
    const { token, expiresAt } = await call(invites.create, { spaceId }, asUser(users.alice));
    const justAfter = new Date(expiresAt.getTime() + 1);
    await expect(
      acceptInvite(db, { token, userId: users.bob.id }, justAfter),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(listInvites(db, spaceId, justAfter)).resolves.toEqual({ items: [] });
    await expect(
      call(invites.accept, { token: "a".repeat(43) }, asUser(users.bob)),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("n'accepte qu'une fois un lien utilisé en même temps par deux personnes", async () => {
    const { id: spaceId } = await createSolo();
    const { token } = await call(invites.create, { spaceId }, asUser(users.alice));
    const outcomes = await Promise.allSettled([
      call(invites.accept, { token }, asUser(users.bob)),
      call(invites.accept, { token }, asUser(users.carol)),
    ]);
    expect(outcomes.filter(({ status }) => status === "fulfilled")).toHaveLength(1);
    await expect(db.spaceMember.count({ where: { spaceId } })).resolves.toBe(2);
  });
});

describe("spaces.invites : bornes et révocation (base réelle)", () => {
  it("révoque un lien ; celui d'un autre Espace ⇒ NOT_FOUND", async () => {
    const { id: spaceId } = await createSolo();
    const { id: otherSpaceId } = await call(
      space.create,
      { name: "Autre", modules: [] },
      asUser(users.bob),
    );
    const { id: inviteId, token } = await call(invites.create, { spaceId }, asUser(users.alice));
    await expect(
      call(invites.revoke, { spaceId: otherSpaceId, inviteId }, asUser(users.bob)),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(call(invites.revoke, { spaceId, inviteId }, asUser(users.alice))).resolves.toEqual(
      {},
    );
    await expect(call(invites.accept, { token }, asUser(users.carol))).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it(`refuse au-delà de ${String(SPACE_MAX_ACTIVE_INVITES)} liens en cours`, async () => {
    const { id: spaceId } = await createSolo();
    for (let index = 0; index < SPACE_MAX_ACTIVE_INVITES; index += 1) {
      await call(invites.create, { spaceId }, asUser(users.alice));
    }
    await expect(call(invites.create, { spaceId }, asUser(users.alice))).rejects.toMatchObject({
      code: "CONFLICT",
      data: { reason: "TOO_MANY_INVITES" },
    });
  });

  it(`refuse de rejoindre un Espace de ${String(SPACE_MAX_MEMBERS)} membres`, async () => {
    const { id: spaceId } = await call(
      space.create,
      { name: "Grand", modules: [] },
      asUser(users.alice),
    );
    const extra = Array.from({ length: SPACE_MAX_MEMBERS - 1 }, (_, index) => ({
      name: `membre-${String(index)}`,
      email: `membre-${String(index)}@example.test`,
    }));
    await db.user.createMany({ data: extra });
    const extraUsers = await db.user.findMany({
      where: { name: { startsWith: "membre-" } },
      select: { id: true },
    });
    await db.spaceMember.createMany({
      data: extraUsers.map(({ id }) => ({ spaceId, userId: id })),
    });
    const { token } = await call(invites.create, { spaceId }, asUser(users.alice));
    await expect(call(invites.accept, { token }, asUser(users.bob))).rejects.toMatchObject({
      code: "CONFLICT",
      data: { reason: "SPACE_FULL" },
    });
  });
});

interface Fixture {
  spaceId: string;
  inviteId: string;
}

/**
 * Matrice par procédure gardée (auth-authorization §Tests) : sans session, hors de l'Espace, rôle insuffisant,
 * autorisé. `minimum` : rôle le plus faible qui a le droit. Chaque cas part d'un Espace neuf (Alice, Bob, Carol).
 */
const GUARDED: {
  name: string;
  minimum: "MEMBER" | "OWNER";
  run: (fixture: Fixture, user: SessionUser | null) => Promise<unknown>;
}[] = [
  {
    name: "space.get",
    minimum: "MEMBER",
    run: ({ spaceId }, user) => call(space.get, { spaceId }, asUser(user)),
  },
  {
    name: "space.update",
    minimum: "OWNER",
    run: ({ spaceId }, user) =>
      call(space.update, { spaceId, version: 1, name: "Autre" }, asUser(user)),
  },
  {
    name: "space.delete",
    minimum: "OWNER",
    run: ({ spaceId }, user) => call(space.delete, { spaceId }, asUser(user)),
  },
  {
    name: "space.leave",
    minimum: "MEMBER",
    run: ({ spaceId }, user) => call(space.leave, { spaceId }, asUser(user)),
  },
  {
    name: "members.setRole",
    minimum: "OWNER",
    run: ({ spaceId }, user) =>
      call(members.setRole, { spaceId, userId: users.bob.id, role: "OWNER" }, asUser(user)),
  },
  {
    name: "members.remove",
    minimum: "OWNER",
    run: ({ spaceId }, user) =>
      call(members.remove, { spaceId, userId: users.bob.id }, asUser(user)),
  },
  {
    name: "invites.create",
    minimum: "OWNER",
    run: ({ spaceId }, user) => call(invites.create, { spaceId }, asUser(user)),
  },
  {
    name: "invites.list",
    minimum: "OWNER",
    run: ({ spaceId }, user) => call(invites.list, { spaceId }, asUser(user)),
  },
  {
    name: "invites.revoke",
    minimum: "OWNER",
    run: ({ spaceId, inviteId }, user) => call(invites.revoke, { spaceId, inviteId }, asUser(user)),
  },
];

async function createFixture(): Promise<Fixture> {
  const spaceId = await createTrio();
  const { id: inviteId } = await call(invites.create, { spaceId }, asUser(users.alice));
  return { spaceId, inviteId };
}

describe.each(GUARDED)("droits de $name (base réelle)", ({ minimum, run }) => {
  it("sans session ⇒ UNAUTHORIZED", async () => {
    await expect(run(await createFixture(), null)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("hors de l'Espace ⇒ NOT_FOUND", async () => {
    await expect(run(await createFixture(), users.dave)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it(minimum === "OWNER" ? "simple membre ⇒ FORBIDDEN" : "simple membre ⇒ autorisé", async () => {
    const outcome = run(await createFixture(), users.carol);
    await (minimum === "OWNER"
      ? expect(outcome).rejects.toMatchObject({ code: "FORBIDDEN" })
      : expect(outcome).resolves.toBeDefined());
  });

  it("propriétaire ⇒ autorisé", async () => {
    // Alice reste propriétaire avec Bob : son départ est permis.
    await expect(run(await createFixture(), users.alice)).resolves.toBeDefined();
  });
});
