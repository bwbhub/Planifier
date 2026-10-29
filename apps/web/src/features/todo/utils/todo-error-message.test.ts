import { ORPCError } from "@orpc/client";
import { describe, expect, it } from "vitest";

import { todoErrorMessage } from "./todo-error-message";

describe("todoErrorMessage", () => {
  it("dit quoi faire selon la raison d'un CONFLICT", () => {
    const stale = new ORPCError("CONFLICT", { data: { reason: "STALE_VERSION" } });
    expect(todoErrorMessage(stale)).toContain("Recharge la page");
    const full = new ORPCError("CONFLICT", { data: { reason: "LIST_FULL" } });
    expect(todoErrorMessage(full)).toContain("500 tâches");
  });

  it("rassure sans détail technique sur une erreur inconnue", () => {
    expect(todoErrorMessage(new Error("boom"))).toBe(
      "Quelque chose n'a pas fonctionné, rien n'est perdu. Réessaie dans un instant.",
    );
    expect(todoErrorMessage(new ORPCError("CONFLICT", { data: { reason: "AUTRE" } }))).toBe(
      "Quelque chose n'a pas fonctionné, rien n'est perdu. Réessaie dans un instant.",
    );
  });
});
