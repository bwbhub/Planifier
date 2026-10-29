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
 * connectant depuis ce lien (le jeton, dans le fragment, doit survivre à la redirection) ; puis réglages, rôles,
 * révocation, retrait, et départs jusqu'à la suppression.
 */
test.describe.configure({ mode: "serial" });

const owner = newAccount("Camille");
const guest = newAccount("Léo");
let spaceUrl = "";
let inviteLink = "";

test.describe("rejoindre un Espace", () => {
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
});

test.describe("partager une liste avec l'Espace", () => {
  test("crée une liste partagée que l'autre membre voit et coche", async ({ page, browser }) => {
    await signedIn(page, owner);
    await page.goto("/todo");
    await page.getByRole("button", { name: "Créer ma première liste" }).click();
    await page.getByLabel("Nom de la liste").fill("Courses communes");
    // Le bouton radio est masqué visuellement : on clique sur sa pastille, comme on le ferait à la main.
    await page.getByText(SPACE_NAME, { exact: true }).click();
    await expect(page.getByRole("radio", { name: SPACE_NAME })).toBeChecked();
    await page.getByRole("button", { name: "Créer la liste" }).click();
    await expect(page.getByText(`Liste partagée · ${SPACE_NAME}`)).toBeVisible();
    await page.getByLabel("Nouvelle tâche").fill("Pain");
    await page.getByRole("button", { name: "Ajouter", exact: true }).click();
    await expect(page.getByRole("checkbox", { name: "Pain" })).toBeVisible();

    const guestPage = await browser.newPage();
    await signedIn(guestPage, guest);
    await guestPage.goto("/todo");
    await expect(guestPage.getByText(`Liste partagée · ${SPACE_NAME}`)).toBeVisible();
    // `click` et non `check` : cochée, la tâche passe dans « Cochées », sa case est un autre élément.
    await guestPage.getByRole("checkbox", { name: "Pain" }).click();
    await expect(guestPage.getByText(`Cochée par ${guest.name}`)).toBeVisible();
    await guestPage.close();

    await page.reload();
    await expect(page.getByText(`Cochée par ${guest.name}`)).toBeVisible();
    await page.getByRole("button", { name: "Supprimer la liste" }).click();
    await page.getByRole("button", { name: "Supprimer définitivement" }).click();
    await expect(page.getByRole("button", { name: "Créer ma première liste" })).toBeVisible();
  });
});

test.describe("gérer un Espace", () => {
  test("change les modules de l'Espace dans ses réglages", async ({ page }) => {
    await signedIn(page, owner);
    await page.goto(spaceUrl);
    await page.getByRole("link", { name: "Modifier les réglages" }).click();
    await page.getByRole("checkbox", { name: /Événements/ }).check();
    await page.getByRole("button", { name: "Enregistrer" }).click();

    await expect(page).toHaveURL(spaceUrl);
    await expect(page.getByText("Todo, Agenda, Événements")).toBeVisible();
  });

  test("retire puis rend le rôle de propriétaire", async ({ page }) => {
    await signedIn(page, owner);
    await page.goto(spaceUrl);
    const manage = page.getByRole("button", { name: `Gérer ${guest.name}` });

    await manage.click();
    await page.getByRole("button", { name: "Retirer le rôle de propriétaire" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(manage).toBeFocused();

    await manage.click();
    await expect(page.getByRole("button", { name: "Nommer propriétaire" })).toBeVisible();
    await page.getByRole("button", { name: "Annuler" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("retient le dernier propriétaire qui voudrait partir", async ({ page }) => {
    await signedIn(page, owner);
    await page.goto(spaceUrl);
    await page.getByRole("button", { name: "Quitter", exact: true }).click();

    const sheet = page.getByRole("alertdialog", { name: "Avant de partir" });
    await expect(sheet).toBeVisible();
    await sheet.getByRole("button", { name: "Rester dans l'Espace" }).click();
    await expect(sheet).toBeHidden();
  });

  test("révoque un lien après confirmation", async ({ page }) => {
    await signedIn(page, owner);
    await page.goto(spaceUrl);
    await page.getByRole("button", { name: "Créer un lien" }).click();
    await page.getByRole("button", { name: "C'est bon" }).click();

    await page.getByRole("button", { name: /^Révoquer le lien créé/ }).click();
    const sheet = page.getByRole("alertdialog", { name: "Révoquer ce lien ?" });
    await sheet.getByRole("button", { name: "Révoquer" }).click();
    await expect(sheet).toBeHidden();
    await expect(page.getByText(/^Lien créé le/)).toBeHidden();
  });
});

test.describe("sortir d'un Espace", () => {
  test("retire un membre, qui ne voit plus l'Espace", async ({ page, browser }) => {
    await signedIn(page, owner);
    await page.goto(spaceUrl);
    await page.getByRole("button", { name: `Gérer ${guest.name}` }).click();
    await page.getByRole("button", { name: "Retirer de l'Espace" }).click();
    await page
      .getByRole("alertdialog", { name: `Retirer ${guest.name} ?` })
      .getByRole("button", { name: "Retirer de l'Espace" })
      .click();
    await expect(page.getByText(guest.name, { exact: true })).toBeHidden();

    const context = await browser.newContext();
    const guestPage = await context.newPage();
    await signedIn(guestPage, guest);
    await guestPage.goto(spaceUrl);
    await expect(
      guestPage.getByRole("heading", { name: "Cet Espace est introuvable" }),
    ).toBeVisible();
    await context.close();
  });

  test("supprime l'Espace quand la dernière personne le quitte", async ({ page }) => {
    await signedIn(page, owner);
    await page.goto(spaceUrl);
    await page.getByRole("button", { name: "Quitter", exact: true }).click();

    const sheet = page.getByRole("alertdialog", { name: `Quitter « ${SPACE_NAME} » ?` });
    await expect(sheet).toContainText("il sera supprimé définitivement");
    await sheet.getByRole("button", { name: "Quitter l'Espace" }).click();

    await expect(page).toHaveURL("/espaces");
    await expect(page.getByRole("heading", { name: "Partager, si tu veux" })).toBeVisible();
  });

  test("supprime un Espace après confirmation", async ({ page }) => {
    await signedIn(page, owner);
    await page.goto("/espaces/nouveau");
    await page.getByLabel("Nom", { exact: true }).fill("Brouillon");
    await page.getByRole("button", { name: "Créer l'Espace" }).click();
    await page.getByRole("button", { name: "Supprimer", exact: true }).click();

    const sheet = page.getByRole("alertdialog", { name: "Supprimer « Brouillon » ?" });
    await expect(sheet).toBeVisible();
    await sheet.getByRole("button", { name: "Supprimer définitivement" }).click();

    await expect(page).toHaveURL("/espaces");
    await expect(page.getByRole("heading", { name: "Partager, si tu veux" })).toBeVisible();
  });
});
