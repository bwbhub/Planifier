// Bornes d'un compte, partagées par l'authentification (serveur) et les formulaires (web).

/** Nom affiché : non vide une fois nettoyé, 100 caractères au plus. */
export const DISPLAY_NAME_MAX_LENGTH = 100;

/** Mot de passe : bornes appliquées par Better Auth à l'inscription et à la connexion. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

/** Thème préféré : `SYSTEM` suit le réglage de l'appareil. Miroir de l'enum Prisma `ThemePreference`. */
export const THEME_PREFERENCES = ["SYSTEM", "LIGHT", "DARK"] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];
