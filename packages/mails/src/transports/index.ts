import type { MailEnv } from "../env";
import type { SendMail } from "../mail";
import { createMailpitTransport } from "./mailpit";
import { createResendTransport } from "./resend";

/** Transport choisi par l'environnement (`MAIL_TRANSPORT`). */
export function createSendMail(env: MailEnv): SendMail {
  return env.MAIL_TRANSPORT === "resend"
    ? createResendTransport(env.RESEND_API_KEY, env.MAIL_FROM)
    : createMailpitTransport(env.MAILPIT_URL, env.MAIL_FROM);
}
