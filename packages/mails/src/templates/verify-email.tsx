// JSX automatique déclaré ici : l'API charge ce package par tsx, qui n'applique pas son tsconfig hors de l'app.
/** @jsxRuntime automatic @jsxImportSource react */
import { EMAIL_LINK_TTL_SECONDS } from "@planifier/constants/account";

import type { MailContent } from "../mail";
import { renderMail } from "../render";
import { ActionMail } from "./layout";

const SUBJECT = "Confirme ton adresse e-mail";
const VALIDITY = `Le lien est valable ${String(EMAIL_LINK_TTL_SECONDS / 60)} minutes.`;
const FOOTER = "Tu n'as pas créé de compte Planifier ? Ignore cet e-mail : rien ne sera fait.";

/** E-mail de vérification d'adresse : le lien confirme l'adresse et ouvre la session. */
export function verifyEmailMail({ name, url }: { name: string; url: string }): MailContent {
  const intro = `Bonjour ${name}, confirme ton adresse pour ouvrir ton espace Planifier. ${VALIDITY}`;
  return renderMail(
    SUBJECT,
    <ActionMail
      preview="Un clic pour confirmer ton adresse."
      title={SUBJECT}
      action={{ label: "Confirmer mon adresse", url }}
      footer={FOOTER}
    >
      {intro}
    </ActionMail>,
    `${intro}\n\n${url}\n\n${FOOTER}\n`,
  );
}
