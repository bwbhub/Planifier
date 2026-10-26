import {
  DISPLAY_NAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@planifier/constants/account";
import { z } from "zod";

import { themePreferenceSchema } from "../me/me.schemas";

// Routes de Better Auth (ADR 0016), hors oRPC : leurs corps sont décrits ici pour que le web et le serveur
// partagent les mêmes bornes. Le serveur revalide toujours (le web ne fait qu'anticiper les erreurs).

/** Chemins relatifs à `AUTH_BASE_PATH` (`@planifier/constants/http`). */
export const AUTH_ROUTES = {
  signUp: "/sign-up/email",
  signIn: "/sign-in/email",
  signOut: "/sign-out",
  updateUser: "/update-user",
  changePassword: "/change-password",
  requestPasswordReset: "/request-password-reset",
  resetPassword: "/reset-password",
} as const;

/** Codes d'erreur de Better Auth que l'interface distingue ; les autres reçoivent un message générique. */
export const AUTH_ERROR_CODES = {
  invalidCredentials: "INVALID_EMAIL_OR_PASSWORD",
  /** Connexion avant d'avoir confirmé l'adresse : un nouveau lien vient de partir. */
  emailNotVerified: "EMAIL_NOT_VERIFIED",
  /** Lien de nouveau mot de passe inconnu, déjà servi ou expiré. */
  invalidToken: "INVALID_TOKEN",
  /** Mot de passe actuel faux, au changement de mot de passe. */
  invalidPassword: "INVALID_PASSWORD",
} as const;

const emailSchema = z.string().trim().pipe(z.email());
const displayNameSchema = z.string().trim().min(1).max(DISPLAY_NAME_MAX_LENGTH);
const newPasswordSchema = z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH);

export const signUpInputSchema = z.strictObject({
  name: displayNameSchema,
  email: emailSchema,
  password: newPasswordSchema,
});

/** Connexion : mot de passe requis, sans autre règle (le serveur seul dit s'il est faux, sans indice). */
export const signInInputSchema = z.strictObject({
  email: emailSchema,
  password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
});

/** Profil modifiable : nom et thème. L'e-mail attend sa vérification par e-mail (package `mails`). */
export const updateProfileInputSchema = z.strictObject({
  name: displayNameSchema,
  preferredTheme: themePreferenceSchema,
});

/** Changement de mot de passe : l'actuel est exigé ; fermer les autres sessions est le choix de l'utilisateur. */
export const changePasswordInputSchema = z.strictObject({
  currentPassword: z.string().min(1).max(PASSWORD_MAX_LENGTH),
  newPassword: newPasswordSchema,
  revokeOtherSessions: z.boolean(),
});

/** Mot de passe oublié : l'e-mail seul. La réponse est la même, qu'un compte existe ou non. */
export const requestPasswordResetInputSchema = z.strictObject({
  email: emailSchema,
});

/** Nouveau mot de passe, avec le jeton reçu par e-mail (lu dans l'URL du lien). */
export const resetPasswordInputSchema = z.strictObject({
  newPassword: newPasswordSchema,
  token: z.string().min(1),
});

/** Corps d'erreur de Better Auth : seuls ces champs sont lus, les autres sont ignorés. */
export const authErrorBodySchema = z.object({
  code: z.string().optional(),
});

export type SignUpInput = z.infer<typeof signUpInputSchema>;
export type SignInInput = z.infer<typeof signInInputSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetInputSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;

/**
 * Corps envoyés à chaque route de Better Auth : l'entrée validée du formulaire, plus, pour les routes qui envoient un
 * e-mail, la page où ramène son lien (`AUTH_PAGES`, `@planifier/constants/account`).
 */
export interface AuthRequestBodies {
  [AUTH_ROUTES.signUp]: SignUpInput & { callbackURL: string };
  [AUTH_ROUTES.signIn]: SignInInput & { callbackURL: string };
  [AUTH_ROUTES.signOut]: Record<string, never>;
  [AUTH_ROUTES.updateUser]: UpdateProfileInput;
  [AUTH_ROUTES.changePassword]: ChangePasswordInput;
  [AUTH_ROUTES.requestPasswordReset]: RequestPasswordResetInput & { redirectTo: string };
  [AUTH_ROUTES.resetPassword]: ResetPasswordInput;
}

export type AuthRoute = keyof AuthRequestBodies;
