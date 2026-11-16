import { ORPCError } from "@orpc/server";
import type { DbTransaction } from "@planifier/db";

/**
 * Verrouille la ligne de l'événement jusqu'à la fin de la transaction : les réponses d'un même événement passent
 * l'une après l'autre (pas de course sur le nombre de places). Événement supprimé entre-temps ⇒ NOT_FOUND.
 */
export async function lockEvent(tx: DbTransaction, eventId: string): Promise<void> {
  const locked = await tx.$queryRaw<
    unknown[]
  >`SELECT 1 FROM events WHERE id = ${eventId} FOR UPDATE`;
  if (locked.length === 0) throw new ORPCError("NOT_FOUND");
}
