import type { MailEnv } from "../env";
import type { SendMail } from "../mail";
import { restrictToDomains } from "./allowed-domains";
import { createMailpitTransport } from "./mailpit";
import { createResendTransport } from "./resend";

/** Transport choisi par l'environnement (`MAIL_TRANSPORT`), limité au bac à sable s'il est défini. */
export function createSendMail(env: MailEnv): SendMail {
  const send =
    env.MAIL_TRANSPORT === "resend"
      ? createResendTransport(env.RESEND_API_KEY, env.MAIL_FROM)
      : createMailpitTransport(env.MAILPIT_URL, env.MAIL_FROM);
  return env.MAIL_ALLOWED_DOMAINS === undefined
    ? send
    : restrictToDomains(send, env.MAIL_ALLOWED_DOMAINS);
}
