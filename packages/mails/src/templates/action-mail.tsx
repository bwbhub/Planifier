// JSX automatique déclaré ici : l'API charge ce package par tsx, qui n'applique pas son tsconfig hors de l'app.
/** @jsxRuntime automatic @jsxImportSource react */
import { EMAIL_COLORS, EMAIL_RADII } from "@planifier/tokens/email";
import { Body } from "@react-email/body";
import { Button } from "@react-email/button";
import { Container } from "@react-email/container";
import { Head } from "@react-email/head";
import { Heading } from "@react-email/heading";
import { Hr } from "@react-email/hr";
import { Html } from "@react-email/html";
import { Preview } from "@react-email/preview";
import { Text } from "@react-email/text";
import { renderToStaticMarkup } from "react-dom/server";

import type { MailContent } from "../mail";
import { SENDER_NAME } from "../sender";

/** E-mail à une seule action : un titre (le sujet), quelques paragraphes, un bouton, une note de bas de page. */
export interface ActionMailContent {
  subject: string;
  /** Aperçu affiché par la boîte de réception à côté du sujet. */
  preview: string;
  paragraphs: readonly string[];
  action: { label: string; url: string };
  footer: string;
}

const DOCTYPE =
  '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">';
const FONT = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
/** Largeur de lecture : au-delà, la plupart des clients mail élargissent mal. */
const MAX_WIDTH = 480;
/** Tailles de texte (px) : marque, titre, corps, bas de page. */
const SIZE = { brand: 18, title: 24, body: 16, footer: 13 } as const;

function ActionMail({ subject, preview, paragraphs, action, footer }: ActionMailContent) {
  const body = { color: EMAIL_COLORS.ink, fontSize: SIZE.body, lineHeight: 1.5 };
  return (
    <Html lang="fr">
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{ backgroundColor: EMAIL_COLORS.bg, fontFamily: FONT, margin: 0, padding: "24px 0" }}
      >
        <Container
          style={{
            backgroundColor: EMAIL_COLORS.surface,
            borderRadius: EMAIL_RADII.card,
            maxWidth: MAX_WIDTH,
            padding: "32px 28px",
          }}
        >
          <Text
            style={{ color: EMAIL_COLORS.accent, fontSize: SIZE.brand, fontWeight: 700, margin: 0 }}
          >
            {SENDER_NAME}
          </Text>
          <Heading
            as="h1"
            style={{ color: EMAIL_COLORS.ink, fontSize: SIZE.title, margin: "16px 0 8px" }}
          >
            {subject}
          </Heading>
          {paragraphs.map((paragraph) => (
            <Text key={paragraph} style={body}>
              {paragraph}
            </Text>
          ))}
          <Button
            href={action.url}
            style={{
              backgroundColor: EMAIL_COLORS.accent,
              borderRadius: EMAIL_RADII.pill,
              color: EMAIL_COLORS.onAccent,
              fontSize: SIZE.body,
              fontWeight: 700,
              padding: "14px 24px",
            }}
          >
            {action.label}
          </Button>
          <Hr style={{ borderColor: EMAIL_COLORS.line, margin: "28px 0 16px" }} />
          <Text
            style={{ color: EMAIL_COLORS.muted, fontSize: SIZE.footer, lineHeight: 1.5, margin: 0 }}
          >
            {footer}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

/**
 * Rend un e-mail à une action : HTML par le rendu statique de React (sans `@react-email/render`, docs/DEPENDANCES.md)
 * et version texte tirée du même contenu.
 */
export function actionMail(content: ActionMailContent): MailContent {
  const text = [...content.paragraphs, content.action.url, content.footer].join("\n\n");
  return {
    subject: content.subject,
    html: DOCTYPE + renderToStaticMarkup(<ActionMail {...content} />),
    text: `${text}\n`,
  };
}
