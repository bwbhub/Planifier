import { randomUUID } from "node:crypto";

import { type Cookie, expect, type Page, test } from "@playwright/test";

const DISPLAY_NAME = "Eve";
const GREETING = `Bonjour ${DISPLAY_NAME}`;
/** `--bg` de nuit dans packages/tokens/src/tokens.css (#101216), tel que le navigateur le calcule. */
const DARK_BACKGROUND = "rgb(16, 18, 22)";
/** `--bg` clair (#f8f6f9). */
const LIGHT_BACKGROUND = "rgb(248, 246, 249)";

/** Compte neuf par lancement : la base `_test` est partagée avec les tests d'intégration, qui la vident. */
function newAccount() {
  return { email: `e2e-${randomUUID()}@example.test`, password: randomUUID() };
}

async function fillCredentials(page: Page, email: string, password: string) {
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(password);
}

function horizontalOverflow(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}

function bodyBackground(page: Page) {
  return page.evaluate(() => getComputedStyle(document.body).backgroundColor);
}

/**
 * Parcours d'un même compte, dans l'ordre : une inscription et une connexion par format, la session passant d'un test
 * à l'autre par ses cookies. La limitation de débit de Better Auth (quelques essais par IP et par route sur 10 s)
 * refuserait un compte par test, tout venant de localhost.
 */
test.describe.serial("parcours d'un compte", () => {
  const { email, password } = newAccount();
  let session: Cookie[] = [];

  const greeting = (page: Page) => page.getByRole("heading", { name: GREETING });

  async function openHomeSignedIn(page: Page) {
    await page.context().addCookies(session);
    await page.goto("/");
    await expect(greeting(page)).toBeVisible();
  }

  test("ouvre l'accueil quand l'inscription réussit", async ({ page }) => {
    await page.goto("/inscription");
    await page.getByLabel("Ton nom", { exact: true }).fill(DISPLAY_NAME);
    await fillCredentials(page, email, password);
    await page.getByRole("button", { name: "Créer mon compte" }).click();
    await expect(greeting(page)).toBeVisible();
    session = await page.context().cookies();
  });

  test("ne déborde pas en largeur quand on ouvre l'accueil", async ({ page }) => {
    await openHomeSignedIn(page);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });

  test("revient à la connexion quand on se déconnecte", async ({ page }) => {
    await openHomeSignedIn(page);
    await page.getByRole("button", { name: "Se déconnecter" }).click();
    await expect(page).toHaveURL("/connexion");
  });

  test("ouvre l'accueil quand la connexion réussit", async ({ page }) => {
    await page.goto("/connexion");
    await fillCredentials(page, email, password);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(greeting(page)).toBeVisible();
  });
});

test("renvoie à la connexion quand on ouvre l'accueil sans session", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL("/connexion");
});

for (const path of ["/connexion", "/inscription"]) {
  test(`ne déborde pas en largeur quand on ouvre ${path}`, async ({ page }) => {
    await page.goto(path);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });
}

test("applique le thème clair quand le système est en clair", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/connexion");
  expect(await bodyBackground(page)).toBe(LIGHT_BACKGROUND);
});

test("applique le thème nuit quand le système est en nuit", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/connexion");
  expect(await bodyBackground(page)).toBe(DARK_BACKGROUND);
});
