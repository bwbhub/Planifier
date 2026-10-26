import { EMAIL_LINK_VALIDITY } from "@planifier/constants/account";
import type { ReactNode } from "react";

/** Confirmation qu'un lien est parti par e-mail (inscription, mot de passe oublié), annoncée sans voler le focus. */
export function MailSentNotice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div role="status" className="flex flex-col gap-2">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      <p>{children}</p>
      <p className="text-sm text-muted">
        Le lien est valable {EMAIL_LINK_VALIDITY}. Rien reçu ? Regarde dans les indésirables.
      </p>
    </div>
  );
}
