import { EVENT_ROLES, type EventRole } from "@planifier/constants/events";
import { describe, expect, it } from "vitest";

import { canAccessEvent, EVENT_ACTIONS, type EventAccess, type EventAction } from "./event";

const base: EventAccess = { role: null, hasOwner: true, allowGuestInvite: false, viaSpace: false };

function allowedActions(access: EventAccess): EventAction[] {
  return EVENT_ACTIONS.filter((action) => canAccessEvent(access, action));
}

/** Matrice attendue (ADR 0009), écrite indépendamment de l'implémentation. */
const expected: Record<EventRole, EventAction[]> = {
  OWNER: [
    "view",
    "update",
    "react",
    "comment",
    "invite",
    "validate_proposal",
    "activate_brick",
    "deactivate_brick",
    "delete",
  ],
  ORGANIZER: [
    "view",
    "update",
    "react",
    "comment",
    "invite",
    "validate_proposal",
    "activate_brick",
  ],
  GUEST: ["view", "react", "comment", "propose_invite"],
};

describe("canAccessEvent : matrice par rôle", () => {
  it.each(EVENT_ROLES)("accorde au rôle %s exactement ses actions", (role) => {
    expect(allowedActions({ ...base, role })).toEqual(expected[role]);
  });

  it("ne donne rien à qui ne participe pas et n'est pas dans l'Espace", () => {
    expect(allowedActions(base)).toEqual([]);
  });

  it("laisse un membre d'Espace voir l'événement sans autre droit", () => {
    expect(allowedActions({ ...base, viaSpace: true })).toEqual(["view"]);
  });

  it("n'ajoute aucun droit à un participant qui est aussi membre de l'Espace", () => {
    expect(allowedActions({ ...base, role: "GUEST", viaSpace: true })).toEqual(expected.GUEST);
  });
});

describe("canAccessEvent : cas contextuels", () => {
  it("fait inviter directement l'invité quand allowGuestInvite est actif, sans proposition", () => {
    const actions = allowedActions({ ...base, role: "GUEST", allowGuestInvite: true });
    expect(actions).toContain("invite");
    expect(actions).not.toContain("propose_invite");
  });

  it("laisse un co-organisateur reprendre la propriété quand le propriétaire est parti", () => {
    expect(canAccessEvent({ ...base, role: "ORGANIZER", hasOwner: false }, "take_ownership")).toBe(
      true,
    );
  });

  it("refuse la reprise tant qu'il y a un propriétaire", () => {
    expect(canAccessEvent({ ...base, role: "ORGANIZER" }, "take_ownership")).toBe(false);
  });

  it("refuse la reprise à un invité ou à un tiers", () => {
    expect(canAccessEvent({ ...base, role: "GUEST", hasOwner: false }, "take_ownership")).toBe(
      false,
    );
    expect(canAccessEvent({ ...base, hasOwner: false }, "take_ownership")).toBe(false);
  });
});
