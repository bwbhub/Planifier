// JSX automatique déclaré ici : l'API charge ce package par tsx, qui n'applique pas son tsconfig hors de l'app.
/** @jsxRuntime automatic @jsxImportSource react */
import { EMAIL_LINK_TTL_SECONDS } from "@planifier/constants/account";

import type { MailContent } from "../mail";
import { renderMail } from "../render";
import { ActionMail } from "./layout";

const SUBJECT = "Choisis un nouveau mot de passe";
const VALIDITY = `Le lien est valable ${String(EMAIL_LINK_TTL_SECONDS / 60)} minutes.`;
const FOOTER = "Tu n'as rien demandé ? Ignore cet e-mail : ton mot de passe ne change pas.";

/** E-mail de mot de passe oublié : le lien mène au formulaire du nouveau mot de passe. */
export function resetPasswordMail({ name, url }: { name: string; url: string }): MailContent {
  const intro = `Bonjour ${name}, tu as demandé à changer ton mot de passe. ${VALIDITY}`;
  return renderMail(
    SUBJECT,
    <ActionMail
      preview="Le lien pour choisir un nouveau mot de passe."
      title={SUBJECT}
      action={{ label: "Choisir un mot de passe", url }}
      footer={FOOTER}
    >
      {intro}
    </ActionMail>,
    `${intro}\n\n${url}\n\n${FOOTER}\n`,
  );
}
