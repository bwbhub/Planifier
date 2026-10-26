import { getMailEnv } from "./env";
import type { SendMail } from "./mail";
import { createSendMail } from "./transports";

export { parseMailEnv, type MailEnv } from "./env";
export type { Mail, MailContent, SendMail } from "./mail";
export { resetPasswordMail } from "./templates/reset-password";
export { verifyEmailMail } from "./templates/verify-email";
export { createSendMail };

let cached: SendMail | undefined;

/** Transport du processus, créé au premier appel (environnement validé à ce moment). */
export function getSendMail(): SendMail {
  cached ??= createSendMail(getMailEnv());
  return cached;
}
