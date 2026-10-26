/**
 * Couleurs du thème clair pour les e-mails, dont les clients ignorent les variables CSS. Copie des valeurs de
 * `tokens.css` (`:root`), vérifiée par `email.test.ts` : changer un token, c'est changer les deux.
 */
export const EMAIL_COLORS = {
  bg: "#f8f6f9",
  surface: "#ffffff",
  ink: "#1c1226",
  muted: "#645a70",
  line: "#ece7ef",
  accent: "#d11f72",
  onAccent: "#ffffff",
} as const;
