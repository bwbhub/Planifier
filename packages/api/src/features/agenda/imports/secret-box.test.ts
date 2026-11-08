import { randomBytes } from "node:crypto";

import { describe, expect, it } from "vitest";

import { createSecretBox, parseSecretKey } from "./secret-box";

const CONTEXT = "subscription-1";
const LINK = "https://calendar.google.com/calendar/ical/abc/private-xyz/basic.ics";

describe("createSecretBox", () => {
  const box = createSecretBox(randomBytes(32));

  it("rend le texte d'origine, accents compris", () => {
    expect(box.open(box.seal(LINK, CONTEXT), CONTEXT)).toBe(LINK);
    expect(box.open(box.seal("Été ✓ 😀", CONTEXT), CONTEXT)).toBe("Été ✓ 😀");
  });

  it("ne laisse rien lire du texte et change à chaque chiffrement", () => {
    const first = box.seal(LINK, CONTEXT);

    expect(first).not.toContain("google");
    expect(first.startsWith("v1.")).toBe(true);
    expect(box.seal(LINK, CONTEXT)).not.toBe(first);
  });

  it("refuse un texte altéré, une autre clé et un autre format, sans lever", () => {
    const sealed = box.seal(LINK, CONTEXT);
    const [version, iv, tag, encrypted] = sealed.split(".");
    const flipped = `${version ?? ""}.${iv ?? ""}.${tag ?? ""}.${(encrypted ?? "").replace(/^./, (c) => (c === "A" ? "B" : "A"))}`;

    expect(box.open(flipped, CONTEXT)).toBeNull();
    expect(createSecretBox(randomBytes(32)).open(sealed, CONTEXT)).toBeNull();
    for (const bad of ["", "clair", "v2.a.b.c", "v1.a.b", `${sealed}.x`, "v1...."]) {
      expect(box.open(bad, CONTEXT)).toBeNull();
    }
  });

  it("refuse un chiffré recopié sur une autre ressource", () => {
    const sealed = box.seal(LINK, CONTEXT);

    expect(box.open(sealed, "subscription-2")).toBeNull();
  });

  it("refuse une étiquette tronquée ou un IV de mauvaise longueur", () => {
    const [version, iv, tag, encrypted] = box.seal(LINK, CONTEXT).split(".");
    const short = (value = "") =>
      Buffer.from(value, "base64url").subarray(0, 4).toString("base64url");

    expect(box.open([version, iv, short(tag), encrypted].join("."), CONTEXT)).toBeNull();
    expect(box.open([version, short(iv), tag, encrypted].join("."), CONTEXT)).toBeNull();
  });

  it("refuse une clé qui n'a pas 32 octets", () => {
    expect(() => createSecretBox(randomBytes(16))).toThrow();
    expect(() => parseSecretKey("trop-court")).toThrow();
    expect(() => parseSecretKey(`${randomBytes(32).toString("base64")}!!`)).toThrow();
    expect(parseSecretKey(randomBytes(32).toString("base64"))).toHaveLength(32);
  });
});
