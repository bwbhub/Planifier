import {
  AUTH_ROUTES,
  authErrorBodySchema,
  type ChangePasswordInput,
  type SignInInput,
  type SignUpInput,
  type UpdateProfileInput,
} from "@planifier/api-contract";
import { AUTH_BASE_PATH } from "@planifier/constants/http";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { AuthRequestError } from "../utils/auth-request-error";

/**
 * Appel d'une route de Better Auth par le proxy même origine (`/api/auth/*`) ; le cookie suit seul. `fetch` direct :
 * ces routes sont hors oRPC, et `better-auth/client` ajouterait la bibliothèque au navigateur sans typage fin (le
 * type de l'instance serveur vit dans `@planifier/auth`, interdit au web). Corps décrits par `api-contract`.
 */
async function postAuth(route: string, body: object): Promise<void> {
  const response = await fetch(`${AUTH_BASE_PATH}${route}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (response.ok) return;
  const errorBody: unknown = await response.json().catch(() => null);
  const parsed = authErrorBodySchema.safeParse(errorBody);
  throw new AuthRequestError(response.status, parsed.success ? (parsed.data.code ?? null) : null);
}

// Chaque changement de session vide le cache : aucune donnée d'un compte ne survit sous un autre.
function useAuthMutation<TInput>(mutationFn: (input: TInput) => Promise<void>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useSignIn() {
  return useAuthMutation((input: SignInInput) => postAuth(AUTH_ROUTES.signIn, input));
}

export function useSignUp() {
  return useAuthMutation((input: SignUpInput) => postAuth(AUTH_ROUTES.signUp, input));
}

export function useSignOut() {
  return useAuthMutation(() => postAuth(AUTH_ROUTES.signOut, {}));
}

/**
 * Nom et thème. Pas `useAuthMutation` : la session reste la même, le cache est gardé ; seules les pages serveur
 * (nom affiché, thème du `<html>`) sont relues.
 */
export function useUpdateProfile() {
  const router = useRouter();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => postAuth(AUTH_ROUTES.updateUser, input),
    onSuccess: () => {
      router.refresh();
    },
  });
}

/**
 * Ni `useAuthMutation` ni vidage du cache : la session courante reste ouverte (les autres sont fermées si
 * l'utilisateur l'a demandé, `revokeOtherSessions`).
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) => postAuth(AUTH_ROUTES.changePassword, input),
  });
}
