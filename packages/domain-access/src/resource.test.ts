import {
  SHARE_LEVELS,
  SPACE_ROLES,
  type ShareLevel,
  type SpaceRole,
} from "@planifier/constants/spaces";
import { describe, expect, it } from "vitest";

import {
  canAccessResource,
  RESOURCE_ACTIONS,
  resourceLevel,
  type ResourceAccess,
} from "./resource";

const ME = "user-me";
const OTHER = "user-other";

/** Un inconnu : ni propriétaire, ni membre de l'Espace, aucun partage. */
const stranger: ResourceAccess = {
  userId: ME,
  ownerId: OTHER,
  spaceRole: null,
  spaceLevel: "READ",
  shareLevel: "NONE",
};

const spaceRoles: (SpaceRole | null)[] = [null, ...SPACE_ROLES];

function everyAccess(): ResourceAccess[] {
  const all: ResourceAccess[] = [];
  for (const userId of [ME, OTHER]) {
    for (const spaceRole of spaceRoles) {
      for (const spaceLevel of SHARE_LEVELS) {
        for (const shareLevel of SHARE_LEVELS) {
          all.push({ userId, ownerId: OTHER, spaceRole, spaceLevel, shareLevel });
        }
      }
    }
  }
  return all;
}

describe("canAccessResource : cas d'or", () => {
  it("donne tous les droits au propriétaire", () => {
    const owner = { ...stranger, userId: OTHER };
    expect(RESOURCE_ACTIONS.map((action) => canAccessResource(owner, action))).toEqual([
      true,
      true,
      true,
      true,
    ]);
  });

  it("ne donne rien à un inconnu, même si l'Espace accorde READ", () => {
    expect(RESOURCE_ACTIONS.some((action) => canAccessResource(stranger, action))).toBe(false);
  });

  it("laisse un membre lire, sans écrire ni supprimer, par défaut", () => {
    const member = { ...stranger, spaceRole: "MEMBER" } satisfies ResourceAccess;
    expect(canAccessResource(member, "read")).toBe(true);
    expect(canAccessResource(member, "write")).toBe(false);
    expect(canAccessResource(member, "delete")).toBe(false);
    expect(canAccessResource(member, "share")).toBe(false);
  });

  it("laisse un membre écrire sur une liste partagée (spaceLevel WRITE)", () => {
    const member = {
      ...stranger,
      spaceRole: "MEMBER",
      spaceLevel: "WRITE",
    } satisfies ResourceAccess;
    expect(canAccessResource(member, "write")).toBe(true);
    expect(canAccessResource(member, "delete")).toBe(false);
  });

  it("cache la ressource à un membre quand l'Espace restreint la visibilité", () => {
    const member = {
      ...stranger,
      spaceRole: "MEMBER",
      spaceLevel: "NONE",
    } satisfies ResourceAccess;
    expect(canAccessResource(member, "read")).toBe(false);
  });

  it("laisse le propriétaire d'Espace supprimer, sans écrire ni partager", () => {
    const spaceOwner = { ...stranger, spaceRole: "OWNER" } satisfies ResourceAccess;
    expect(canAccessResource(spaceOwner, "delete")).toBe(true);
    expect(canAccessResource(spaceOwner, "write")).toBe(false);
    expect(canAccessResource(spaceOwner, "share")).toBe(false);
  });

  it("refuse la suppression au propriétaire d'Espace quand l'Espace lui cache la ressource", () => {
    const spaceOwner = {
      ...stranger,
      spaceRole: "OWNER",
      spaceLevel: "NONE",
    } satisfies ResourceAccess;
    expect(canAccessResource(spaceOwner, "delete")).toBe(false);
  });

  it("applique un partage direct READ puis WRITE hors Espace", () => {
    const reader = { ...stranger, shareLevel: "READ" } satisfies ResourceAccess;
    const writer = { ...stranger, shareLevel: "WRITE" } satisfies ResourceAccess;
    expect(canAccessResource(reader, "read")).toBe(true);
    expect(canAccessResource(reader, "write")).toBe(false);
    expect(canAccessResource(writer, "write")).toBe(true);
    expect(canAccessResource(writer, "delete")).toBe(false);
    expect(canAccessResource(writer, "share")).toBe(false);
  });

  it("garde le niveau le plus élevé entre partage direct et Espace", () => {
    const access = {
      ...stranger,
      spaceRole: "MEMBER",
      spaceLevel: "READ",
      shareLevel: "WRITE",
    } satisfies ResourceAccess;
    expect(resourceLevel(access)).toBe("WRITE");
  });
});

describe("canAccessResource : invariants sur toutes les combinaisons", () => {
  it("n'accorde ni lecture ni droit à qui n'est ni propriétaire, ni membre, ni partagé", () => {
    for (const access of everyAccess()) {
      const hasNoLink =
        access.userId !== access.ownerId &&
        access.spaceRole === null &&
        access.shareLevel === "NONE";
      if (hasNoLink) {
        expect(RESOURCE_ACTIONS.some((action) => canAccessResource(access, action))).toBe(false);
      }
    }
  });

  it("n'accorde jamais une action sans la lecture", () => {
    for (const access of everyAccess()) {
      if (!canAccessResource(access, "read")) {
        expect(RESOURCE_ACTIONS.some((action) => canAccessResource(access, action))).toBe(false);
      }
    }
  });

  it("ne retire aucun droit quand le partage direct monte d'un niveau", () => {
    const rank = (level: ShareLevel) => SHARE_LEVELS.indexOf(level);
    for (const low of everyAccess()) {
      for (const high of SHARE_LEVELS.filter((level) => rank(level) > rank(low.shareLevel))) {
        for (const action of RESOURCE_ACTIONS) {
          if (canAccessResource(low, action)) {
            expect(canAccessResource({ ...low, shareLevel: high }, action)).toBe(true);
          }
        }
      }
    }
  });

  it("réserve le partage au propriétaire", () => {
    for (const access of everyAccess()) {
      expect(canAccessResource(access, "share")).toBe(access.userId === access.ownerId);
    }
  });
});
