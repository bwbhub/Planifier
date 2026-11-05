import { ORPCError } from "@orpc/client";
import { describe, expect, it } from "vitest";

import { agendaErrorMessage } from "./agenda-error-message";

describe("agendaErrorMessage", () => {
  it("dit quoi faire selon la raison du conflit", () => {
    const error = new ORPCError("CONFLICT", { data: { reason: "AGENDA_DISABLED" } });
    expect(agendaErrorMessage(error)).toContain("Agenda n'est pas activé");
  });

  it("explique un refus sur l'entrée d'une autre personne", () => {
    expect(agendaErrorMessage(new ORPCError("FORBIDDEN"))).toContain("Seule la personne");
  });

  it("rassure sur une panne", () => {
    expect(agendaErrorMessage(new TypeError("Failed to fetch"))).toContain("Rien n'est perdu.");
  });
});
