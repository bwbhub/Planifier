import { randomUUID } from "node:crypto";

import { expect, type Page, test } from "@playwright/test";

const NAME = "Eve";

/** Compte neuf par test : la base `_test` est partagée avec les tests d'intégration, qui la vident. */
function newAccount() {
  return { email: `e2e-${randomUUID()}@example.test`, password: randomUUID() };
}

async function fillCredentials(page: Page, email: string, password: string) {
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(password);
}

test("inscription, accueil, déconnexion puis connexion", async ({ page }) => {
  const { email, password } = newAccount();
  const greeting = page.getByRole("heading", { name: `Bonjour ${NAME}` });

  await page.goto("/inscription");
  await page.getByLabel("Ton nom", { exact: true }).fill(NAME);
  await fillCredentials(page, email, password);
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(greeting).toBeVisible();

  // Rien ne déborde en largeur, en PC comme en mobile.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);

  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL("/connexion");

  await fillCredentials(page, email, password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(greeting).toBeVisible();
});

test("sans session, l'accueil renvoie à la connexion", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL("/connexion");
});

test("le thème suit le système, clair puis nuit", async ({ page }) => {
  const background = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);

  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/connexion");
  const light = await background();

  await page.emulateMedia({ colorScheme: "dark" });
  expect(await background()).not.toBe(light);
});
