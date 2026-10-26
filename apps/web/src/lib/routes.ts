import { AUTH_PAGES } from "@planifier/api-contract";

/** Chemins des pages, partagés par les redirections (gardes serveur, session expirée) et les liens. */
export const ROUTES = {
  home: "/",
  signIn: AUTH_PAGES.signIn,
  signUp: "/inscription",
  forgotPassword: "/mot-de-passe-oublie",
  resetPassword: AUTH_PAGES.resetPassword,
  profile: "/profil",
} as const;
