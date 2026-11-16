import { ORPCError } from "@orpc/server";

/** Position dans la liste : clé de tri et identifiant du dernier événement lu. Opaque pour le client. */
export interface EventCursor {
  startKey: Date;
  id: string;
}

const SEPARATOR = "_";

export function encodeCursor({ startKey, id }: EventCursor): string {
  return `${startKey.toISOString()}${SEPARATOR}${id}`;
}

/** Curseur reçu du client : valeur fabriquée ou périmée ⇒ BAD_REQUEST, jamais une erreur de base. */
export function decodeCursor(cursor: string): EventCursor {
  const at = cursor.indexOf(SEPARATOR);
  const startKey = new Date(at === -1 ? Number.NaN : cursor.slice(0, at));
  const id = at === -1 ? "" : cursor.slice(at + 1);
  if (Number.isNaN(startKey.getTime()) || id.length === 0) throw new ORPCError("BAD_REQUEST");
  return { startKey, id };
}
