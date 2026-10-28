import { randomUUID } from "node:crypto";

import { type Cookie, expect, type Page, test } from "@playwright/test";

import { waitForLink } from "./mailpit";

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

/** Depuis l'accueil connecté : première liste « Courses », une tâche, cochée puis relue après rechargement. */
async function createListAndCheckTask(page: Page) {
  await page.getByRole("link", { name: "Ouvrir mes listes" }).click();
  await page.getByRole("button", { name: "Créer ma première liste" }).click();
  await page.getByLabel("Nom de la liste").fill("Courses");
  await page.getByRole("button", { name: "Créer la liste" }).click();
  await expect(page.getByRole("heading", { name: "Courses" })).toBeVisible();

  await page.getByLabel("Nouvelle tâche").fill("Acheter du pain");
  await page.getByRole("button", { name: "Ajouter" }).click();
  const task = page.getByRole("checkbox", { name: "Acheter du pain" });
  await expect(task).not.toBeChecked();
  // `click` et non `check` : cochée, la tâche passe dans « Cochées », sa case est un autre élément.
  await task.click();
  await expect(page.getByRole("heading", { name: "Cochées (1)" })).toBeVisible();
  await expect(task).toBeChecked();
  // Cochée côté serveur : toujours cochée après un rechargement.
  await page.reload();
  await expect(page.getByRole("checkbox", { name: "Acheter du pain" })).toBeChecked();
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
}

/** Sur le Todo : ajoute une sous-tâche, modifie puis supprime la tâche, renomme puis supprime la liste. */
async function editThenDeleteTaskAndList(page: Page) {
  // Tâche décochée d'abord : cocher sa sous-tâche ne doit pas la cocher (rien ne se coche en cascade).
  const parent = page.getByRole("checkbox", { name: "Acheter du pain", exact: true });
  await parent.click();
  await expect(parent).not.toBeChecked();

  await page.getByRole("button", { name: "+ Sous-tâche à « Acheter du pain »" }).click();
  const subtaskInput = page.getByLabel("Nouvelle sous-tâche");
  await subtaskInput.fill("Baguette");
  await page
    .locator("form", { has: subtaskInput })
    .getByRole("button", { name: "Ajouter" })
    .click();
  await page.getByRole("checkbox", { name: "Baguette" }).click();
  await expect(page.getByText("1 sur 1 sous-tâche cochée")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("checkbox", { name: "Baguette" })).toBeChecked();
  await expect(parent).not.toBeChecked();

  await page.getByRole("button", { name: "Modifier « Acheter du pain »" }).click();
  await page.getByLabel("Titre").fill("Acheter du pain complet");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByRole("checkbox", { name: "Acheter du pain complet" })).toBeVisible();

  await page.getByRole("button", { name: "Supprimer « Acheter du pain complet »" }).click();
  await expect(
    page.getByRole("group", { name: "Supprimer « Acheter du pain complet » et sa sous-tâche ?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Supprimer définitivement" }).click();
  await expect(page.getByText("Aucune tâche dans cette liste.")).toBeVisible();

  await page.getByRole("button", { name: "Modifier la liste" }).click();
  await page.getByLabel("Nom de la liste").fill("Marché");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByRole("heading", { name: "Marché" })).toBeVisible();

  await page.getByRole("button", { name: "Supprimer la liste" }).click();
  await page.getByRole("button", { name: "Supprimer définitivement" }).click();
  await expect(page.getByRole("button", { name: "Créer ma première liste" })).toBeVisible();
}

/**
 * Parcours d'un même compte, dans l'ordre, la session et les e-mails passant d'un test à l'autre. La limitation de
 * débit de Better Auth (par IP et par route : 3 connexions sur 10 s, 3 demandes de lien sur 60 s) refuserait un
 * compte par test, tout venant de localhost : une inscription et une connexion par format.
 */
test.describe.serial("parcours d'un compte", () => {
  const { email, password } = newAccount();
  const newPassword = randomUUID();
  let session: Cookie[] = [];

  const greeting = (page: Page) => page.getByRole("heading", { name: GREETING });

  async function openHomeSignedIn(page: Page) {
    await page.context().addCookies(session);
    await page.goto("/");
    await expect(greeting(page)).toBeVisible();
  }

  test("annonce l'e-mail de confirmation quand l'inscription réussit", async ({ page }) => {
    await page.goto("/inscription");
    await page.getByLabel("Ton nom", { exact: true }).fill(DISPLAY_NAME);
    await fillCredentials(page, email, password);
    await page.getByRole("button", { name: "Créer mon compte" }).click();
    await expect(page.getByRole("status")).toContainText(`Un e-mail vient de partir à ${email}`);
  });

  test("ouvre l'accueil quand on suit le lien de confirmation", async ({ page, request }) => {
    await page.goto(await waitForLink(request, email, 1));
    await expect(greeting(page)).toBeVisible();
    session = await page.context().cookies();
  });

  test("ne déborde pas en largeur quand on ouvre l'accueil", async ({ page }) => {
    await openHomeSignedIn(page);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });

  test("crée une liste, ajoute une tâche et la coche quand on ouvre le Todo", async ({ page }) => {
    await openHomeSignedIn(page);
    await createListAndCheckTask(page);
  });

  test("ajoute une sous-tâche, modifie puis supprime la tâche et la liste quand on le demande", async ({
    page,
  }) => {
    await page.context().addCookies(session);
    await page.goto("/todo");
    await editThenDeleteTaskAndList(page);
  });

  test("revient à la connexion quand on se déconnecte", async ({ page }) => {
    await openHomeSignedIn(page);
    await page.getByRole("button", { name: "Se déconnecter" }).click();
    await expect(page).toHaveURL("/connexion");
  });

  test("envoie un lien quand on a oublié son mot de passe", async ({ page }) => {
    await page.goto("/connexion");
    await page.getByRole("link", { name: "Mot de passe oublié ?" }).click();
    await expect(page.getByRole("heading", { name: "Mot de passe oublié" })).toBeVisible();
    await page.getByLabel("E-mail", { exact: true }).fill(email);
    await page.getByRole("button", { name: "Recevoir un lien" }).click();
    await expect(page.getByRole("status")).toContainText(`Si un compte existe avec ${email}`);
  });

  test("enregistre le nouveau mot de passe quand on suit le lien", async ({ page, request }) => {
    await page.goto(await waitForLink(request, email, 2));
    await page.getByLabel("Nouveau mot de passe", { exact: true }).fill(newPassword);
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByRole("status")).toContainText("Ton mot de passe est changé");
  });

  test("ouvre l'accueil quand la connexion réussit avec le nouveau mot de passe", async ({
    page,
  }) => {
    await page.goto("/connexion");
    await fillCredentials(page, email, newPassword);
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
