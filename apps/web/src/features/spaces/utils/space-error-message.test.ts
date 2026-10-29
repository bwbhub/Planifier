import { ORPCError } from "@orpc/client";
import { describe, expect, it } from "vitest";

import { isSpaceNotFound, spaceConflictReason, spaceErrorMessage } from "./space-error-message";

describe("spaceConflictReason", () => {
  it("lit la raison d'un CONFLICT d'Espace", () => {
    const error = new ORPCError("CONFLICT", { data: { reason: "LAST_OWNER" } });
    expect(spaceConflictReason(error)).toBe("LAST_OWNER");
  });

  it("ignore un CONFLICT sans raison connue", () => {
    const error = new ORPCError("CONFLICT", { data: { reason: "AUTRE" } });
    expect(spaceConflictReason(error)).toBeNull();
  });

  it("ignore les autres erreurs", () => {
    expect(spaceConflictReason(new ORPCError("FORBIDDEN"))).toBeNull();
    expect(spaceConflictReason(new Error("réseau"))).toBeNull();
  });
});

describe("spaceErrorMessage", () => {
  it("propose de recharger quand l'Espace a changé entre-temps", () => {
    const error = new ORPCError("CONFLICT", { data: { reason: "STALE_VERSION" } });
    expect(spaceErrorMessage(error)).toContain("recharge");
  });

  it("dit qui peut agir quand l'action est refusée", () => {
    expect(spaceErrorMessage(new ORPCError("FORBIDDEN"))).toBe(
      "Seuls les propriétaires de l'Espace peuvent faire ça.",
    );
  });

  it("rassure quand l'erreur est inconnue", () => {
    expect(spaceErrorMessage(new TypeError("Failed to fetch"))).toContain("Rien n'est perdu");
  });
});

describe("isSpaceNotFound", () => {
  it("reconnaît un Espace introuvable", () => {
    expect(isSpaceNotFound(new ORPCError("NOT_FOUND"))).toBe(true);
    expect(isSpaceNotFound(new ORPCError("FORBIDDEN"))).toBe(false);
  });
});
