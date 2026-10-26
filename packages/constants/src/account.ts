// Bornes d'un compte, partagées par l'authentification (serveur) et les formulaires (web).

/** Nom affiché : non vide une fois nettoyé, 100 caractères au plus. */
export const DISPLAY_NAME_MAX_LENGTH = 100;

/** Mot de passe : bornes appliquées par Better Auth à l'inscription et à la connexion. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

/** Thème préféré : `SYSTEM` suit le réglage de l'appareil. Miroir de l'enum Prisma `ThemePreference`. */
export const THEME_PREFERENCES = ["SYSTEM", "LIGHT", "DARK"] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

/** Durée de validité des liens envoyés par e-mail (vérification d'adresse, nouveau mot de passe). */
export const EMAIL_LINK_TTL_MINUTES = 60;
export const EMAIL_LINK_TTL_SECONDS = EMAIL_LINK_TTL_MINUTES * 60;
/** La même durée, telle que la lisent les e-mails et les écrans (« Le lien est valable 60 minutes »). */
export const EMAIL_LINK_VALIDITY = `${String(EMAIL_LINK_TTL_MINUTES)} minutes`;

/**
 * Pages du web où mènent les liens des e-mails : passées à Better Auth (`callbackURL`, `redirectTo`), qui y renvoie
 * avec `?error=…` quand le lien ne vaut plus rien. Après la vérification d'adresse, la session est ouverte : la page
 * de connexion renvoie alors à l'accueil.
 */
export const AUTH_PAGES = {
  signIn: "/connexion",
  resetPassword: "/nouveau-mot-de-passe",
} as const;
