import { ORPCError } from "@orpc/client";
import type { z } from "zod";

import { COMMON_LABELS } from "@/lib/labels";

const TOO_MANY_REQUESTS = "Trop d'actions d'affilée. Patiente quelques secondes, puis réessaie.";
const FALLBACK = `Quelque chose n'a pas fonctionné. ${COMMON_LABELS.nothingLost} Réessaie dans un instant.`;

/** Raison d'un `CONFLICT` de module, ou `null` pour toute autre erreur. */
export function conflictReason<TReason extends string>(
  error: unknown,
  conflictData: z.ZodType<{ reason: TReason }>,
): TReason | null {
  if (!(error instanceof ORPCError) || error.code !== "CONFLICT") return null;
  const parsed = conflictData.safeParse(error.data);
  return parsed.success ? parsed.data.reason : null;
}

/** Ce qui change d'un module à l'autre dans le message d'un refus. */
export interface ActionErrorMessages<TReason extends string> {
  conflictData: z.ZodType<{ reason: TReason }>;
  conflicts: Record<TReason, string>;
  notFound: string;
  forbidden: string;
}

/** Message à montrer après le refus d'une action : rassurant, avec quoi faire ensuite. */
export function actionErrorMessage<TReason extends string>(
  error: unknown,
  { conflictData, conflicts, notFound, forbidden }: ActionErrorMessages<TReason>,
): string {
  const reason = conflictReason(error, conflictData);
  if (reason !== null) return conflicts[reason];
  if (error instanceof ORPCError) {
    if (error.code === "NOT_FOUND") return notFound;
    if (error.code === "FORBIDDEN") return forbidden;
    if (error.code === "TOO_MANY_REQUESTS") return TOO_MANY_REQUESTS;
  }
  return FALLBACK;
}
