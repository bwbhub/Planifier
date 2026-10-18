import { call, isLazy, isProcedure } from "@orpc/server";
import { describe, expect, it } from "vitest";

import { PLAN_GUARDS } from "./procedures";
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

const context = { requestId: "test" };

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
});
