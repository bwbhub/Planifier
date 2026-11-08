import { ORPCError } from "@orpc/server";
import type { ImportFailureReason } from "@planifier/api-contract";

import { FeedFetchError } from "./feed-errors";

/** `BAD_REQUEST` typé du contrat (`IMPORT_ERRORS`). Ne contient jamais le lien. */
export function importFailure(reason: ImportFailureReason) {
  return new ORPCError("BAD_REQUEST", { data: { reason } });
}

/** Raison d'échec d'une lecture : celle du lecteur de flux, sinon « agenda illisible ». Jamais la cause brute. */
export function failureReasonOf(error: unknown): ImportFailureReason {
  return error instanceof FeedFetchError ? error.code : "FEED_UNREADABLE";
}
