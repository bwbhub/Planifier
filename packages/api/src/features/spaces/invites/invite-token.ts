import { createHash, randomBytes } from "node:crypto";

const TOKEN_BYTES = 32;

/** Empreinte stockée en base : un jeton lu dans la base ne permet pas de rejoindre l'Espace. */
export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Jeton aléatoire du lien (base64url, 43 caractères) et son empreinte. */
export function createInviteToken(): { token: string; tokenHash: string } {
  const token = randomBytes(TOKEN_BYTES).toString("base64url");
  return { token, tokenHash: hashInviteToken(token) };
}
