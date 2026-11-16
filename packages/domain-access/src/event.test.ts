import { EVENT_ROLES, type EventRole } from "@planifier/constants/events";
import { describe, expect, it } from "vitest";

import {
  canAccessEvent,
  canDeleteComment,
  canRemoveParticipant,
  canSetRole,
  EVENT_ACTIONS,
  type EventAccess,
  type EventAction,
} from "./event";

const base: EventAccess = {
  role: null,
  hasOwner: true,
  allowGuestInvite: false,
  isGuestListVisible: true,
  viaSpace: false,
  invitedByEmail: false,
};

function allowedActions(access: EventAccess): EventAction[] {
  return EVENT_ACTIONS.filter((action) => canAccessEvent(access, action));
}

/** Matrice attendue (ADR 0009), écrite indépendamment de l'implémentation, dans l'ordre de `EVENT_ACTIONS`. */
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
    "manage_roles",
    "remove_guest",
    "mark_important",
    "see_guest_list",
    "change_space",
    "see_invite_emails",
  ],
  ORGANIZER: [
    "view",
    "update",
    "react",
    "comment",
    "invite",
    "validate_proposal",
    "activate_brick",
    "remove_guest",
    "mark_important",
    "see_guest_list",
    "see_invite_emails",
  ],
  GUEST: ["view", "react", "comment", "propose_invite", "see_guest_list"],
};

describe("canAccessEvent : matrice par rôle", () => {
  it.each(EVENT_ROLES)("accorde au rôle %s exactement ses actions", (role) => {
    expect(allowedActions({ ...base, role })).toEqual(expected[role]);
  });

  it("ne donne rien à qui ne participe pas, n'est pas dans l'Espace et n'est pas invité", () => {
    expect(allowedActions(base)).toEqual([]);
  });

  it("n'ajoute aucun droit à un participant qui est aussi membre de l'Espace ou invité", () => {
    expect(
      allowedActions({ ...base, role: "GUEST", viaSpace: true, invitedByEmail: true }),
    ).toEqual(expected.GUEST);
  });
});

describe("canAccessEvent : sans participation", () => {
  it("laisse un membre d'Espace voir l'événement et la liste des invités, sans autre droit", () => {
    expect(allowedActions({ ...base, viaSpace: true })).toEqual(["view", "see_guest_list"]);
  });

  it("cache la liste des invités à un membre d'Espace quand l'événement la masque", () => {
    expect(allowedActions({ ...base, viaSpace: true, isGuestListVisible: false })).toEqual([
      "view",
    ]);
  });

  it("laisse un invité par e-mail voir l'événement et y répondre, sans autre droit", () => {
    expect(allowedActions({ ...base, invitedByEmail: true })).toEqual(["view", "react"]);
  });

  it("cumule les droits d'un invité par e-mail qui est aussi membre de l'Espace", () => {
    expect(allowedActions({ ...base, invitedByEmail: true, viaSpace: true })).toEqual([
      "view",
      "react",
      "see_guest_list",
    ]);
  });
});

describe("canAccessEvent : cas contextuels", () => {
  it("fait inviter directement l'invité quand allowGuestInvite est actif, sans proposition", () => {
    const actions = allowedActions({ ...base, role: "GUEST", allowGuestInvite: true });
    expect(actions).toContain("invite");
    expect(actions).not.toContain("propose_invite");
  });

  it("cache la liste des invités à un invité quand l'événement la masque, jamais aux organisateurs", () => {
    const hidden = { ...base, isGuestListVisible: false };
    expect(canAccessEvent({ ...hidden, role: "GUEST" }, "see_guest_list")).toBe(false);
    expect(canAccessEvent({ ...hidden, role: "ORGANIZER" }, "see_guest_list")).toBe(true);
    expect(canAccessEvent({ ...hidden, role: "OWNER" }, "see_guest_list")).toBe(true);
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

describe("canRemoveParticipant", () => {
  const cases: [EventRole, EventRole, boolean][] = [
    ["OWNER", "ORGANIZER", true],
    ["OWNER", "GUEST", true],
    ["OWNER", "OWNER", false],
    ["ORGANIZER", "GUEST", true],
    ["ORGANIZER", "ORGANIZER", false],
    ["ORGANIZER", "OWNER", false],
    ["GUEST", "GUEST", false],
    ["GUEST", "ORGANIZER", false],
  ];

  it.each(cases)("%s retire %s : %s", (callerRole, targetRole, allowed) => {
    expect(canRemoveParticipant({ callerRole, targetRole, isSelf: false })).toBe(allowed);
  });

  it("ne retire rien sans rôle", () => {
    expect(canRemoveParticipant({ callerRole: null, targetRole: "GUEST", isSelf: false })).toBe(
      false,
    );
  });

  it("ne retire jamais soi-même", () => {
    expect(
      canRemoveParticipant({ callerRole: "ORGANIZER", targetRole: "GUEST", isSelf: true }),
    ).toBe(false);
  });
});

describe("canDeleteComment", () => {
  it("laisse l'auteur retirer son commentaire écrit", () => {
    expect(canDeleteComment({ role: "GUEST", isAuthor: true, kind: "TEXT" })).toBe(true);
  });

  it("refuse à un invité le commentaire d'un autre", () => {
    expect(canDeleteComment({ role: "GUEST", isAuthor: false, kind: "TEXT" })).toBe(false);
  });

  it("laisse un organisateur retirer n'importe quel commentaire, y compris un message de changement", () => {
    for (const role of ["OWNER", "ORGANIZER"] as const) {
      expect(canDeleteComment({ role, isAuthor: false, kind: "TEXT" })).toBe(true);
      expect(canDeleteComment({ role, isAuthor: false, kind: "CHANGE" })).toBe(true);
    }
  });

  it("refuse à un invité de retirer un message de changement, même s'il en est l'auteur", () => {
    expect(canDeleteComment({ role: "GUEST", isAuthor: true, kind: "CHANGE" })).toBe(false);
  });

  it("refuse à qui ne participe pas", () => {
    expect(canDeleteComment({ role: null, isAuthor: true, kind: "TEXT" })).toBe(false);
  });
});

describe("canSetRole", () => {
  it("laisse changer le rôle d'un co-organisateur ou d'un invité", () => {
    expect(canSetRole({ targetRole: "ORGANIZER", isSelf: false })).toBe(true);
    expect(canSetRole({ targetRole: "GUEST", isSelf: false })).toBe(true);
  });

  it("ne touche ni au propriétaire ni à soi-même", () => {
    expect(canSetRole({ targetRole: "OWNER", isSelf: false })).toBe(false);
    expect(canSetRole({ targetRole: "ORGANIZER", isSelf: true })).toBe(false);
  });
});
