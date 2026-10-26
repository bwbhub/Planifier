import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { MailContent } from "./mail";

const DOCTYPE =
  '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">';

/**
 * HTML d'un gabarit (rendu statique de React, sans `@react-email/render` : docs/DEPENDANCES.md) ; la version texte
 * est écrite par chaque gabarit.
 */
export function renderMail(subject: string, element: ReactElement, text: string): MailContent {
  return { subject, html: DOCTYPE + renderToStaticMarkup(element), text };
}
