import { AUTH_ERROR_CODES } from "@planifier/api-contract";

import { AuthRequestError } from "./auth-request-error";

const TOO_MANY_REQUESTS = 429;

/**
 * Message à montrer après un refus d'une route de session. À la connexion, ne dit jamais lequel de l'e-mail ou du
 * mot de passe est faux ; seul un compte déjà connecté apprend que son mot de passe actuel est faux.
 */
export function authErrorMessage(error: unknown): string {
  if (error instanceof AuthRequestError) {
    if (error.status === TOO_MANY_REQUESTS) {
      return "Trop de tentatives d'affilée. Patiente quelques secondes, puis réessaie.";
    }
    if (error.code === AUTH_ERROR_CODES.invalidCredentials) {
      return "E-mail ou mot de passe incorrect.";
    }
    if (error.code === AUTH_ERROR_CODES.emailTaken) {
      return "Un compte existe déjà avec cet e-mail. Tu peux te connecter.";
    }
    if (error.code === AUTH_ERROR_CODES.invalidPassword) {
      return "Mot de passe actuel incorrect.";
    }
  }
  return "Quelque chose n'a pas fonctionné. Réessaie dans un instant.";
}
