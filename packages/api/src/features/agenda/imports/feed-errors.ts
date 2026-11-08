/** Raisons d'échec de la lecture d'un flux ; le message ne contient jamais le lien (c'est un secret). */
export type FeedFetchErrorCode = "LINK_INVALID" | "FEED_UNREACHABLE" | "FEED_TOO_LARGE";

export class FeedFetchError extends Error {
  readonly code: FeedFetchErrorCode;

  constructor(code: FeedFetchErrorCode) {
    super(code);
    this.name = "FeedFetchError";
    this.code = code;
  }
}
