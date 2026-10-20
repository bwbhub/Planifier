import {
  AUTH_ROUTES,
  authErrorBodySchema,
  type SignInInput,
  type SignUpInput,
} from "@planifier/api-contract";
import { AUTH_BASE_PATH } from "@planifier/constants/http";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/** Refus d'une route d'authentification : statut HTTP et code de Better Auth s'il est lisible. */
export class AuthRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | null,
  ) {
    super(`Authentification refusée (${String(status)})`);
    this.name = "AuthRequestError";
  }
}

/** Appel d'une route de Better Auth par le proxy même origine (`/api/auth/*`) ; le cookie suit seul. */
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
