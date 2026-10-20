import { describe, expect, it } from "vitest";

import { lastHopIpOf } from "./last-hop-ip";

function headersWith(forwarded?: string) {
  return new Headers(forwarded === undefined ? {} : { "x-forwarded-for": forwarded });
}

describe("lastHopIpOf", () => {
  it("prend l'entrée ajoutée par le dernier relais, pas celle du navigateur", () => {
    expect(lastHopIpOf(headersWith("6.6.6.6, 192.0.2.1"))).toBe("192.0.2.1");
  });

  it("accepte une IPv6", () => {
    expect(lastHopIpOf(headersWith("2001:db8::1"))).toBe("2001:db8::1");
  });

  it.each([undefined, "", "pas-une-ip", "192.0.2.1, ", "192.0.2.1, x"])(
    "rend null pour %j",
    (forwarded) => {
      expect(lastHopIpOf(headersWith(forwarded))).toBeNull();
    },
  );
});
