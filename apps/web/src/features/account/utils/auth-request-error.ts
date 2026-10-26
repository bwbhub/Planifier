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
