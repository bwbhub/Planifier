import { AUTH_ERROR_CODES } from "@planifier/api-contract";
import { describe, expect, it } from "vitest";

import { authErrorMessage } from "./auth-error-message";
import { AuthRequestError } from "./auth-request-error";

describe("authErrorMessage", () => {
  it("ne dit pas lequel de l'e-mail ou du mot de passe est faux", () => {
    expect(authErrorMessage(new AuthRequestError(401, AUTH_ERROR_CODES.invalidCredentials))).toBe(
      "E-mail ou mot de passe incorrect.",
    );
  });

  it("propose de se connecter quand l'e-mail a déjà un compte", () => {
    expect(authErrorMessage(new AuthRequestError(422, AUTH_ERROR_CODES.emailTaken))).toContain(
      "Tu peux te connecter",
    );
  });

  it("demande de patienter quand le débit est dépassé, quel que soit le code", () => {
    expect(authErrorMessage(new AuthRequestError(429, null))).toContain("Patiente");
  });

  it.each([new AuthRequestError(500, null), new TypeError("Failed to fetch"), "inattendu"])(
    "donne un message générique pour %s",
    (error) => {
      expect(authErrorMessage(error)).toBe(
        "Quelque chose n'a pas fonctionné. Réessaie dans un instant.",
      );
    },
  );
});
