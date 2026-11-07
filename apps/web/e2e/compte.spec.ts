import { randomUUID } from "node:crypto";

import { type Cookie, expect, type Locator, type Page, test } from "@playwright/test";

import { waitForLink } from "./mailpit";
import { ATTEMPT_TIMEOUT, submitPastRateLimit } from "./rate-limit";

const DISPLAY_NAME = "Eve";
const GREETING = `Bonjour, ${DISPLAY_NAME}`;
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
  await page
    .getByRole("navigation", { name: "Modules" })
    .getByRole("link", { name: "Todo" })
    .click();
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

/** Le « + » ajoute une tâche en deux gestes (titre, Entrée), de n'importe quelle page, sans déborder en largeur. */
async function addTaskWithPlusButton(page: Page) {
  await page.goto("/profil");
  await page.getByRole("button", { name: "Nouvelle tâche", exact: true }).click();
  const sheet = page.getByRole("dialog", { name: "Nouvelle tâche" });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("combobox", { name: "Liste" })).toBeVisible();
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  await sheet.getByLabel("Nouvelle tâche").fill("Appeler le garagiste");
  await page.keyboard.press("Enter");
  await expect(sheet).toBeHidden();
  await expect(page.getByText("Tâche ajoutée à « Courses ».")).toBeVisible();
  await page.goto("/todo");
  await expect(page.getByRole("checkbox", { name: "Appeler le garagiste" })).toBeVisible();
  // Rangée : les parcours suivants partent d'une liste sans cette tâche.
  await chooseTaskAction(page, "Appeler le garagiste", "Supprimer");
  await page.getByRole("button", { name: "Supprimer définitivement" }).click();
  await expect(page.getByRole("checkbox", { name: "Appeler le garagiste" })).toHaveCount(0);
}

/**
 * Déplace d'une heure vers le bas une entrée de la vue Jour, prise par son milieu : le décalage compte, pas le point
 * visé. PC : glisser-déposer à la souris. Mobile : appui long qui la décolle, puis toucher du créneau.
 */
async function moveEntryOneHourLater(page: Page, entry: Locator, day: string) {
  const column = page.locator(`[data-move-day="${day}"][data-move-first-hour]`);
  const hourHeight = Number(await column.getAttribute("data-move-hour-height"));
  const box = await entry.boundingBox();
  if (box === null) throw new Error("Entrée invisible.");
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  if (test.info().project.name === "mobile") {
    await entry.dispatchEvent("pointerdown", {
      pointerType: "touch",
      isPrimary: true,
      clientX: start.x,
      clientY: start.y,
    });
    await expect(page.getByRole("status")).toContainText("est décollée");
    // Le clic qui suit un appui long est avalé : on laisse passer son délai (600 ms) avant de poser.
    await page.waitForTimeout(700);
    await page.touchscreen.tap(start.x, start.y + hourHeight);
    return;
  }
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x, start.y + hourHeight, { steps: 8 });
  await page.mouse.up();
}

/** Sur l'Agenda : ajoute une entrée, la retrouve après rechargement, la déplace, la modifie, puis la supprime. */
async function addMoveEditThenDeleteEntry(page: Page, day: string) {
  await page.getByRole("button", { name: "+ Nouvelle entrée" }).click();
  await page.getByLabel("Titre").fill("Dentiste");
  await page.getByLabel("Lieu").fill("Cabinet");
  await page.getByRole("button", { name: "Ajouter" }).click();
  const entry = page.getByRole("button", { name: /^Dentiste, 09:00 – 10:00/ });
  await expect(entry).toBeVisible();
  await page.reload();
  await moveEntryOneHourLater(page, entry, day);
  const moved = page.getByRole("button", { name: /^Dentiste, 10:00 – 11:00/ });
  await expect(moved).toBeVisible();
  await moved.click();
  await page.getByLabel("Titre").fill("Dentiste Martin");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  const renamed = page.getByRole("button", { name: /^Dentiste Martin/ });
  await expect(renamed).toBeVisible();
  await renamed.click();
  await page.getByRole("button", { name: "Supprimer" }).click();
  await page.getByRole("button", { name: "Supprimer l'entrée" }).click();
  await expect(renamed).toHaveCount(0);
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
}

/** Ouvre le menu d'actions d'une tâche et choisit une action. */
async function chooseTaskAction(page: Page, title: string, action: string) {
  // Un message d'ajout ou de modification recouvre la ligne du bas (surtout sur mobile) : le défilement de Playwright
  // pour atteindre le bouton refermerait le menu. On le ferme d'abord, comme on le ferait à la main.
  const closeMessage = page.getByRole("button", { name: "Fermer", exact: true });
  if (await closeMessage.isVisible()) await closeMessage.click();
  const trigger = page.getByRole("button", { name: `Actions de « ${title} »` });
  // Au milieu de l'écran, loin de la barre basse : plus aucun défilement ne suit l'ouverture (il refermerait le menu).
  await trigger.evaluate((element) => {
    element.scrollIntoView({ block: "center" });
  });
  await trigger.click();
  await page.getByRole("menuitem", { name: action }).click();
}

/** Sur le Todo : ajoute une sous-tâche, modifie puis supprime la tâche, renomme puis supprime la liste. */
async function editThenDeleteTaskAndList(page: Page) {
  // Tâche décochée d'abord : cocher sa sous-tâche ne doit pas la cocher (rien ne se coche en cascade).
  const parent = page.getByRole("checkbox", { name: "Acheter du pain", exact: true });
  await parent.click();
  await expect(parent).not.toBeChecked();

  await chooseTaskAction(page, "Acheter du pain", "Ajouter une sous-tâche");
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

  await chooseTaskAction(page, "Acheter du pain", "Modifier");
  await page.getByLabel("Titre").fill("Acheter du pain complet");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByRole("checkbox", { name: "Acheter du pain complet" })).toBeVisible();

  await chooseTaskAction(page, "Acheter du pain complet", "Supprimer");
  await expect(
    page.getByRole("group", { name: "Supprimer « Acheter du pain complet » et sa sous-tâche ?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Supprimer définitivement" }).click();
  await expect(page.getByText("Aucune tâche dans cette liste")).toBeVisible();

  // Tâche répétée : cochée, elle reste à faire et annonce sa prochaine échéance.
  await page.getByLabel("Nouvelle tâche").fill("Arroser les plantes");
  await page.getByText("Description, échéance, répétition (facultatives)").click();
  // Le bouton radio est masqué visuellement : on clique sur sa pastille, comme on le ferait à la main.
  await page.getByText("Chaque semaine", { exact: true }).click();
  await expect(page.getByRole("radio", { name: "Chaque semaine" })).toBeChecked();
  await page.getByRole("button", { name: "Ajouter" }).click();
  await expect(page.getByText("Toutes les semaines")).toBeVisible();
  await page.getByRole("checkbox", { name: "Arroser les plantes" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Prochaine fois le" })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Arroser les plantes" })).not.toBeChecked();
  // Garde-fou : l'occurrence faite s'annule.
  await page.getByRole("button", { name: "Annuler" }).click();
  await expect(page.getByRole("status").filter({ hasText: "coche annulée" })).toBeVisible();

  // Terminer pour de bon : la répétition s'arrête, la tâche passe dans « Cochées ».
  await chooseTaskAction(page, "Arroser les plantes", "Terminer pour de bon");
  await expect(page.getByRole("status").filter({ hasText: "ne se répète plus" })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Arroser les plantes" })).toBeChecked();
  await expect(page.getByText("Toutes les semaines")).toBeHidden();

  // Répétition par jours de la semaine : « tous les mardis », sans date d'échéance.
  await page.getByLabel("Nouvelle tâche").fill("Sport");
  await page.getByText("Personnalisée…", { exact: true }).click();
  await page.getByText("Mardi", { exact: true }).click();
  await page.getByRole("button", { name: "Ajouter" }).click();
  await expect(page.getByText("Tous les mardis")).toBeVisible();

  await page.getByRole("button", { name: "Modifier la liste" }).click();
  await page.getByLabel("Nom de la liste").fill("Marché");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByRole("heading", { name: "Marché" })).toBeVisible();

  await page.getByRole("button", { name: "Supprimer la liste" }).click();
  await page.getByRole("button", { name: "Supprimer définitivement" }).click();
  await expect(page.getByRole("button", { name: "Créer ma première liste" })).toBeVisible();
}

/** Éteint puis rallume le module Agenda dans le profil : la navigation le retire, puis le rend. */
async function toggleAgendaModule(page: Page, session: Cookie[]) {
  await page.context().addCookies(session);
  await page.goto("/profil");
  const modules = page.getByRole("navigation", { name: "Modules" });
  await expect(modules.getByRole("link", { name: "Agenda" })).toBeVisible();
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);

  const agenda = page.getByRole("switch", { name: "Agenda" });
  await agenda.uncheck();
  await page.getByRole("button", { name: "Enregistrer" }).last().click();
  await expect(modules.getByRole("link", { name: "Agenda" })).toBeHidden();
  await expect(modules.getByRole("link", { name: "Todo" })).toBeVisible();

  await agenda.check();
  await page.getByRole("button", { name: "Enregistrer" }).last().click();
  await expect(modules.getByRole("link", { name: "Agenda" })).toBeVisible();
}

type ModulesChoice = { todo: boolean; agenda: boolean; events: boolean };

/** Allume ou éteint les modules dans le profil, puis ouvre l'accueil. */
async function chooseModules(page: Page, choice: ModulesChoice) {
  await page.goto("/profil");
  await page.getByRole("switch", { name: "Todo" }).setChecked(choice.todo);
  await page.getByRole("switch", { name: "Agenda" }).setChecked(choice.agenda);
  await page.getByRole("switch", { name: "Événements" }).setChecked(choice.events);
  await page.getByRole("button", { name: "Enregistrer" }).last().click();
  await expect(page.getByRole("status").filter({ hasText: /enregistr/i })).toBeVisible();
  await page.goto("/");
}

/** Accueil selon les modules : Todo seul, Agenda seul, Événements seul (pas encore d'écran), aucun. */
async function checkTodayVariants(page: Page, session: Cookie[]) {
  await page.context().addCookies(session);
  const agenda = page.getByRole("heading", { name: "Au fil de la journée" });
  const todo = page.getByRole("heading", { name: "Du jour" });
  await chooseModules(page, { todo: true, agenda: false, events: false });
  await expect(todo).toBeVisible();
  await expect(agenda).toBeHidden();
  await chooseModules(page, { todo: false, agenda: true, events: false });
  await expect(agenda).toBeVisible();
  await expect(todo).toBeHidden();
  await chooseModules(page, { todo: false, agenda: false, events: true });
  await expect(page.getByText("Le module Événements arrive bientôt")).toBeVisible();
  await chooseModules(page, { todo: false, agenda: false, events: false });
  await expect(page.getByText("Aucun module activé")).toBeVisible();
  await page.getByRole("link", { name: "Ouvrir mon profil" }).click();
  await expect(page).toHaveURL("/profil");
  await chooseModules(page, { todo: true, agenda: true, events: false });
  await expect(agenda).toBeVisible();
  await expect(todo).toBeVisible();
}

/**
 * Page des composants : ce que jsdom ne joue pas (`<dialog>` modal, API Popover). Échap ferme et le focus revient à
 * l'élément d'origine ; la confirmation renforcée reste inactive tant que la case n'est pas cochée ; le menu se
 * parcourt aux flèches et se ferme d'un clic ailleurs.
 */
async function checkDialog(page: Page) {
  const opener = page.getByRole("button", { name: "Confirmation", exact: true });
  await opener.click();
  const dialog = page.getByRole("alertdialog", { name: "Supprimer la tâche ?" });
  await expect(dialog).toBeVisible();
  // Le focus arrive sur « renoncer » (jamais sur l'action destructive).
  await expect(dialog.getByRole("button", { name: "Garder la tâche" })).toBeFocused();
  // Modal : plus de Tab que le dialogue n'a de contrôles, dans les deux sens. Le focus peut sortir vers l'interface du
  // navigateur (`body`), jamais atteindre la page derrière (inerte).
  for (const key of ["Tab", "Tab", "Tab", "Tab", "Shift+Tab", "Shift+Tab", "Shift+Tab"]) {
    await page.keyboard.press(key);
    const behindPage = await dialog.evaluate(
      (element) =>
        document.activeElement !== document.body && !element.contains(document.activeElement),
    );
    expect(behindPage).toBe(false);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
}

async function checkStrongConfirmation(page: Page) {
  await page.getByRole("button", { name: "Confirmation renforcée" }).click();
  const dialog = page.getByRole("alertdialog", { name: "Supprimer la tâche ?" });
  const confirm = dialog.getByRole("button", { name: "Supprimer définitivement" });
  await expect(confirm).toBeDisabled();
  await dialog.getByRole("checkbox", { name: "Je comprends que c'est définitif" }).check();
  await expect(confirm).toBeEnabled();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
}

async function checkMenu(page: Page) {
  const trigger = page.getByRole("button", { name: "Actions de la tâche d'exemple" });
  const menu = page.getByRole("menu", { name: "Actions de la tâche d'exemple" });
  await trigger.click();
  await expect(menu.getByRole("menuitem", { name: "Modifier" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(menu.getByRole("menuitem", { name: "Reporter à demain" })).toBeFocused();
  // Indisponible : sautée par les flèches, sans effet au clic.
  await expect(menu.getByRole("menuitem", { name: /indisponible/ })).toBeDisabled();
  await page.keyboard.press("ArrowDown");
  await expect(menu.getByRole("menuitem", { name: "Modifier" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
  // Un appui ailleurs ferme.
  await trigger.click();
  await page.getByRole("heading", { name: "Menu", exact: true }).click();
  await expect(menu).toBeHidden();
  await trigger.click();
  await page.getByRole("menuitem", { name: "Reporter à demain" }).click();
  await expect(page.getByText("Tâche reportée à demain.")).toBeVisible();
  await expect(trigger).toBeFocused();
}

async function checkOverlays(page: Page) {
  await checkDialog(page);
  await checkStrongConfirmation(page);
  await checkMenu(page);
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
}

const greeting = (page: Page) => page.getByText(GREETING);

async function openSignedIn(page: Page, session: Cookie[], path: string) {
  await page.context().addCookies(session);
  await page.goto(path);
}

async function openHomeSignedIn(page: Page, session: Cookie[]) {
  await openSignedIn(page, session, "/");
  await expect(greeting(page)).toBeVisible();
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

  test("annonce l'e-mail de confirmation quand l'inscription réussit", async ({ page }) => {
    await page.goto("/inscription");
    await page.getByLabel("Ton nom", { exact: true }).fill(DISPLAY_NAME);
    await fillCredentials(page, email, password);
    await submitPastRateLimit(page, "Créer mon compte", async () => {
      await expect(page.getByRole("status")).toContainText(`Un e-mail vient de partir à ${email}`, {
        timeout: ATTEMPT_TIMEOUT,
      });
    });
  });

  test("ouvre l'accueil quand on suit le lien de confirmation", async ({ page, request }) => {
    await page.goto(await waitForLink(request, email, 1));
    await expect(greeting(page)).toBeVisible();
    session = await page.context().cookies();
  });

  test("ne déborde pas en largeur quand on ouvre l'accueil", async ({ page }) => {
    await openHomeSignedIn(page, session);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });

  test("crée une liste, ajoute une tâche et la coche, puis en ajoute une par le « + » quand on ouvre le Todo", async ({
    page,
  }) => {
    await openHomeSignedIn(page, session);
    await createListAndCheckTask(page);
    await addTaskWithPlusButton(page);
  });

  test("ajoute une sous-tâche, modifie puis supprime la tâche et la liste quand on le demande", async ({
    page,
  }) => {
    await openSignedIn(page, session, "/todo");
    await editThenDeleteTaskAndList(page);
  });

  test("ajoute, déplace, modifie puis supprime une entrée quand on ouvre l'Agenda", async ({
    page,
  }) => {
    await openSignedIn(page, session, "/agenda?vue=jour&jour=2030-06-12");
    await addMoveEditThenDeleteEntry(page, "2030-06-12");
  });

  test("garde le focus et ferme à Échap dans les dialogues et le menu de la page des composants", async ({
    page,
  }) => {
    await openSignedIn(page, session, "/composants");
    await checkOverlays(page);
  });

  test("retire un module de la navigation et adapte l'accueil", async ({ page }) => {
    await toggleAgendaModule(page, session);
    await checkTodayVariants(page, session);
  });

  test("revient à la connexion quand on se déconnecte", async ({ page }) => {
    await openSignedIn(page, session, "/profil");
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
    await submitPastRateLimit(page, "Se connecter", async () => {
      await expect(greeting(page)).toBeVisible({ timeout: ATTEMPT_TIMEOUT });
    });
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
