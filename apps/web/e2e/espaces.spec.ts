import { randomUUID } from "node:crypto";

import { type Browser, type Cookie, expect, type Page, test } from "@playwright/test";

import { waitForLink } from "./mailpit";
import { ATTEMPT_TIMEOUT, submitPastRateLimit } from "./rate-limit";

const SPACE_NAME = "Vacances Ardèche";

interface Account {
  name: string;
  email: string;
  password: string;
  session: Cookie[];
}

/** Compte neuf par lancement : la base `_test` est partagée avec les tests d'intégration, qui la vident. */
function newAccount(name: string): Account {
  return { name, email: `e2e-${randomUUID()}@example.test`, password: randomUUID(), session: [] };
}

async function fillCredentials(page: Page, account: Account) {
  await page.getByLabel("E-mail", { exact: true }).fill(account.email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(account.password);
}

/** Inscription, puis lien de confirmation : la session ouverte par le lien est gardée pour la suite. */
async function register(
  browser: Browser,
  request: Parameters<typeof waitForLink>[0],
  account: Account,
) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/inscription");
  await page.getByLabel("Ton nom", { exact: true }).fill(account.name);
  await fillCredentials(page, account);
  await submitPastRateLimit(page, "Créer mon compte", async () => {
    await expect(page.getByRole("status")).toContainText("Un e-mail vient de partir", {
      timeout: ATTEMPT_TIMEOUT,
    });
  });
  await page.goto(await waitForLink(request, account.email, 1));
  await expect(page.getByRole("heading", { name: `Bonjour ${account.name}` })).toBeVisible();
  account.session = await context.cookies();
  await context.close();
}

async function signedIn(page: Page, account: Account) {
  await page.context().addCookies(account.session);
}

function horizontalOverflow(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}

/**
 * Parcours d'un Espace à deux, dans l'ordre : une personne le crée et partage un lien, l'autre le rejoint en se
 * connectant depuis ce lien (le jeton, dans le fragment, doit survivre à la redirection), puis l'Espace est supprimé.
 */
test.describe.serial("parcours d'un Espace", () => {
  const owner = newAccount("Camille");
  const guest = newAccount("Léo");
  let spaceUrl = "";
  let inviteLink = "";

  test("ouvre un compte pour chaque personne", async ({ browser, request }) => {
    await register(browser, request, owner);
    await register(browser, request, guest);
  });

  test("crée un Espace quand on part de la liste vide", async ({ page }) => {
    await signedIn(page, owner);
    await page.goto("/");
    await page.getByRole("link", { name: "Espaces" }).click();
    await expect(page.getByRole("heading", { name: "Partager, si tu veux" })).toBeVisible();

    await page.getByRole("link", { name: "Créer un Espace" }).click();
    await page.getByLabel("Nom", { exact: true }).fill(SPACE_NAME);
    await page.getByRole("button", { name: "Créer l'Espace" }).click();

    await expect(page.getByRole("heading", { name: SPACE_NAME, level: 1 })).toBeVisible();
    await expect(page.getByText(`${owner.name} (toi)`)).toBeVisible();
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    spaceUrl = page.url();
  });

  test("donne un lien d'invitation à partager, montré une seule fois", async ({ page }) => {
    await signedIn(page, owner);
    await page.goto(spaceUrl);
    await page.getByRole("button", { name: "Créer un lien" }).click();

    const sheet = page.getByRole("dialog", { name: "Ton lien est prêt" });
    await expect(sheet).toBeVisible();
    inviteLink = await sheet.getByLabel("Lien d'invitation").inputValue();
    expect(new URL(inviteLink).pathname).toBe("/rejoindre");
    expect(new URL(inviteLink).hash).toMatch(/^#[\w-]{43}$/);

    await sheet.getByRole("button", { name: "C'est bon" }).click();
    await expect(sheet).toBeHidden();
    await expect(page.getByText(/^Lien créé le/)).toBeVisible();
  });

  test("rejoint l'Espace en se connectant depuis le lien", async ({ page }) => {
    await page.goto(inviteLink);
    await expect(page).toHaveURL(/\/connexion\?retour=%2Frejoindre#/);
    await expect(page.getByText("Connecte-toi pour rejoindre l'Espace.")).toBeVisible();

    await fillCredentials(page, guest);
    await submitPastRateLimit(page, "Se connecter", async () => {
      await expect(page.getByRole("heading", { name: SPACE_NAME })).toBeVisible({
        timeout: ATTEMPT_TIMEOUT,
      });
    });
    await page.getByRole("button", { name: "Rejoindre l'Espace" }).click();

    await expect(page).toHaveURL(spaceUrl);
    await expect(page.getByText(`${guest.name} (toi)`)).toBeVisible();
    await expect(page.getByText(owner.name, { exact: true })).toBeVisible();
  });

  test("refuse le lien une fois utilisé", async ({ page }) => {
    await signedIn(page, owner);
    await page.goto(inviteLink);
    await expect(page.getByRole("heading", { name: "Ce lien ne marche plus" })).toBeVisible();
  });

  test("supprime l'Espace pour tous après confirmation", async ({ page }) => {
    await signedIn(page, owner);
    await page.goto(spaceUrl);
    await expect(page.getByText(guest.name, { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Supprimer", exact: true }).click();

    const sheet = page.getByRole("alertdialog", { name: `Supprimer « ${SPACE_NAME} » ?` });
    await expect(sheet).toBeVisible();
    await sheet.getByRole("button", { name: "Supprimer définitivement" }).click();

    await expect(page).toHaveURL("/espaces");
    await expect(page.getByRole("heading", { name: "Partager, si tu veux" })).toBeVisible();
  });
});
