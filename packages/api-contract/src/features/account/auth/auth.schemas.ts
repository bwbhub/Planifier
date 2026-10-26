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
} as const;

/** Codes d'erreur de Better Auth que l'interface distingue ; les autres reçoivent un message générique. */
export const AUTH_ERROR_CODES = {
  invalidCredentials: "INVALID_EMAIL_OR_PASSWORD",
  emailTaken: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
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

/**
 * Changement de mot de passe : l'actuel est exigé. Politique fixée ici, pas par le formulaire : les autres sessions
 * sont toujours fermées (un mot de passe changé par crainte d'une fuite ne laisse aucune session ouverte ailleurs).
 */
export const changePasswordInputSchema = z.strictObject({
  currentPassword: z.string().min(1).max(PASSWORD_MAX_LENGTH),
  newPassword: newPasswordSchema,
  revokeOtherSessions: z.literal(true).default(true),
});

/** Corps d'erreur de Better Auth : seuls ces champs sont lus, les autres sont ignorés. */
export const authErrorBodySchema = z.object({
  code: z.string().optional(),
});

export type SignUpInput = z.infer<typeof signUpInputSchema>;
export type SignInInput = z.infer<typeof signInInputSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;
