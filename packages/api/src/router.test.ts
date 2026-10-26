import { call, isLazy, isProcedure, ORPCError } from "@orpc/server";
import type { SessionUser } from "@planifier/auth";
import { describe, expect, it } from "vitest";

import type { ApiContext } from "./procedures";
import { PLAN_GUARDS } from "./procedures";
import { createRateLimiter, PLAN_RATE_LIMIT } from "./rate-limit";
import { router } from "./router";

/**
 * Chemins des procédures dont le premier middleware n'est pas une garde de plan.
 * Parcours manuel : `traverseContractProcedures` rend le contrat, pas la procédure implémentée.
 */
function proceduresWithoutGuard(node: unknown, path: readonly string[] = []): string[] {
  if (isProcedure(node)) {
    const first = node["~orpc"].middlewares[0];
    return first !== undefined && PLAN_GUARDS.includes(first) ? [] : [path.join(".")];
  }
  // Routeur paresseux : non parcouru, donc signalé (le test échoue plutôt que d'ignorer).
  if (isLazy(node) || typeof node !== "object" || node === null) return [path.join(".")];
  return Object.entries(node).flatMap(([key, child]) =>
    proceduresWithoutGuard(child, [...path, key]),
  );
}

const ALICE: SessionUser = {
  id: "u-alice",
  name: "Alice",
  email: "alice@example.test",
  preferredTheme: "SYSTEM",
};

/** Contexte neuf à chaque appel : chaque test a son propre limiteur, aucun état partagé. */
function contextFor(user: SessionUser | null): ApiContext {
  return {
    requestId: "test",
    clientIp: "192.0.2.1",
    consumeRateLimit: createRateLimiter(PLAN_RATE_LIMIT),
    getSessionUser: () => Promise.resolve(user),
  };
}

const context = contextFor(null);

describe("routeur", () => {
  it("chaque procédure commence par une garde de plan", () => {
    expect(proceduresWithoutGuard(router)).toEqual([]);
  });

  it("system.health.get répond ok", async () => {
    await expect(call(router.system.health.get, {}, { context })).resolves.toEqual({
      status: "ok",
    });
  });

  it("system.health.get refuse une clé inattendue", async () => {
    // @ts-expect-error clé hors contrat, refusée à l'exécution par z.strictObject
    await expect(call(router.system.health.get, { extra: 1 }, { context })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("account.me.get refuse un appel sans session", async () => {
    await expect(call(router.account.me.get, {}, { context })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("account.me.get rend l'utilisateur de la session, en liste blanche", async () => {
    // Champ en trop dans la session : il ne doit pas sortir.
    const sessionUser = { ...ALICE, emailVerified: true };
    const withExtra = contextFor(sessionUser);
    await expect(call(router.account.me.get, {}, { context: withExtra })).resolves.toEqual(ALICE);
  });

  it("la garde de plan refuse au-delà de la limite de débit de l'IP", async () => {
    const limited: ApiContext = {
      ...contextFor(null),
      consumeRateLimit: createRateLimiter({ max: 1, windowMs: 60_000 }),
    };
    const outcome = (promise: Promise<unknown>) =>
      promise.then(
        () => "ok",
        (error: unknown) =>
          error instanceof ORPCError && error.code === "TOO_MANY_REQUESTS" ? "limité" : "autre",
      );
    expect(await outcome(call(router.system.health.get, {}, { context: limited }))).toBe("ok");
    expect(await outcome(call(router.system.health.get, {}, { context: limited }))).toBe("limité");
    // Débit vérifié avant la session : un appel du plan utilisateur est limité lui aussi.
    expect(await outcome(call(router.account.me.get, {}, { context: limited }))).toBe("limité");
  });
});
