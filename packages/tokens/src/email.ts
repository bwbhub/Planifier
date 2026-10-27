// Tokens pour les e-mails, dont les clients ignorent les variables CSS. Copies des valeurs des fichiers CSS,
// vérifiées par `email.test.ts` : changer un token, c'est changer les deux.

/** Couleurs du thème clair (`tokens.css`, `:root`). */
export const EMAIL_COLORS = {
  bg: "#f8f6f9",
  surface: "#ffffff",
  ink: "#1c1226",
  muted: "#645a70",
  line: "#ece7ef",
  accent: "#d11f72",
  onAccent: "#ffffff",
} as const;

/** Rayons (`theme.css`, `--radius-*`). */
export const EMAIL_RADII = {
  card: "20px",
  pill: "999px",
} as const;
