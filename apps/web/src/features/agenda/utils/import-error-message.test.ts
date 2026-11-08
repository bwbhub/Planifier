import { ORPCError } from "@orpc/client";
import { describe, expect, it } from "vitest";

import { importErrorMessage } from "./import-error-message";

describe("importErrorMessage", () => {
  it("dit quoi faire selon la raison de l'échec de lecture", () => {
    const error = new ORPCError("BAD_REQUEST", { data: { reason: "FEED_TOO_LARGE" } });
    expect(importErrorMessage(error)).toContain("trop gros");
  });

  it("nomme les services admis pour un lien refusé", () => {
    const error = new ORPCError("BAD_REQUEST", { data: { reason: "LINK_INVALID" } });
    expect(importErrorMessage(error)).toContain("Google, Outlook, iCloud");
  });

  it("garde les messages de l'Agenda pour les conflits", () => {
    const error = new ORPCError("CONFLICT", { data: { reason: "REFRESH_TOO_SOON" } });
    expect(importErrorMessage(error)).toContain("Réessaie dans une minute");
  });

  it("rassure sur une panne", () => {
    expect(importErrorMessage(new TypeError("Failed to fetch"))).toContain("Rien n'est perdu.");
  });
});
