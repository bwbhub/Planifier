import { notFound } from "next/navigation";
import { z } from "zod";

/** Identifiant d'Espace lu dans l'adresse ; autre chose qu'un UUID : page introuvable, sans appeler l'API. */
export async function spaceIdOf(params: Promise<{ spaceId: string }>): Promise<string> {
  const parsed = z.uuid().safeParse((await params).spaceId);
  if (!parsed.success) notFound();
  return parsed.data;
}
