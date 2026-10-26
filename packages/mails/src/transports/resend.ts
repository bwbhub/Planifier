import type { SendMail } from "../mail";
import { SENDER_NAME } from "../sender";
import { type Fetch, postJson } from "./post-json";

const RESEND_EMAILS_URL = "https://api.resend.com/emails";

/** Envoi par l'API HTTP de Resend (ADR 0010). */
export function createResendTransport(
  apiKey: string,
  from: string,
  fetchFn: Fetch = fetch,
): SendMail {
  return (mail) =>
    postJson(
      fetchFn,
      RESEND_EMAILS_URL,
      {
        from: `${SENDER_NAME} <${from}>`,
        to: [mail.to],
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      },
      { authorization: `Bearer ${apiKey}` },
    );
}
