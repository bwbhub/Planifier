import { call } from "@orpc/server";
import type { SessionUser } from "@planifier/auth";
import type { Db } from "@planifier/db";

import type { ApiContext } from "../../procedures";
import { createRateLimiter, PLAN_RATE_LIMIT } from "../../rate-limit";
import { router } from "../../router";

// Aide des tests d'intégration du Todo : requêtes, comptes et données de départ sur la base de test.
const { lists, tasks } = router.todo;

export const WEEKLY = { frequency: "WEEKLY", interval: 1 } as const;

/** Contexte d'une requête de `user` (null : sans session) ; limiteur neuf, aucun état partagé. */
export function requestAs(db: Db, user: SessionUser | null): { context: ApiContext } {
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

export function createTestUser(db: Db, name: string): Promise<SessionUser> {
  return db.user.create({
    data: { name, email: `${name}@example.test`, emailVerified: true },
    select: { id: true, name: true, email: true, preferredTheme: true },
  });
}

export function createList(db: Db, user: SessionUser) {
  return call(lists.create, { name: "Maison", tint: "general" }, requestAs(db, user));
}

export async function createListWithTask(db: Db, user: SessionUser) {
  const list = await createList(db, user);
  const task = await call(tasks.create, { listId: list.id, title: "Courses" }, requestAs(db, user));
  return { list, task };
}
