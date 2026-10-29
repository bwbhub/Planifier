import { describe, expect, it } from "vitest";

import { returnPathOf, ROUTES, signInReturningTo } from "./routes";

describe("returnPathOf", () => {
  it("accepte une page de la liste", () => {
    expect(returnPathOf(ROUTES.joinSpace)).toBe(ROUTES.joinSpace);
  });

  it("refuse toute autre adresse, dont une adresse externe", () => {
    expect(returnPathOf("https://exemple.test/rejoindre")).toBeNull();
    expect(returnPathOf("//exemple.test")).toBeNull();
    expect(returnPathOf(ROUTES.profile)).toBeNull();
    expect(returnPathOf(undefined)).toBeNull();
    expect(returnPathOf([ROUTES.joinSpace])).toBeNull();
  });
});

describe("signInReturningTo", () => {
  it("garde la page de retour dans la requête de la connexion", () => {
    const url = new URL(signInReturningTo(ROUTES.joinSpace), "https://planifier.test");
    expect(url.pathname).toBe(ROUTES.signIn);
    expect(url.searchParams.get("retour")).toBe(ROUTES.joinSpace);
  });
});
