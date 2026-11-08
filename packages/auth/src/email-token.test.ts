import { createEmailVerificationToken } from "better-auth/api";
import { describe, expect, it } from "vitest";

import { isChangeEmailToken, readEmailTokenPayload } from "./email-token";

const SECRET = "secret-de-test-0123456789abcdef0123456789";

describe("readEmailTokenPayload", () => {
  it("relit adresse, nouvelle adresse et type d'un jeton de changement", async () => {
    const token = await createEmailVerificationToken(
      SECRET,
      "Ancienne@Test.fr",
      "nouvelle@test.fr",
      60,
      {
        requestType: "change-email-verification",
      },
    );

    expect(readEmailTokenPayload(token)).toMatchObject({
      email: "ancienne@test.fr",
      updateTo: "nouvelle@test.fr",
      requestType: "change-email-verification",
    });
    expect(isChangeEmailToken(token)).toBe(true);
  });

  it("ne prend pas un jeton d'inscription pour un changement", async () => {
    const token = await createEmailVerificationToken(SECRET, "eve@test.fr");

    expect(isChangeEmailToken(token)).toBe(false);
  });

  it.each(["", "a.b.c", "pas-un-jeton", "a.e30.c"])("refuse la forme %j", (token) => {
    expect(readEmailTokenPayload(token)).toBeNull();
  });
});
