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

  it("annonce le nouveau lien quand l'adresse n'est pas encore confirmée", () => {
    expect(
      authErrorMessage(new AuthRequestError(403, AUTH_ERROR_CODES.emailNotVerified)),
    ).toContain("un nouveau lien vient de partir");
  });

  it("propose un nouveau lien quand celui du mot de passe ne vaut plus rien", () => {
    expect(authErrorMessage(new AuthRequestError(400, AUTH_ERROR_CODES.invalidToken))).toContain(
      "Demande-en un nouveau",
    );
  });

  it("dit au compte connecté que son mot de passe actuel est faux", () => {
    expect(authErrorMessage(new AuthRequestError(400, AUTH_ERROR_CODES.invalidPassword))).toBe(
      "Mot de passe actuel incorrect.",
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
