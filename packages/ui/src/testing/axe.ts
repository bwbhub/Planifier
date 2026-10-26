import axe from "axe-core";

// Aide de test (jamais livrée) : axe-core est une dépendance de développement des packages qui l'importent.
// jsdom ne calcule pas les couleurs : le contraste est garanti par les tokens, pas vérifié ici.
const AXE_OPTIONS = { rules: { "color-contrast": { enabled: false } } };

/** Violations d'accessibilité détectées par axe-core dans un rendu de test. */
export async function axeViolations(container: Element) {
  const { violations } = await axe.run(container, AXE_OPTIONS);
  return violations;
}
