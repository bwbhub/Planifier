// JSX automatique déclaré ici : l'API charge ce package par tsx, qui n'applique pas son tsconfig hors de l'app.
/** @jsxRuntime automatic @jsxImportSource react */
import { EMAIL_COLORS } from "@planifier/tokens/email";
import { Body } from "@react-email/body";
import { Button } from "@react-email/button";
import { Container } from "@react-email/container";
import { Head } from "@react-email/head";
import { Heading } from "@react-email/heading";
import { Hr } from "@react-email/hr";
import { Html } from "@react-email/html";
import { Preview } from "@react-email/preview";
import { Text } from "@react-email/text";
import type { ReactNode } from "react";

/** Contenu commun des e-mails à une seule action : un titre, un texte, un bouton, une note de bas de page. */
export interface ActionMailProps {
  /** Aperçu affiché par la boîte de réception à côté du sujet. */
  preview: string;
  title: string;
  children: ReactNode;
  action: { label: string; url: string };
  footer: string;
}

const FONT = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Mise en page des e-mails (styles en ligne, couleurs du thème clair : les clients mail ignorent le reste). */
export function ActionMail({ preview, title, children, action, footer }: ActionMailProps) {
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
            borderRadius: 16,
            maxWidth: 480,
            padding: "32px 28px",
          }}
        >
          <Text style={{ color: EMAIL_COLORS.accent, fontSize: 18, fontWeight: 700, margin: 0 }}>
            Planifier
          </Text>
          <Heading as="h1" style={{ color: EMAIL_COLORS.ink, fontSize: 24, margin: "16px 0 8px" }}>
            {title}
          </Heading>
          <Text style={{ color: EMAIL_COLORS.ink, fontSize: 16, lineHeight: "24px" }}>
            {children}
          </Text>
          <Button
            href={action.url}
            style={{
              backgroundColor: EMAIL_COLORS.accent,
              borderRadius: 999,
              color: EMAIL_COLORS.onAccent,
              fontSize: 16,
              fontWeight: 700,
              padding: "14px 24px",
            }}
          >
            {action.label}
          </Button>
          <Hr style={{ borderColor: EMAIL_COLORS.line, margin: "28px 0 16px" }} />
          <Text style={{ color: EMAIL_COLORS.muted, fontSize: 13, lineHeight: "20px", margin: 0 }}>
            {footer}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
