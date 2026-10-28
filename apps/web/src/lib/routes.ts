import { AUTH_PAGES } from "@planifier/constants/account";

/** Chemins des pages, partagés par les redirections (gardes serveur, session expirée) et les liens. */
export const ROUTES = {
  home: "/",
  signIn: AUTH_PAGES.signIn,
  signUp: "/inscription",
  forgotPassword: "/mot-de-passe-oublie",
  resetPassword: AUTH_PAGES.resetPassword,
  profile: "/profil",
  spaces: "/espaces",
  newSpace: "/espaces/nouveau",
  /** Lien d'invitation à un Espace : le jeton suit dans le fragment (`#…`), jamais envoyé au serveur. */
  joinSpace: "/rejoindre",
} as const;

export function spaceRoute(spaceId: string): string {
  return `${ROUTES.spaces}/${spaceId}`;
}

export function spaceSettingsRoute(spaceId: string): string {
  return `${spaceRoute(spaceId)}/reglages`;
}

/** Paramètre de la page de connexion : page où revenir une fois connecté. */
export const RETURN_PARAM = "retour";

/** Pages où la connexion peut ramener : liste fermée, jamais une adresse reçue telle quelle (redirection ouverte). */
const RETURN_PATHS = [ROUTES.joinSpace] as const;
export type ReturnPath = (typeof RETURN_PATHS)[number];

/** Pourquoi se connecter, montré sur la page de connexion : déclaré avec la page de retour, pas dans `account`. */
const RETURN_NOTICES: Record<ReturnPath, string> = {
  [ROUTES.joinSpace]:
    "Connecte-toi pour rejoindre l'Espace. Pas encore de compte ? Crée-le, puis rouvre le lien d'invitation.",
};

export function returnNoticeOf(returnTo: ReturnPath): string {
  return RETURN_NOTICES[returnTo];
}

/** Connexion qui ramène ensuite à `returnTo`. */
export function signInReturningTo(returnTo: ReturnPath): string {
  return `${ROUTES.signIn}?${new URLSearchParams({ [RETURN_PARAM]: returnTo }).toString()}`;
}

/** Page de retour lue dans l'adresse, si elle fait partie de la liste ; sinon `null`. */
export function returnPathOf(value: unknown): ReturnPath | null {
  return RETURN_PATHS.find((path) => path === value) ?? null;
}
