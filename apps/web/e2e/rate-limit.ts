import { expect, type Page } from "@playwright/test";

/** Délai laissé à chaque essai pour voir le résultat attendu, avant de considérer l'envoi comme refusé. */
export const ATTEMPT_TIMEOUT = 2_000;

/**
 * Clique sur le bouton `button` jusqu'à ce que `done` réussisse. Better Auth limite inscriptions et connexions à 3
 * par 10 s et par IP, et tous les parcours viennent de localhost : un refus passager se rejoue après la fenêtre au
 * lieu de faire échouer le parcours suivant. `done` attend au plus `ATTEMPT_TIMEOUT`.
 */
export async function submitPastRateLimit(page: Page, button: string, done: () => Promise<void>) {
  await expect(async () => {
    await page.getByRole("button", { name: button }).click();
    await done();
  }).toPass({ timeout: 25_000, intervals: [2_000, 5_000] });
}
