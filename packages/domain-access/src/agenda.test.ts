import { describe, expect, it } from "vitest";

import { type AgendaEntryAccess, canAccessAgendaEntry, spaceAgendaScope } from "./agenda";
import { RESOURCE_ACTIONS } from "./resource";

const entry: AgendaEntryAccess = {
  userId: "bob",
  ownerId: "alice",
  hidden: false,
  sharesAgendaSpace: true,
};

const allowed = (access: AgendaEntryAccess) =>
  RESOURCE_ACTIONS.filter((action) => canAccessAgendaEntry(access, action));

describe("canAccessAgendaEntry", () => {
  it("donne tout au propriétaire, même sur une entrée masquée", () => {
    const access = { ...entry, userId: "alice", hidden: true, sharesAgendaSpace: false };
    expect(allowed(access)).toEqual(RESOURCE_ACTIONS);
  });

  it("laisse seulement lire à qui partage un Espace", () => {
    expect(allowed(entry)).toEqual(["read"]);
  });

  it("ne montre rien hors d'un Espace commun", () => {
    expect(allowed({ ...entry, sharesAgendaSpace: false })).toEqual([]);
  });

  it("ne montre jamais une entrée masquée aux autres", () => {
    expect(allowed({ ...entry, hidden: true })).toEqual([]);
  });
});

describe("spaceAgendaScope", () => {
  it("ne vaut rien sans le module Agenda, même restreint", () => {
    expect(spaceAgendaScope({ modules: ["TODO"], restrictVisibility: true })).toBe("DISABLED");
  });

  it("montre les entrées de tous par défaut", () => {
    expect(spaceAgendaScope({ modules: ["AGENDA"], restrictVisibility: false })).toBe("MEMBERS");
  });

  it("ne montre que les siennes quand l'Espace restreint sa visibilité", () => {
    expect(spaceAgendaScope({ modules: ["AGENDA"], restrictVisibility: true })).toBe("OWN");
  });
});
