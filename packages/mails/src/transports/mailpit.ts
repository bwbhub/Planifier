import type { SendMail } from "../mail";
import { SENDER_NAME } from "../sender";
import { type Fetch, postJson } from "./post-json";

/** Dépôt dans Mailpit par son API HTTP (`/api/v1/send`) : boîte locale, consultable sur son interface web. */
export function createMailpitTransport(
  baseUrl: string,
  from: string,
  fetchFn: Fetch = fetch,
): SendMail {
  const url = new URL("/api/v1/send", baseUrl).toString();
  return (mail) =>
    postJson(fetchFn, url, {
      From: { Email: from, Name: SENDER_NAME },
      To: [{ Email: mail.to }],
      Subject: mail.subject,
      HTML: mail.html,
      Text: mail.text,
    });
}
