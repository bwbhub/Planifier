# Récap de session

À remplir **à la fin de chaque session et avant chaque push** : une entrée en haut du fichier (la plus récente d'abord).
Chaque entrée dit ce qui vient d'être fait, ce qui a réellement tourné, ce qui reste ouvert et ce qui est attendu ensuite.
Faits uniquement : ce qui n'a pas été exécuté est écrit comme tel.

Modèle d'entrée :

```
## AAAA-MM-JJ — <sujet> (branche `<nom>`)

**Fait** : …
**Décisions** : … (et pourquoi)
**Vérifié** : commandes réellement exécutées et résultat ; ce qui n'a pas tourné.
**Ouvert** : revues humaines requises, risques, dettes créées.
**Attendu ensuite** : …
```

---

## 2026-11-07 — Champ date et heure (branche `feat/date-time-field`)

**Fait** : plan 2/4 (ticket `869fhwtg9`), suite. `packages/ui/src/components/date-time-field.tsx` : `DateTimeField`, contrôlé (`{ date, time }`), jour en `<input type="date">` natif, case « Sans heure » (cochée par défaut) qui révèle `<input type="time">` ; la recocher efface l'heure ; erreur et aide reliées au jour ; noms pour `FormData` (heure envoyée seulement si saisie). Libellés en props (sans métier). 9 tests (bascule, valeurs, `FormData`, erreur, axe) ; section « Date et heure » sur `/composants` (sans heure, avec heure, erreur, désactivé).
**Décisions** : natif plutôt que `@mui/x-date-pickers` de l'ancien `front/` (aucune dépendance). `time` : `null` (sans heure ou heure vide) ou `HH:MM` ; la case seule, gardée en interne, décide si le champ heure est montré (plus d'état `""`). Pas encore branché au formulaire de tâche : l'heure d'échéance n'existe pas dans le modèle, c'est le plan 3 (migration) qui le consomme.
**Vérifié** : `pnpm check-types`, `pnpm lint`, `pnpm test` (ui 100, web 254), `pnpm build`, `pnpm test:e2e` (62) exécutés, verts. Rien vu à l'œil (sélecteur natif selon navigateur, mobile, clair et nuit).
**Revue** : `/code-review` passée ; corrigé : état `""` supprimé, commentaire `FormData` exact, tests `hint`/`disabled`/jour vidé/heure effacée, `hint` dans la démo. Laissé au plan 3 : erreur propre à l'heure, règle « heure ⇒ jour », `min`/`max`/`required`.
**Ouvert** :
**Attendu ensuite** : fusion de la PR ; puis `RecurrenceField`.

---

## 2026-11-07 — Bloc de créneau (branche `feat/slot-block`)

**Fait** : plan 2/4 (ticket `869fhwtg9`), suite. `agenda/atoms/slot-block.tsx` : `SlotBlock`, présentation pure (titre, horaire, `maybe` = bordure pointillée d'accent + « Peut-être », `greyed` = estompé + « Tâche faite », `hidden` = pointillés discrets, lignes et pied en enfants). `EntryBlock` le compose et garde déplacement, survol et avatar. 5 tests, section « Créneau » sur `/composants`. Comme `TaskLine`, il reste dans `agenda` (règle `_shared` = au moins 2 modules) et montera avec Aujourd'hui.
**Décisions** : « grisé » et « peut-être » ne sont pas alimentés (la donnée vient du ticket 869fp54da et du module Événements) ; rendu seulement. Le nom accessible d'une entrée (`aria-label`) ne dit pas encore ces états : à ajouter avec la donnée.
**Vérifié** : `pnpm check-types`, `pnpm lint`, `pnpm test` (web 254), `pnpm build`, `pnpm test:e2e` (62) exécutés, verts. Rien vu à l'œil (grille Jour/Semaine, déplacement, `/composants` clair et nuit).
**Revue** : `/code-review` passée ; corrigé : prop `as` → `interactive`, constante `detailClass`, tests des bordures/opacité/rôle, démo avec bouton et états combinés, commentaire sur l'`aria-label`. Gardé : `background` en classe brute, ordre des exports.
**Ouvert** :
**Attendu ensuite** : fusion de la PR ; puis `DateTimeField`, `RecurrenceField`.

---

## 2026-11-07 — Menu d'actions de la ligne de tâche (branche `feat/menu-actions-tache`)

**Fait** : plan 2/4 (ticket `869fhwtg9`), suite. Les 4 boutons de `TaskActions` (`task-row.tsx`) deviennent un `Menu` « Actions de « <titre> » » (⋯) : Ajouter une sous-tâche (tâche seulement), Terminer pour de bon (tâche répétée à faire), Modifier, Supprimer. Un toast par action réussie qui n'en avait pas : « Tâche modifiée. » (formulaire) et « Tâche supprimée. » (posé dans `useDeleteTask`, car la ligne disparaît avec la tâche). Terminer garde son annonce dans la liste (avec Annuler). Mots dans `TODO_LABELS`. Tests `task-row`, `list-panel` et E2E `compte.spec.ts` suivent les nouveaux noms ; `ToastProvider` ajouté aux tests qui rendent le formulaire ou la suppression.
**Décisions** : toast de suppression au niveau du hook (un rappel de `mutate` ne tient pas si le composant disparaît) ; confirmation de suppression inchangée (`ConfirmPanel` sur place).
**Vérifié** : `pnpm check-types`, `pnpm lint`, `pnpm test` (web 248), `pnpm build`, `pnpm test:e2e` (62) exécutés, verts. Rien vu à l'œil (menu sur ligne, mobile 375 px, contraste du ⋯).
**Revue** : `/code-review` passée ; corrigé : toast « Tâche ajoutée. » / « Sous-tâche ajoutée. » à la création (+ test), ordre des imports. Gardé : toast de suppression dans le hook (la ligne disparaît), helper de test non extrait (règle des trois).
**Ouvert** : Toast de « Terminer » : l'annonce existante avec Annuler est gardée. Cocher n'a pas de toast.
**Attendu ensuite** : fusion de la PR ; ensuite `SlotBlock`, `DateTimeField`, `RecurrenceField`.

---

## 2026-11-07 — Ligne de tâche partagée (branche `feat/ligne-de-tache`)

**Fait** : plan 2/4 (ticket `869fhwtg9`), PR 2. `features/todo/atoms/task-line.tsx` : `TaskLine`, ligne de tâche pure
(aucune requête) : case à gauche, titre, détails, pastille de sous-tâches « 2/4 » (dite en toutes lettres aux lecteurs
d'écran), avatar de l'assigné, « Cochée par … », état atténué, actions. Le Todo la compose (`TodoTaskLine` dans
`task-row.tsx`) ; elle reste dans `todo` (règle `_shared` = au moins 2 modules, revue) et montera dans `_shared` avec l'écran Aujourd'hui : l'ancien `TaskMain` disparaît, le compteur de sous-tâches en texte devient la pastille. Mots partagés
dans `lib/labels.ts` (`TASK_LABELS`). 7 tests de la ligne ; section « Ligne de tâche » sur `/composants` (états :
normale, sous-tâches, assignée et cochée par quelqu'un, atténuée, lecture seule). Page de référence regroupée
(`showcase-section.tsx`, `ui-showcase-feedback.tsx`) ; la démo de la ligne est exportée par `features/todo` et posée par la page
`/composants`.
**Décisions** : pas d'état « clone orphelin » ni de rouge (décision 2026-11-06). Pas de `onOpen` (« tap = détail ») avant
l'écran Détail de tâche (`869fp54d9`). Les quatre boutons d'action de `TaskActions` ne passent pas au `Menu` dans cette
PR (un sujet par PR) : PR suivante, avec la mise à jour des tests et de l'E2E qui cliquent ces boutons.
**Vérifié** : `pnpm check-types`, `pnpm lint`, `pnpm test` (239 tests du web existants inchangés + 7 nouveaux),
`pnpm build`, `pnpm format:check` OK ; E2E : voir ci-dessous. Rien vu au navigateur.
**Ouvert** : revue visuelle de la ligne (pastille, atténuation) ; le compteur « 1 sur 2 sous-tâches cochée » (texte) n'est
plus affiché, la pastille « 1/2 » le remplace.
**Attendu ensuite** : plan 2, PR 3 : menu d'actions de la ligne ; PR 4 : `SlotBlock` ; PR 5 : `DateTimeField` ; PR 6 :
`RecurrenceField`.

---

## 2026-11-07 — Récurrence par jours de la semaine (branche `feat/recurrence-jours-semaine`)

**Fait** : plan 2/4 (ticket `869fhwtg9`), PR 1 : le modèle. « Tous les mardis », « un lundi sur deux ». `constants` :
`WEEKDAYS`, `weekdayIndex`, `weekdayOf`. `domain-recurrence` : `Recurrence.weekdays`, `nextDueDate` à jours (premier jour
voulu après aujourd'hui et l'échéance, parité des semaines depuis l'ancre), `seriesAnchor(rule, series, today)` (la
première occurrence fait ancre pour une règle à jours sans échéance), forme stockée v2 (v1 toujours lue). Contrat :
`recurrenceSchema.weekdays` facultatif (additif), refusé hors rythme hebdomadaire et en double. API : le service passe
les jours et la nouvelle ancre. Web : `recurrenceLabel` dit « Tous les mardis » / « Toutes les 2 semaines, le lundi et
le jeudi ». ADR 0017 amendée.
**Décisions** : aucune échéance posée d'office (rien ne s'ajoute à l'insu) ; écran Aujourd'hui : « la règle tombe ce
jour » se calculera avec la règle (plan 4).
**Vérifié** : `pnpm check-types`, `pnpm lint`, `pnpm test` (22 tests du domaine, propriétés comprises), `pnpm build`,
`pnpm format:check` OK ; **165 tests d'intégration de l'API** passent (6 nouveaux).
**Revue (code-review, 2026-11-07)** : (1) le formulaire de tâche **effaçait à l'insu** les jours et remettait l'ancre de la
série à zéro à chaque modification (il renvoyait toujours `recurrence` et `dueDate`, défaut déjà présent pour toute
tâche répétée) : il n'envoie plus que ce qui change (`recurrenceChange`, test d'intégration « modifier le titre ne
touche ni les jours ni l'ancre ») ; (2) la règle « jours ⇒ hebdomadaire, sans doublon » est une seule fonction
(`isValidWeekdayRule`) pour le contrat et la forme stockée ; (3) `WEEKDAYS` / `Weekday` passent dans `constants/days`
(plus de dépendance days → todo) ; (4) tests : dimanche-lundi, deux jours une semaine sur deux, intervalle 99, ancre dans
le futur, `update`, `undoCompletion`, `finish`. E2E : 62 passent.
**Ouvert** : le critère « tous les mardis sans heure est accepté » (ticket Nouvelle tâche) n'est pas atteignable à
l'écran avant `RecurrenceField` (PR suivante du plan 2) ; l'écran Aujourd'hui devra calculer qu'une règle à jours
tombe un jour donné (une tâche sans échéance n'a pas de date). Pas de migration (champ JSON versionné).
**Attendu ensuite** : plan 2, PR 2 : `TaskLine` (`_shared`), PR 3 : `SlotBlock`, PR 4 : `DateTimeField`,
PR 5 : `RecurrenceField`.

---

## 2026-11-07 — Menu (branche `feat/ui-menu`)

**Fait** : plan 1/4, PR 4 (dernier bloc du ticket `869fp54cr`). `packages/ui` `Menu` : bouton `aria-haspopup="menu"` /
`aria-expanded`, liste `role="menu"` / `menuitem`, couche supérieure par l'API Popover (aucun parent ne le rogne), placé
sous le bouton et gardé dans l'écran. Clavier : flèche bas / haut / Entrée / Espace ouvrent (première ou dernière
action), flèches, Début et Fin circulent (actions indisponibles sautées), Échap ferme et rend le focus, Tab et un
appui ailleurs ferment. Section « Menu » sur `/composants`.
**Prouvé en navigateur** : nouveau test E2E (`compte.spec.ts`, PC et mobile) sur `/composants` : focus sur « renoncer »
et gardé dans le `<dialog>`, Échap ferme et rend le focus, confirmation renforcée inactive tant que la case n'est pas
cochée, menu aux flèches, Échap, clic ailleurs. Ça solde le « non prouvé » de la PR 1 (#38).
**Décisions** : le menu n'est pas encore branché sur la ligne de tâche (`TaskActions` de `todo/atoms/task-row.tsx`) :
c'est le ticket des composants de domaine (`869fhwtg9`, plan 2), où la ligne de tâche est refaite.
**Vérifié** : `pnpm check-types`, `pnpm lint`, `pnpm test` (9 tests du menu + axe), `pnpm build`, `pnpm format:check`
OK ; **62 E2E passent** en local. Rien vu au navigateur par un humain (placement, contraste AA clair/nuit).
**Revue (code-review, 2026-11-07)** : anneau de focus d'accent sur les actions (le focus ne se confond plus avec le survol),
le menu se ferme au défilement et au redimensionnement (il ne suit pas son bouton) et se retourne vers le haut s'il
manque la place en bas, Tab rend le focus au bouton avant de partir, un seul état d'ouverture (`first` / `last` /
`null`), 14 tests (flèche bas, Tab, action indisponible, défilement, écouteurs au démontage). E2E découpé en trois
helpers. **Constat** : un `<dialog>` modal ne piège pas le focus au sens strict (Tab sort vers l'interface du navigateur) ;
la garantie testée est qu'il n'atteint jamais la page derrière, qui est inerte.
**Ouvert** : pas de recherche à la frappe (typeahead) ; l'action indisponible est `disabled` (pas `aria-disabled`, donc
non focalisable) ; le test des composants vit dans la suite « parcours d'un compte » parce que la page est derrière la
connexion (il dépend de la session et de l'ordre).
**Attendu ensuite** : ticket `869fp54cr` complet (4 PR) à clore après revue visuelle ; plan 2 (`869fhwtg9`).

---

## 2026-11-07 — Skeleton et état vide (branche `feat/ui-skeleton-etat-vide`)

**Fait** : plan 1/4, PR 3 (ticket `869fp54cr`). `packages/ui` : `Skeleton` (formes `line`, `circle`, `block`, `card`, décoratif),
`EmptyState` (titre, phrase utile, action), `ListSkeleton` réécrit dessus. Le Todo passe aux états complets : squelettes
au lieu de « Chargement… » en texte nu, `LoadError` de `ui` (dette de `SUITE.md` : `todo/atoms/load-error.tsx`
supprimé, message via `todoErrorMessage`, reprise « Réessayer »), états vides en `EmptyState` (aucune liste, aucune
tâche). Section « Chargement, vide, erreur » sur `/composants`.
**Décisions** : `EmptyState` reste sur `MessageCard` (pas de 2e carte). Libellés du module dans `TODO_LABELS`.
Vide de la liste d'événement / de la vue Aujourd'hui : avec leurs écrans.
**Vérifié** : `pnpm check-types`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm format:check` OK ; **60 E2E passent** en
local (le test du vide cherche maintenant « Aucune tâche dans cette liste » sans le point). Rien vu au navigateur.
**Revue (code-review, 2026-11-07)** : titre de l'état vide « aucune tâche » en `h3` (`MessageCard` / `EmptyState`
acceptent `level` 1 à 3, 2 par défaut), chargement des personnes en `ListSkeleton`, libellés dans `TODO_LABELS`
(titres sans point final), `aria-busy` retiré de `ListSkeleton`, dette `load-error` retirée de `SUITE.md`. 60 E2E passent
après les corrections.
**Ouvert** : revue visuelle des squelettes (le chargement du Todo change d'aspect) ; formes `block` et `card` du
`Skeleton` seulement dans la démo en attendant la ligne de tâche et le bloc de créneau.
**Attendu ensuite** : plan 1, PR 4 (menu).

---

## 2026-11-07 — Toast (branche `feat/ui-toast`)

**Fait** : plan 1/4, PR 2 (ticket `869fp54cr`). `packages/ui` `ToastProvider` + `useToast().notify(texte, { tone, action })` :
un message à la fois, zones d'annonce `aria-live` (poli : confirmation ; assertif : erreur) toujours présentes,
5 s (8 s en erreur, 12 s avec action), minuterie suspendue au survol et tant que le focus est dans le message, bouton de
fermeture (libellé fourni par l'app). Monté dans `AppShell`, qui pose `--nav-height` ; utilitaire `bottom-above-nav`
(tokens) pour le toast, le bouton flottant et la barre de déplacement de l'agenda (position PC inchangée). Règle « toute
action réussie annonce son résultat par un toast » dans `frontend-data-state`. Section « Messages » sur `/composants`.
**Décisions** : toast pour toutes les confirmations (utilisateur, 2026-11-06). Brancher les toasts sur les mutations
existantes : pas dans cette PR, module par module (voir `SUITE.md`).
**Correctif CI (#39)** : (1) `format:check` : ligne avec espaces dans `ui-showcase.tsx`, issue de la résolution du
conflit avec #38 ; (2) E2E : mes zones permanentes `role="status"` / `role="alert"` doublaient celles des écrans
(`getByRole("status")` : « strict mode violation ») ⇒ `aria-live` sans `role`.
**Vérifié** : `pnpm check-types`, `pnpm lint`, `pnpm test` (12 tests du toast), `pnpm build`, `pnpm format:check` OK ;
**60 E2E passent en local** (base `planifier_test`), dont les confirmations d'Espaces de #38. Rien vu au navigateur
(position au-dessus de la barre basse à 375 px, contraste AA clair/nuit).
**Ouvert** : brancher les toasts sur les mutations existantes (ticket à créer) ; limites dans `SUITE.md`.
**Attendu ensuite** : plan 1, PR 3 (skeleton + état vide), PR 4 (menu).

---

## 2026-11-07 — `ConfirmDialog` et `Sheet size="form"` (branche `feat/ui-confirm-dialog`)

**Fait** : plan 1/4, PR 1 (ticket `869fp54cr`). `packages/ui` : `ConfirmDialog` (confirmation d'action définitive, option
`acknowledgement` = case à cocher obligatoire) et `Sheet size="form"` (formulaire long, défile dans la feuille).
`spaces/atoms/confirm-sheet.tsx` supprimé : ses 4 usages (quitter, supprimer, retirer, révoquer) passent par
`ConfirmDialog` (l'erreur arrive en `ReactNode`, `ActionError` reste dans `spaces`). Section « Dialogues » dans `/composants`.
**Décisions** : confirmation renforcée = case à cocher (réponse utilisateur 2026-11-06) ; `size="form"` posé tout de
suite pour la feuille « Nouvelle tâche » (décision : feuille, pas page).
**Vérifié** : `pnpm check-types`, `pnpm lint`, `pnpm test`, `pnpm build` OK. **Non lancés** : E2E (base locale arrêtée,
ils couvrent les confirmations des Espaces) ; rien vu au navigateur (focus piégé, Échap, contraste AA clair/nuit à voir
sur `/composants`).
**Revue (code-review, 2026-11-07)** : focus initial sur « Garder » (pas sur l'action destructive), contrat de montage
écrit et testé, `Button` accepte `ref`. **Non prouvés** : piège du focus et Échap (natifs `<dialog>`, jsdom ne les joue
pas) : pas de test E2E écrit, à voir à l'œil sur `/composants` ou à ajouter à la suite Playwright.
**Ouvert** : revue visuelle des dialogues ; règle « toast pour toute confirmation d'action » à écrire dans une skill
avec la PR toast.
**Attendu ensuite** : plan 1, PR 2 (toast), PR 3 (skeleton + état vide), PR 4 (menu).

---

## 2026-11-06 — Composant `TitledSection` (branche `feat/ui-section-titree`, empilée sur #35)

**Fait** : `packages/ui` `TitledSection` (`Card` + `h2` + `aria-labelledby` par `useId`), test, axe ; adopté par `/profil` (3), `/composants`, formulaire de nouvelle liste du Todo.
**Décisions** : titre en `h2` fixe ; `useId` remplace les `id` écrits à la main.
**Vérifié** : `pnpm check-types`, `pnpm lint`, `pnpm test`, `pnpm build` OK. E2E non relancés (le nom accessible des régions est inchangé). Rien vu au navigateur.
**Ouvert** : revue visuelle ; fusionner #35 avant cette PR (ou la viser sur `master` après).
**Attendu ensuite** : composants de retour (`869fp54cr`), composants de domaine (`869fhwtg9`), Nouvelle tâche (`869fhwtr3`).

---

## 2026-11-06 — Composants `Card` et `PageHeader` (branche `docs/suite-navigation`)

**Fait** : `packages/ui` `Card` (balise `section`/`div`/`article`, 3 paddings) et `PageHeader` (h1, précision, actions), testés ; adoptés par `/profil`, `/todo`, `/composants`.
**Décisions** : reste de `869fhwtg4` bloqué par d'autres tickets : « + » (Nouvelle tâche `869fhwtr3`), pastille non-lus
(Notifications : ni écran ni API), entrées Aujourd'hui (`869fhwtu9`) et Événements. Autres `rounded-card bg-surface` et
`h1` du web (agenda, Espaces, accueil) non migrés.
**Vérifié** : `pnpm check-types`, `pnpm lint`, `pnpm test` (236 tests web), `pnpm build` OK. Rien vu au navigateur.
**Ouvert** : revue visuelle de `869fhwtg4` / `869fhwtg1` ; migration `modules_utilisateur` à appliquer.
**Attendu ensuite** : Aujourd'hui (`869fhwtu9`), puis composants de retour (`869fp54cr`), Nouvelle tâche (`869fhwtr3`).

---

## 2026-11-05 (fin de session) — Fusions, nettoyage git, barre d'état

**Fait** : PR #30, #31, #33, #34 fusionnées dans `master` (l'Agenda complet, composants de base, navigation par modules). Branches locales fusionnées supprimées. `/code-review` (Standards et Spec) faite sur #31 et #34, corrigée, points à trancher dans `SUITE` §4. Barre d'état du contexte (`~/.claude/statusline-context.sh`, hors dépôt).

**Vérifié** : voir l'entrée suivante (chaîne complète, intégration, e2e 60/60). Après fusion : rien relancé sur `master`.

**Ouvert** : #32, #28 et #29 avaient été fusionnées dans leurs branches de base et pas dans `master` ; leur contenu est arrivé par #30, #33 et #34. Branches distantes fusionnées non supprimées (refus de l'auto mode). Barre d'état : champ `context_window.used_percentage` non confirmé.

**Attendu ensuite** : `SUITE` §2.

---

## 2026-11-05 — Composants de base et navigation par modules (branches `feat/ui-composants-base` puis `feat/navigation-modules`, empilées)

**Fait**

- `packages/ui` : `Switch` (case native `role="switch"`), `Tabs` (ARIA, flèches, Début/Fin), `SegmentedControl`, `Badge`, état `loading` du `Button`. `RolePill` s'appuie sur `Badge`. Page `/composants` (derrière la connexion) : chaque composant dans ses états.
- Modules de l'utilisateur : `User.modules` exposé (`account.me.get` rend `modules`, nouvelle procédure `account.me.setModules`), défaut = tous les modules (migration `20261105230000_modules_utilisateur`, comptes existants à liste vide remplis). Réglage « Modules » dans le profil.
- Navigation : `AppShell` remplace `AppHeader`. PC : panneau latéral (logo, modules, Espaces, Profil). Mobile : en-tête (logo, Espaces, Profil) et barre basse des modules. Filtrée par les modules activés ; seulement les pages qui existent (Todo, Agenda).

**Décisions**

- Défaut « tous les modules » plutôt que `[]` : l'onboarding (`869fp54d7`) pourra proposer le choix. Tranché avec l'utilisateur le 2026-11-05.
- Pas d'entrée Aujourd'hui, Événements, Notifications tant que leur écran n'existe pas (pas de lien vers un 404).
- `me.get` lit `modules` en base (la session Better Auth ne les porte pas) ; le test unitaire de liste blanche est passé dans le test d'intégration.

**Vérifié** : `check-types`, `lint`, `test`, `build`, `prettier --check` ; `test:integration` (api 159, api-server 15) ; `test:e2e` 60/60 (dont retrait/retour du module Agenda dans la navigation, sans débordement horizontal). Migration appliquée sur `planifier_test`.

**Ouvert**

- **Non fait du ticket `869fhwtg4`** : bouton « + » (tâche / entrée / événement), pastille de non-lus (attend l'API de notifications `869fhwtka`), carte (`Card`) en composant `ui`, entrées Aujourd'hui / Événements / Notifications.
- Pas vu à l'œil : thèmes clair et nuit, barre basse sur un vrai téléphone, panneau latéral PC.
- Revue humaine : migration (mise à jour de comptes existants), nouvelle procédure `setModules`.
- Onglets du Todo et sélecteur de vue de l'agenda restent des liens (navigation par URL), pas migrés vers `Tabs` / `SegmentedControl`.
- Base locale : `pnpm --filter @planifier/db migrate:deploy` pour appliquer la migration.

**Attendu ensuite**

- Ticket `869fhwtce` (db) : clore avec commentaire (Zod non généré, décision d'octobre).
- Écran Aujourd'hui, composants de retour (dialogue, toast, menu), écran Nouvelle tâche (« + »).

---

## 2026-11-05 — Agenda : déplacer une entrée (branche `feat/agenda-deplacer`, empilée sur #28)

**Fait** : glisser-déposer à la souris (aperçu en pointillés à l'endroit visé), appui long au doigt qui décolle l'entrée
(bandeau en surimpression, « Annuler », Échap), toucher d'un créneau pour la poser. Règle pure `shiftedWhen` dans
`@planifier/domain-agenda/move` (décalage depuis le point de prise, heure d'horloge, durée gardée) ; zones de dépôt et
lecture de l'écran dans `move-zones.ts` ; crochet `use-entry-move.ts` ; contexte `grid-actions.tsx`. Envoi par
l'`update` existant avec `version`, relu après un refus (`onSettled`). Deux commits : découpage sans changement de
comportement, puis le déplacement.

`/code-review` avant push, corrigée : saut d'une entrée prise par son milieu ou par son deuxième jour, clic qui suit un
appui long pris pour une pose, clic avalé bloquant ensuite le clavier, second déplacement parti avec une version
périmée, menu contextuel coupé à la souris, glisser coincé si le bouton est relâché hors de la fenêtre, règle hors du
package `domain-*`, props sur trois niveaux, nombres en dur, stub global de test non restauré.

**Vérifié** : `check-types`, `lint`, `test` (web 235/235, domain-agenda 18/18), `build`, `format --check` ;
`test:e2e` 58/58, dont le déplacement à la souris (PC) et à l'appui long (mobile). Commit de découpage vérifié seul
(types, lint, test web). Pas vu à l'œil dans un vrai navigateur tactile.

**Ouvert** : limites listées en `SUITE` §4.

## 2026-11-05 — Agenda : participants en texte libre (branche `feat/agenda-participants`, empilée sur #27)

**Fait** : #27 (Agenda) poussée après rebase sur `master` (#26 fusionnée). Colonne `participants` (migration
`20261105120000_agenda_participants`), 20 noms de 100 caractères au plus, chacun une fois ; champ « Participants »
(virgules) dans le formulaire ; « avec Marie, Léo » au survol et pour le lecteur d'écran. Seed : Bob a deux participants.

**Décisions** : texte libre, aucun compte lié ni prévenu. Visibles par l'Espace comme le lieu, puisque la maquette les
montre sur la vue fusionnée.

`/code-review` passée après le push (oubli), corrigée dans un second commit : `@pii` sur la colonne, contrainte
`participants IS NOT NULL` (migration modifiée, rejouée sur les bases locales), doublons insensibles à la casse,
fabriques de test partagées (`agenda/testing`), lecture des noms dans `utils/agenda-participants.ts`, participants
visibles sans survol quand la place le permet, `maxLength` du champ. Laissé : champs communs recopiés à la main entre
sélection, sortie et élément de grille (jugement, peu de gain).

**Vérifié** : `check-types`, `lint`, `test` (web 229/229), `build`, `format --check` ; `test:integration` api 159/159,
api-server 14/14, auth 1/1 ; `test:e2e` 58/58 ; migration appliquée sur `planifier` et `planifier_test`, sans dérive ;
seed relancé. Pas de capture d'écran.

**Ouvert** : revue humaine droits de #27. Le push passe par HTTPS + `gh` (la clé SSH n'est pas chargée dans l'agent).

**Attendu ensuite** : glisser-déposer (branche suivante, empilée).

## 2026-11-02 — Agenda : modèle, droits, API, logique pure (branche `feat/agenda-modele`, ticket `869fhwtrn`)

**Fait**

- ClickUp recalé sur le code : 5 tickets fermés, 11 passés « in progress ».
- `agenda_entries` (migration `20261102120000_agenda_entrees`, contraintes : horaire ou à la journée, source + UID) ;
  procédures `agenda.entries` : `list`, `listInSpace`, `create`, `update`, `delete`.
- Droits purs `domain-access/agenda.ts` (`canAccessAgendaEntry`, `spaceAgendaScope`), garde `entryGuard`.
- Nouveau package pur `@planifier/domain-agenda` : jours affichés, pas de navigation, colonnes de chevauchement.
- `list-access.ts` déplacé dans `api/features/_shared` : l'agenda s'en sert pour lier une tâche sans importer `todo`.
- Seed : entrées d'Alice et Bob. Glossaire, `project-context`, `SUITE`.

**Décisions** : un agenda par personne, sans rattachement à un Espace : la vue fusionnée se calcule, rien à nettoyer au
départ d'un membre. Horaire et à la journée séparés : un jour entier ne doit pas glisser avec le fuseau. Liste des
choix à confirmer : `SUITE` §4. Empilée sur `feat/todo-partage-lecture`, non fusionnée.

- Écran `/agenda` d'après la maquette nuit (Jour mobile, Semaine PC) : vues Jour, Semaine, Mois, filtres par personne,
  choix de l'Espace, formulaire d'entrée. La vue fusionnée ne rend plus ni description ni teinte (données minimales).

- `/code-review` (Standards, Spec) corrigée : position à l'heure d'horloge le jour du changement d'heure, filtre remis
  à zéro entre Espaces, case du Mois en lien unique vers le jour, Espace restreint sans pastilles, dates des entrées sur
  plusieurs jours, créneau de fin de soirée, erreurs de lecture montrées, état vide, « N créneaux ». Bornes d'écriture
  retirées des sorties. Mis en commun avec Todo et Espaces : teintes, `today`, message d'erreur, `toPage`, `personSchema`.
  Message « trop de demandes » des Espaces aligné sur « trop d'actions ».

**Laissé volontairement** : un `uuid` par module de contrat (isolation) ; `sharesAgendaSpace` réécrit la règle de
`spaceAgendaScope` en Prisma ; `hiddenPeople` hors adresse ; `opacity-60/75` non mesuré ; `source`/`sourceUid` sans
usage (exigés par le ticket).

**Vérifié** : `check-types`, `lint`, `test`, `build`, `format --check` OK ; web 224/224 ; `test:integration` api 157/157,
api-server 14/14, auth 1/1 ; `test:e2e` 58/58 ; migration sans dérive (base test) ; seed lancé deux fois. Captures
Playwright relues : Semaine PC clair et nuit, Jour mobile nuit, Semaine mobile clair, Mois PC nuit, sans débordement ;
après revue : Mois PC et Jour mobile nuit. Formulaire et survol vus seulement par les tests, pas à l'œil.

**Ouvert** : commit local, ni push ni PR. Revue humaine droits. Glisser-déposer et écarts : `SUITE` §4.

**Attendu ensuite** : fusion de #26, relecture à l'œil et des droits, décision sur le glisser-déposer, push sur demande.

## 2026-11-01 — Todo : liste perso en lecture seule (branche `feat/todo-partage-lecture`, tickets `869fhwtqr` / `869fhwtqz`)

**Fait**

- `todo_lists.read_only_space_id` (migration `20261101220000_listes_lecture_seule`, contrainte : un seul partage à la
  fois) ; `readOnlySpaceId` en création et modification, `readOnlySpace` et `can.write` en sortie ; droit pur
  `isReader` dans `canAccessTodoList`.
- Quitter l'Espace (`deleteMembership`) rend privées pour de bon les listes que le partant y montrait ; choisir un
  partage prend le verrou de l'Espace (`lockSpace`) : une sortie simultanée ne laisse pas de partage derrière.
- `/code-review` (standards + spec) puis corrections : formulaires ouverts fermés quand les droits changent (clé de
  `ListPanel`), message `FORBIDDEN`, `spaces` invalide `todo` au départ, « Cochée par » des autres effacé au passage en
  lecture seule, `onValueChange` sur `ChoiceGroup`, types dérivés, ADR 0009 amendé.
- Web : niveau « Ajouter et cocher » / « Seulement voir » sous « Partager avec » ; en lecture seule, coche désactivée,
  ni ajout ni action ; seed : « Vacances » montrée à l'Espace d'Alice et Bob.
- Tests : boucle `await` sur des promesses déjà lancées remplacée par `Promise.all` (rejections non gérées, y compris
  dans `todo.integration.test.ts`).

**Décisions** : avec qui ? Un Espace (choix de l'utilisateur, 2026-11-01) ; la liste reste perso (colonne à part de
`spaceId`) : assignation, « Cochée par » et suppression par le propriétaire d'Espace ne la concernent pas.

**Vérifié** (exécuté le 2026-11-01) : `pnpm check-types`, `pnpm lint`, `pnpm test`, `pnpm build`, `prettier --check` :
OK ; `pnpm test:integration` : api 134/134, api-server 14/14, auth 1/1 ; `pnpm test:e2e` : 56/56 ; migration sans
dérive ; seed lancé deux fois. Captures Playwright : lecteur en mobile clair et nuit, formulaire en mobile clair : OK.
**Non vérifié** : formulaire de nuit, PC.

**Ouvert** : `docs/SUITE.md` §4 (lecture seule) ; revue humaine des droits.

**Attendu ensuite** : fusion de cette PR ; fermeture des tickets Todo (reste : liste d'événement) ; `docs/SUITE.md` §3.

---

## 2026-11-01 — Todo : assignation (branche `feat/todo-assignation`, tickets `869fhwtqr` / `869fhwtqz`, en partie)

**Fait**

- `tasks.assignee_id` (migration `20261101200000_assignation_taches`), `assigneeId` en création et modification,
  `assignee` en sortie, conflit `ASSIGNEE_NOT_MEMBER`, `callerId` dans `lists.members`, droit pur `canBeAssigned`.
- Web : champ « Assignée à » (liste partagée), pastille et nom sur la ligne, sous-tâches comprises ; option
  « Atténuer les tâches qui ne me sont pas assignées » ; `SelectField` et `Avatar` `sm` dans `ui` ; contexte
  `ListView` au lieu de `shared` passé de composant en composant ; seed : une liste partagée, une tâche par personne.
- `/code-review` (standards + spec) puis corrections : assigné effacé pour de bon au départ d'un membre
  (`deleteMembership`) et quand une liste change d'Espace (il ne revient pas tout seul) ; version figée à l'ouverture
  du formulaire (une modification n'écrase plus un changement venu d'ailleurs, sur tous les champs) ; `updateTask` en
  transaction ; états chargement et erreur du champ ; classes de champ communes (`lib/field`).

**Décisions** : une personne au plus (maquette) ; pas d'assignation sur une liste perso ; tout membre assigne tout
membre ; tâche répétée : assigné gardé ; masquage à la lecture gardé pour l'Espace supprimé (ses listes redeviennent
perso) ; une liste qui change d'Espace garde l'assigné s'il est aussi membre du nouveau.

**Vérifié** (exécuté le 2026-11-01) : `pnpm check-types`, `pnpm lint`, `pnpm test`, `pnpm build`, `prettier --check` :
OK ; `pnpm test:integration` : api 118/118, api-server 14/14, auth 1/1 ; `pnpm test:e2e` : 54/54 ; migration sans
dérive ; seed lancé deux fois sur la base locale. **Non vérifié à l'œil** : rendu clair/nuit, mobile.

**Ouvert** : `docs/SUITE.md` §4 (assignation) ; revue humaine des droits (`canBeAssigned`, `deleteMembership`,
`unassignOutsideSpace`).

**Attendu ensuite** : fusion de cette PR (#24 fusionnée, base repassée sur `master`) ; partage en lecture seule d'une
liste perso.

---

## 2026-11-01 — Rattrapage des listes partagées vers `master` (branche `fix/rattrapage-listes-partagees`)

**Fait** : #23 était fusionnée dans `feat/todo-sous-taches` après la fusion de cette base par #22 : ses 4 commits
n'étaient pas dans `master`. Fusion de `a2554190` sur `master`, sans conflit. `docs/SUITE.md` remis à jour. Détail
du travail : entrées « listes partagées » du 2026-10-29, plus bas.

**Vérifié** (exécuté le 2026-11-01 sur la branche) : `pnpm check-types`, `pnpm lint`, `pnpm test`, `pnpm build` : OK ;
`pnpm test:integration` : api 107/107, api-server 14/14, auth 1/1 ; `pnpm test:e2e` : 54/54. Code identique à #23,
déjà relue : `/code-review` non relancé.

**Ouvert** : revue humaine des droits des listes (`docs/SUITE.md` §4).

**Attendu ensuite** : fusion par l'utilisateur, puis assignation (tickets `869fhwtqr`, `869fhwtqz`).

---

## 2026-10-29 — Récurrence : terminer et annuler (branche `feat/todo-recurrence`, PR #20)

**Fait** (réponses de l'utilisateur aux points ouverts) :

- `todo.tasks.finish` (additif) : arrête la répétition et coche, en une écriture ; action « Terminer » sur une tâche
  répétée à faire ; la tâche passe, grisée, dans « Cochées ».
- `todo.tasks.undoCompletion` (additif) : « Annuler » dans l'annonce, après une occurrence faite ou un « Terminer »
  (échéance et règle d'avant, ancre gardée, `STALE_VERSION` si modifiée entre-temps).
- Service : écritures versionnées factorisées (`writeVersioned`) ; `useToggleTask` devient `useTaskCompletion`
  (`toggle`, `finish`, annonce avec annulation) ; `TaskRow` reçoit `completion`.
- Tests : intégration (terminer, annuler les deux, le 31 gardé après annulation, version périmée, matrice des droits
  anonyme et autre utilisateur) ; fichier `todo-recurrence.integration.test.ts` séparé (seuil de 500 lignes) avec aide
  `todo.testing.ts` ; composants (`TaskRow` « Terminer », `ListPanel` annuler et terminer) ; E2E (annuler, terminer).
- ADR 0017 : décisions ajoutées ; reste « proposé » en attendant le choix des tâches planifiées (cron).

**Décisions de l'utilisateur** : sous-tâches gardées cochées d'une occurrence à l'autre ; `today` non borné (appareil
mal réglé : problème du client) ; forme du compteur de sous-tâches à revoir plus tard.

**Vérifié** (exécuté le 2026-10-29) : `pnpm check-types`, `pnpm lint`, `pnpm test`, `pnpm build`, `prettier
--check` : OK ; `pnpm test:integration` : api 94/94, api-server 14/14, auth 1/1 ; `pnpm test:e2e` : 28/28.

**Ouvert** : ADR 0017 (cron) ; champ « Intervalle » affiché avec « Jamais ».

**Attendu ensuite** : partage, liste partagée, assignation, une fois #21 et la pile Todo fusionnées (ou fusion à la
main des composants `ui`).

---

## 2026-10-29 — Revue de la récurrence (branche `feat/todo-recurrence`, PR #20)

**Fait** : #19 fusionnée dans la branche ; commit « limite des plans réglable » repris de #21 (l'E2E dépassait la
limite) ; `/code-review` (standards + spec) puis corrections :

- **Bug** : le jour d'origine glissait (mensuelle au 31 : 28 février puis 28 pour toujours). Ancre de série
  `tasks.recurrence_anchor` (migration de la PR complétée), posée à la première occurrence, remise à vide quand
  l'échéance ou la règle change ; `nextDueDate(règle, { anchor, due }, today)` compte toujours depuis l'ancre.
  ADR 0017 mis à jour.
- `domain-recurrence` : une table de pas (`STEPS`) au lieu d'un `switch` et d'une table de périodes ; `addDays` et
  `daysBetween` dans `constants/days` ; tests : séries cochées une à une (31 → 28/02 → 31/03, 29/02), propriété
  « aucun glissement ».
- Web : occurrence faite en rendu optimiste (`withOccurrenceDone`, restauré si refus) ; détails du formulaire
  ouverts selon une liste explicite de champs ; tests `TaskForm` (répétition, intervalle refusé, préremplissage,
  axe) et `ListPanel` (occurrence faite, annonce, refus, axe) ; aide de test `lib/testing/rpc-fetch.ts` (copie
  identique de #21).
- Intégration : série au 31 par l'API, échéance changée à la main, deux coches simultanées, tâche supprimée.
- `DEPENDANCES.md` : `domain-recurrence` parmi les consommateurs de zod.

**Décisions** : forme de la règle déclarée dans le contrat et dans `domain-recurrence` (un `domain-*` ne dépend pas
du contrat : workspace-architecture) ; `use-toggle-task` reste dans `utils/` (précédent `use-in-place-mode`).

**Vérifié** (exécuté le 2026-10-29) : `pnpm check-types`, `pnpm lint`, `pnpm test`, `pnpm build`, `prettier
--check` : OK ; `pnpm test:integration` : api 90/90, api-server 14/14, auth 1/1 ; `pnpm test:e2e` : 28/28 (avant le
découpage d'un `describe` d'intégration, sans effet sur l'E2E). Bases locales (dev et test) : colonne ajoutée à la
main (`ALTER TABLE … ADD COLUMN IF NOT EXISTS recurrence_anchor`), la migration ayant été complétée après application.

**Ouvert** : points à trancher dans `docs/SUITE.md` §4 (ADR 0017 à valider, « terminer pour de bon », sous-tâches
d'une tâche répétée, borne de `today`, annulation d'une occurrence).

**Attendu ensuite** : partage, liste partagée, assignation (après fusion de #21 pour les composants `ui`).

---

## 2026-10-29 — Listes partagées : décisions de l'utilisateur (branche `feat/todo-listes-partagees`, PR #23)

**Fait** : liste partagée rattachée à l'Espace (`canAccessTodoList` réécrite sans `ResourceAccess`) : le créateur
parti ne la voit plus, elle reste à l'Espace ; `lists.list` et le compte de listes l'ignorent ; `lists.members` =
membres de l'Espace (créateur d'abord s'il est membre). Création : choisir un Espace propose « Liste <Espace> »
(`nameAfterSpaceChange`), sans écraser un nom écrit. CONTEXT.md mis à jour.
**Décisions** (utilisateur, 2026-10-29) : liste à l'Espace sans le créateur parti ; membres renomment et
propriétaire d'Espace supprime : oui ; Todo désactivé : rien ne disparaît ; nom par défaut « Liste <Espace> ».
**Vérifié** : check-types, lint, test (domain-access 55, web 158), build, format ; intégration (api 107,
api-server 14, auth 1) ; E2E 54/54.
**Ouvert** : compte du créateur supprimé ⇒ ses listes partagées partent (Cascade), SUITE §4.
**Attendu ensuite** : assignation et « Atténuer ».

---

## 2026-10-29 — Todo : listes partagées et « Cochée par » (branche `feat/todo-listes-partagees`, tickets `869fhwtqr` / `869fhwtqz`, en partie)

**Fait** :

- PR #22 (rattrapage de #19 et #20, fusionnées dans leurs anciennes bases) ouverte vers `master`.
- Schéma : `todo_lists.space_id` (SetNull), `tasks.completed_by_id` (SetNull) ; migration `20261029220000_listes_partagees`.
- Droits : `domain-access/todo-list` (liste d'Espace ouverte en écriture à tous les membres, même Espace restreint ;
  suppression : propriétaire ou propriétaire d'Espace ; changer d'Espace : propriétaire), garde Todo réécrite.
- Contrat additif : `lists.list` paginé (`limit`, `cursor`, `nextCursor`), `spaceId` à la création et en
  modification, `space` et `can` en sortie, `lists.members`, `completedBy` des tâches, raison `TODO_DISABLED`,
  `modules` dans le résumé d'Espace.
- Web : choix « Partager avec » (propriétaire), en-tête « Liste partagée · Espace » avec pastilles, « Cochée par »,
  onglets paginés ; `AvatarStack` dans `packages/ui` (repris par l'en-tête d'Espace).
  **Décisions** (utilisateur) : liste partagée = rattachée à un Espace ; visible même si l'Espace restreint ; lecture
  seule d'une liste perso plus tard ; assignation à une personne, membre de l'Espace (PR suivante).
  **Revue** (`/code-review`, standards et spec) corrigée : droit « partager avec cet Espace » en fonction pure testée
  (`sharingSpaceVerdict`), accès à une liste en `{ space: { callerRole } | null }`, lecture des droits dans
  `list-access.ts`, `PAGE_MAX_LIMIT` partagé, états chargement et erreur du choix d'Espace, lien `?liste=` qui lit les
  pages suivantes, noms des membres cachés au propriétaire parti, tests de droits (non-membre, ancien membre).
  **Vérifié** (après la revue) : check-types, lint, test, build, format ; intégration (api 107, api-server 14,
  auth 1) ; E2E 54/54.
  **Ouvert** : SUITE §4 (listes partagées) ; revue humaine des droits.
  **Attendu ensuite** : assignation et « Atténuer les tâches qui ne me sont pas assignées ».

---

## 2026-10-29 — Fusion de `feat/espaces-ui` dans les branches Todo (branche `feat/todo-minimal`)

**Fait** : merge de `feat/espaces-ui` dans `feat/todo-minimal` (conflits : `Button` variantes et tailles unifiées,
en-tête avec les deux navs, routes, validation de formulaire dans `_shared/forms`, RECAP, `project-context`).
**Vérifié** : check-types, lint, test (web 116), build, format, intégration (api 74, api-server 14, auth 1), E2E 52/52.
**Ouvert** : `Button` sm rapetisse dans les Espaces ; doublon `LoadError` (SUITE §4). Merge des PR à faire par
l'utilisateur (refusé à l'agent).
**Attendu ensuite** : propager dans `feat/todo-sous-taches` puis `feat/todo-recurrence`.

---

## 2026-10-29 — Revue des sous-tâches (branche `feat/todo-sous-taches`, PR #19)

**Fait** : `/code-review` (standards + spec), sans violation nette ; corrections :

- utilitaires purs testés : `utils/subtasks.ts` (`isSubtask`, `subtasksByParent`, compteur, question de
  suppression) et `utils/task-done.ts` (`withTaskDone`, sorti des requêtes) ; prédicat « sous-tâche » partagé ;
- `DueDate` dans son propre atome ; `subtasks` facultatif sur `TaskRow` ; sous-tâches gardées à l'écran pendant
  la modification de leur tâche ;
- tests : `TaskRow` (compteur, coche seule, un niveau, suppression, modification, axe) ; intégration : parent
  appartenant à quelqu'un d'autre ⇒ `NOT_FOUND` ; E2E : la tâche part décochée, cocher la sous-tâche la laisse
  décochée (avant et après rechargement), bouton « Ajouter » ciblé par son formulaire ;
- `CONTEXT.md` : définition de « Sous-tâche ».

**Décisions** : `Subtasks` reste dans `task-row.tsx` (le sortir créerait un import circulaire avec `TaskRow`).

**Vérifié** (exécuté le 2026-10-29) : `pnpm check-types`, `pnpm lint`, `pnpm test`, `pnpm build`, `prettier
--check` : OK ; `pnpm test:integration` : api 80/80, api-server 14/14, auth 1/1 ; `pnpm test:e2e` : 28/28.

**Ouvert** : points à trancher dans `docs/SUITE.md` §4 (forme du compteur, sous-tâche ouverte sous tâche cochée).

**Attendu ensuite** : report sur `feat/todo-recurrence` (#20), puis sa revue.

---

## 2026-10-28 — Todo : récurrence (branche `feat/todo-recurrence`, ticket `869fhwtqr`, en partie)

**Fait** : ADR 0017 (proposé) ; package `@planifier/domain-recurrence` (`nextDueDate` pur, forme stockée versionnée,
cas d'or et propriétés) ; colonne `tasks.recurrence` JSON (migration `recurrence_taches`), `JSON_DB_NULL` exporté par
`db` ; contrat : `recurrence` en création, modification (`null` arrête) et sortie, procédure `completeOccurrence`
(`version` + `today`), `CONFLICT NOT_RECURRING` ; web : « Répéter » et « Intervalle » dans les détails, « Toutes les
semaines » sur la ligne, coche d'une tâche répétée ⇒ échéance avancée et annonce « Prochaine fois le … ».

**Décisions (agent, à valider, ADR 0017)** : une ligne par tâche répétée, échéance avancée à la coche (première
occurrence après aujourd'hui), pas de nouvelle tâche ; fin de mois ramenée au dernier jour ; « today » envoyé par
l'appareil ; rappel proposé reporté aux notifications.

**Vérifié** : portes OK ; `domain-recurrence` 9 tests ; `test:integration` api 85/85 (6 nouveaux + matrice de droits
étendue) ; `test:e2e` 28/28 (tâche hebdomadaire cochée : reste à faire, annonce la suivante). **Non vérifié** : CI, à
la main.

**Ouvert** : l'E2E frôle la limitation de débit des plans (120 requêtes/min par IP, tout le run vient de localhost) :
des 429 sont journalisés sur les derniers tests mobile, sans échec. À traiter à part (limite configurable pour l'E2E
ou clé par session ; touche la sécurité ⇒ revue humaine).

**Attendu ensuite** : PR empilée sur #19 ; puis UI Espaces.

---

## 2026-10-28 — Todo : sous-tâches (branche `feat/todo-sous-taches`, ticket `869fhwtqr`, en partie)

**Fait** : `Task.parentId` (même liste, un seul niveau, supprimées avec leur parent), migration `sous_taches` ;
`tasks.create` accepte `parentId` (parent d'une autre liste ⇒ `NOT_FOUND`, sous-tâche d'une sous-tâche ⇒ `CONFLICT
NESTED_SUBTASK`) ; `openTaskCount` sans les sous-tâches ; web : sous-tâches sous leur parent, « 1 sur 2 sous-tâches
cochées », « + Sous-tâche » sur place, question de suppression qui nomme les sous-tâches ; actions d'une tâche sous
son titre sur mobile (débordement de 23 px vu par l'E2E). Seed : deux sous-tâches.

**Décisions (agent, à valider)** : cocher une tâche ne coche pas ses sous-tâches, et inversement (principe 14) ;
sous-tâches comptées dans la borne de 500 tâches par liste ; une sous-tâche ne change pas de parent.

**Vérifié** : portes OK ; `test:integration` api 79/79 (5 nouveaux) ; `test:e2e` 28/28 (sous-tâche ajoutée et cochée
sans cocher le parent). **Non vérifié** : CI, à la main.

**Attendu ensuite** : PR empilée sur #18 ; puis récurrence.

---

## 2026-10-29 — Corrections de revue des Espaces (branche `feat/espaces-ui`)

**Fait**

- `/code-review` (standards + spec) sur la branche, puis corrections :
  - `ui` reçoit les blocs sans métier : `Avatar` (ex-`PersonBadge`), `ListSkeleton`, `LoadError` (`retryLabel`),
    `MessageCard`, `SettingRow`/`SettingCard`/`SectionTitle`, `lib/tint` ; `BackLink` dans `_shared` ;
    `Button` variante `ghost` (remplace `className="bg-transparent"`).
  - `Sheet` rend le focus à son déclencheur quand elle se ferme ou que le parent la retire.
  - Réglages : formulaire figé au montage (un rafraîchissement ne perd plus la saisie ni ne change la version
    envoyée) ; « Recharger » après `STALE_VERSION` le remonte une fois la relecture finie.
  - Membres : « Gérer » si le retrait **ou** le changement de rôle est permis ; « Retirer » seulement si permis.
  - « Révoquer » un lien se confirme (`ConfirmSheet`).
  - `/rejoindre` : jeton retiré de l'adresse (et de l'historique) dès sa lecture.
  - Ids de titres par `useId` ; ancre `MEMBERS_SECTION_ID` dans `constants.ts` ; « organisateur » → « propriétaire »
    (vocabulaire de `CONTEXT.md`) ; « Rien n'est perdu. » en libellé commun ; textes de retour de la connexion
    déclarés avec les routes (`lib/routes.ts`), plus dans `account`.
  - Lectures (TanStack Query) non réessayées sur un refus 4xx : un membre retiré voyait « Chargement » ~7 s.
  - API : limite des plans réglable (`RPC_RATE_LIMIT_PER_MINUTE`, défaut 120), relevée à 1000 pour l'E2E seulement.
- Tests : composants `MembersSection`, `ExitSection`, `InvitesSection`, `PromotionTip`, `SpacesList` (axe compris),
  `Sheet` (focus), blocs `ui`, `JoinSpace` (jeton retiré) ; serveur (limite configurée appliquée) ; E2E : modules,
  rôles, dernier propriétaire, révocation, retrait, dernier départ, suppression.

**Décisions**

- `homeLink`/`createLink` : même forme deux fois seulement, laissés (règle de trois).
- Limite E2E : variable d'environnement explicite plutôt qu'un comportement lié à `NODE_ENV`.

**Vérifié** (exécuté le 2026-10-29) : `pnpm check-types`, `pnpm lint`, `pnpm test`, `pnpm build` : OK ;
`prettier --check` : OK ; `pnpm test:integration` : api 58/58, api-server 14/14, auth 1/1 ; `pnpm test:e2e` : 48/48
(PC et mobile), aucun 429.

**Ouvert** : points à trancher et revues humaines dans `docs/SUITE.md` §4 (dont `RPC_RATE_LIMIT_PER_MINUTE`).

**Attendu ensuite** : PR sur master ; puis revue et corrections de #19 et #20, et partage/assignation du Todo.

---

## 2026-10-28 — UI des Espaces (branche `feat/espaces-ui`, ticket `869fhwtfk`)

**Fait**

- Maquette `docs/maquettes/espaces.html` (clair/nuit, mobile/PC, fiches d'écran), validée par l'utilisateur.
- Module web `spaces` : `/espaces` (liste, vide, chargement, erreur, pagination), `/espaces/nouveau` et
  `/espaces/[id]/reglages` (un seul formulaire : nom, modules, visibilité ; `STALE_VERSION` → recharger),
  `/espaces/[id]` (membres, « Gérer » : rôle et retrait, proposition de promotion à deux, liens d'invitation,
  réglages en lecture, quitter, supprimer), `/rejoindre#jeton` (aperçu puis adhésion explicite ; lien mort, déjà
  membre, complet). Bouton « Espaces » dans l'en-tête.
- `ui` : `Sheet` (feuille du bas sur `<dialog>` natif), `Button` gagne `outline`, `strong` et `size` ;
  `buttonClassName` prend un objet. `tokens` : `--overlay` (clair et nuit), `--radius-sheet`.
- Connexion : paramètre `retour` (liste fermée, seule `/rejoindre` ; pas de redirection ouverte), le fragment suit.
- `api-contract` : export additif des schémas `createSpaceInputSchema`, `updateSpaceInputSchema`, `inviteTokenSchema`
  et des types `SpaceSummaryOutput`, `SpaceInviteOutput`.
- Validation de formulaire déplacée de `account/utils` vers `_shared/forms` (deux modules l'utilisent).
- Lint : module `spaces` dans l'isolation des features (commit séparé).
- Après revue (standards + spec) :
  - droits de l'interface par `@planifier/domain-access`, sans comparaison de rôle réécrite
    (`utils/space-membership.ts` fait le lien avec l'Espace lu) ; « Rétrograder » masqué quand la règle le refuse ;
  - catalogues de libellés : `lib/labels.ts` (communs, `pageTitle`) et `spaces/labels.ts` (rôles, modules,
    visibilité, actions) ; pas encore de traduction, le catalogue est le point que les langues remplaceront ;
  - doublons retirés : `SpaceGate` (chargement, introuvable, erreur), `ConfirmSheet` (quitter, supprimer, retirer),
    `MessageCard`, `SpacePage` (cadre des 4 pages) ;
  - chargement des liens d'invitation affiché, erreur par `LoadError` (déplacé de `_shared` vers `spaces`) ;
  - `format-date` dans `lib/` ; paramètre `enabled` de `useSpaceInvites` retiré ; encart de retour de la connexion
    dans `account` (`ReturnNotice`) ;
  - historique de la branche redécoupé (refactorings, `ui`/`tokens`, e2e, fonctionnalité).

**Décisions**

- Jeton d'invitation dans le **fragment** (`#`) : jamais envoyé au serveur web, absent des journaux et du Referer ;
  page `rejoindre` en `no-referrer`, non indexée ; `router.replace` après adhésion retire le lien de l'historique.
- Modules cochés à la création : Todo et Agenda (choix de l'utilisateur), décochables.
- Teinte d'un Espace et des pastilles tirée de l'identifiant parmi les teintes des tokens : aucune couleur stockée.
- Réglages modifiés par le formulaire (règle 13), pas par des interrupteurs dans la page de l'Espace (maquette 3).
- Visibilité absente à la création : le contrat `create` ne la prend pas.
- « Plus tard » sur la proposition de promotion la masque jusqu'au prochain affichage : maquette alignée sur le code.
- Quitter, supprimer, rejoindre ne relisent que la liste : relire l'aperçu après adhésion affichait « déjà membre »
  avant la redirection (défaut trouvé par le test).

**Vérifié** (exécuté le 2026-10-28) : `pnpm check-types`, `pnpm lint`, `pnpm test`, `pnpm build` : OK ;
`pnpm test:e2e` : 36/36 (PC et mobile, dont le parcours Espace : création, lien, connexion depuis le lien avec
retour, adhésion, lien usé, suppression) ; `prettier --check` : OK. Captures clair/nuit, mobile/PC relues.

**Ouvert**

- Revue humaine (sécurité) : jeton dans le fragment et page `rejoindre` ; paramètre `retour` de la connexion (liste
  fermée) ; `compte.spec` rejoue inscription et connexion après la limite de débit (`e2e/rate-limit.ts`).
- Sans compte : la personne invitée s'inscrit puis doit rouvrir le lien (le retour ne traverse pas l'inscription).
- Pas de préchargement serveur des données d'Espace (chargement côté client, squelettes).

**Attendu ensuite** : revue, push et PR sur demande ; puis `869fmu1m4` (rattacher un événement à un Espace) une
fois le module Événements posé.

---

## 2026-10-28 — Clôture Espaces (branche `master`)

**Fait** : PR #17 mergée (`fbe86ca7`) ; ticket `869fhwtf9` fermé ; ticket `869fmu1m4` créé (rattacher un événement
à un Espace).
**Vérifié** : `master` local en avance rapide sur le merge. Aucun code modifié.
**Ouvert** : fetch SSH en échec dans le shell de l'agent (clé à passphrase, pas d'askpass), donc `origin/master`
local reste périmé.
**Attendu ensuite** : UI des Espaces (`869fhwtfk`) ou `869fmu1m4`.

---

## 2026-10-28 — Todo minimal : listes perso et tâches (branche `feat/todo-minimal`, tickets `869fhwtqr` / `869fhwtqz`, en partie)

**Fait**

- Demande de l'utilisateur : une app testable au plus vite ⇒ Todo minimal d'abord (choix parmi UI Espaces, déploiement).
- `db` : modèles `TodoList` (propriétaire, nom, teinte, version) et `Task` (titre, description, échéance `DATE`,
  `completedAt`, version), migration `todo_listes_taches`, seed (deux listes d'Alice, quatre tâches).
- `constants/todo` : bornes (nom 60, titre 200, description 2 000, 50 listes, 500 tâches par liste), `isListTint`.
- Contrat `todo.lists` (list, create, update, delete) et `todo.tasks` (list, create, update, setDone, delete) ;
  `CONFLICT` typé (`STALE_VERSION`, `TOO_MANY_LISTS`, `LIST_FULL`). `emptyOutputSchema` sorti dans `_shared`.
- `api` : gardes `listGuard` / `taskGuard` sur `canAccessResource` (déjà dans `domain-access`), bornes sous verrou de
  ligne (utilisateur, liste), coche rejouable (garde la date de la 1re coche, ne change pas la version).
- Web : page `/todo` (onglets de listes en `?liste=`, en-tête teinté, ajout de tâche à la chaîne, détails repliés,
  modification et suppression sur place avec confirmation, coche optimiste restaurée en cas d'erreur, états
  chargement / vide / erreur) ; lien Todo dans l'en-tête, « Ouvrir mes listes » sur l'accueil (indicateur d'API retiré).
- `ui` : `TextAreaField`. Validation de formulaire déplacée de `account` vers `_shared` (deux modules l'utilisent).
- Tests d'intégration de l'API sérialisés par fichier (`fileParallelism: false`) : deux fichiers vident la même base.

**Décisions (agent, à valider)** : périmètre réduit (ni partage, ni sous-tâches, ni récurrence, ni assignation, ni
« Cochée par ») ; pas de `spaceId` ni de `kind` sur la liste tant qu'aucune procédure ne s'en sert ; listes et
tâches bornées et rendues d'un bloc (pas de curseur) ; description vide refusée par le contrat (le formulaire
envoie absent ou `null`) ; Todo ouvert à tous, sans regarder les modules activés.

**Vérifié** : `pnpm check-types`, `pnpm lint`, `pnpm test`, `pnpm build` OK ; `test:integration` OK (api 72 dont
Todo 14 : droits « autre utilisateur » ⇒ NOT_FOUND sur les 7 procédures gardées, bornes, version périmée, coche
rejouable) ; `test:e2e` 26/26 (parcours Todo PC et mobile : liste, tâche, coche persistée). Seed lancé deux fois.
**Non vérifié** : `pnpm dev` à la main, rendu nuit à l'œil, CI, lecteur d'écran réel.

**Ouvert** : revue humaine (droits des listes). Activation du module Todo non prise en compte. Navigation provisoire
(lien dans l'en-tête, pas la barre de la maquette).

**Corrections de revue (`/code-review`, 2026-10-28)** : erreur de coche affichée par la liste (la ligne est recréée
en changeant de section) ; compte de la liste mis à jour avec la coche optimiste ; liste ou tâche supprimée avant
l'écriture ⇒ `NOT_FOUND` (plus `STALE_VERSION`) ; types de lignes dérivés de Prisma (`Prisma` exporté par `db`) ;
données de `CONFLICT` lues par `todoConflictDataSchema` ; `ConfirmPanel` et variantes `surface` / `ghost` / taille
`sm` de `Button` dans `ui` (`buttonClassName` prend un objet) ; une seule table des teintes ; section nommée par la
liste ; doublons retirés (tri à faire/cochées côté web seulement, conversion des jours dans `constants/days`, reprise
après erreur, modes sur place) ; `TODO_LIST_KINDS` inutilisé retiré ; tâche en retard : « Prévue le … » sans reproche
et « Reporter à aujourd'hui », année affichée si différente ; matrice « sans session » sur les 9 procédures. Portes
OK, `test:integration` api 74/74, `test:e2e` 28/28 (modifier et supprimer tâche et liste). Non fait : identifiants
typés par marque (jugement, coût sur tout le module), barre de navigation mobile (un seul module).

**Attendu ensuite** : vérif à la main par l'utilisateur, push + PR sur demande ; puis déploiement (`869fhwtcc`) pour
faire tester, ou suite du Todo (partage, sous-tâches, assignation).

## 2026-10-27 — Modèle Espace : droits, procédures, liens d'invitation (branche `feat/espaces`, ticket `869fhwtf9`)

**Fait**

- `domain-access/space` : `canAccessSpace` (membre : voir, quitter ; propriétaire : tout), `roleOfNewMember`,
  `departureOutcome`, `canChangeRole`, matrice testée.
- Migration `invitations_espace` : table `space_invites` (empreinte SHA-256 du jeton, `expires_at`, cascade).
- Contrat `spaces.space` (create, list, get, update, delete, leave), `spaces.members` (setRole, remove),
  `spaces.invites` (create, list, revoke, preview, accept). `CONFLICT` typé avec raison (`LAST_OWNER`, `SPACE_FULL`,
  `TOO_MANY_INVITES`, `STALE_VERSION`).
- `api` : `getDb` dans `ApiContext` (injecté par `apps/api`), garde `spaceGuard(action)` après validation d'entrée,
  services en transaction sous verrou de la ligne de l'Espace (`SELECT … FOR UPDATE`).
- Constantes : nom ≤ 60, 50 membres max, 20 liens en cours max, lien valable 7 jours.

**Décisions (utilisateur)** : ajout par lien d'invitation (rien envoyé) ; 2e membre propriétaire, stocké à l'arrivée ;
gestion aux propriétaires ; dernier propriétaire refusé tant qu'il reste des membres, dernier membre ⇒ Espace
supprimé. **Décisions (agent, à valider)** : lien à usage unique, non lié à une adresse ; bornes 50 / 20 / 7 j ;
membres exposés par nom seul (pas d'e-mail) ; skill `api-contracts-orpc` corrigée : validation d'entrée **avant**
les droits (un droit de ressource lit l'identifiant validé).

**Vérifié** (avant revue) : `pnpm check-types`, `pnpm lint`, `pnpm test`, `pnpm build`, `format:check` OK ; `test:integration`
36/36 (dont 21 Espaces : droits par rôle, dernier propriétaire, lien consommé, expiré, concurrence sur un même lien,
Espace plein). **Non vérifié** : CI, E2E (aucun écran), Neon.

**Ouvert** : revue humaine (droits, nouvelle route d'invitation, skill modifiée). Garde puis verrou : un rôle changé
entre les deux n'est revérifié que pour les règles d'état. Pas d'UI (ticket `869fhwtfk`). Seed sans lien d'invitation.

**Corrections de revue (`/code-review`, 2026-10-27)** : `members.remove` déclare `CONFLICT` ; `canRemoveMember`
(règle dédiée, `isLastOwner` partagé) ; `spaceConflict` sorti dans `space-errors.ts`, `MEMBER_SELECT` /
`toMemberOutput` partagés ; matrice de droits complète sur les 9 procédures gardées (sans session, hors Espace, rôle
insuffisant, autorisé) ; horloge injectée pour l'expiration ; test unitaire prouvant la validation avant la garde ;
skill `testing-standards` alignée (base vidée, pas de transaction annulée, raison écrite). Portes OK,
`test:integration` 71/71 (Espaces 56).

**Décisions (utilisateur, 2026-10-27, après revue)** : créateur protégé (`spaces.created_by_id`, effacé quand il part
ou supprime son compte ; `CONFLICT CREATOR`, `isCreator` sur les membres) ; Espace retombé à deux avec un seul
propriétaire : proposition de nommer l'autre, jamais automatique (`suggestsOwnerPromotion`, pour l'UI) ; `FORBIDDEN`
pour une ressource visible mais une action refusée (règle 7, ADR 0014, skills auth et API précisés) ; lien d'Espace
non lié à une adresse (`auth-authorization` §6 précisée) ; bornes 50 / 20 / 7 j gardées. Migration de la PR régénérée
en une seule (`espaces_createur_invitations`) : l'ancienne défaite à la main en local (table et ligne d'historique),
sans `reset`. `test:integration` 73/73 (Espaces 58). Hors périmètre : rattacher un événement à un Espace (aucune
procédure).

**Attendu ensuite** : push + PR sur demande ; UI de gestion des Espaces (`869fhwtfk`).

## 2026-10-26 — Package `mails`, vérification d'adresse, mot de passe oublié (branche `feat/mails`, ticket `869fhwtm6`)

**Fait**

- `packages/mails` : interface `SendMail`, transports Resend et Mailpit en `fetch` (aucun SDK), gabarits
  vérification d'adresse et mot de passe oublié (composants `@react-email/*` rendus par `react-dom/server`, version
  texte écrite), `env.ts` (Mailpit refusé en production). Couleurs : `@planifier/tokens/email`, testées contre
  `tokens.css`.
- Auth : adresse vérifiée avant toute session (le lien ouvre la session, une connexion tentée avant renvoie un lien),
  inscription muette sur un e-mail déjà inscrit, mot de passe oublié (sessions fermées au changement), envoi en
  arrière-plan journalisé sans adresse ni lien. Contrat : `AUTH_PAGES`, routes et codes ; `emailTaken` retiré.
- Web : « Vérifie ta boîte mail » après inscription, « Mot de passe oublié ? », pages `/mot-de-passe-oublie` et
  `/nouveau-mot-de-passe`, lien expiré signalé sur `/connexion`.
- Mailpit v1.32.0 dans `docker-compose.yml` et dans le job CI `e2e` ; E2E sur les vrais e-mails (Mailpit).
- Seed : comptes de démo vérifiés. TS : `jsx: react-jsx` dans la config de base (packages consommés en source).

**Décisions (utilisateur)** : rendu par `react-dom/server`, `fetch` direct, vérification obligatoire, branchement
auth dans cette PR. Composants unitaires `@react-email/*` plutôt que l'agrégat, qui tire `@react-email/render`.

**Vérifié** : `pnpm check-types`, `pnpm lint`, `pnpm test`, `pnpm build`, `format:check` OK ; `test:integration`
15/15 (vérification, renvoi du lien, doublon muet, mot de passe oublié) ; `test:e2e` 24/24 avec Mailpit ; API de
dev : inscription ⇒ e-mail dans Mailpit. **Non vérifié** : Resend réel (pas de domaine), CI, rendu dans un vrai
client mail.

**Ouvert** : revue humaine (auth, e-mails, CI) ; domaine à acheter puis vérifier chez Resend ; changement d'e-mail ;
écart de durée de réponse résiduel à l'inscription (compte neuf écrit en base, pas un doublon).

**Corrections de revue** (décisions de l'utilisateur) : nom retiré de l'e-mail de vérification (hameçonnage) ;
inscription sur une adresse inscrite ⇒ e-mail « Tu as déjà un compte » (connexion, ou nouveau lien si non vérifiée) ;
bac à sable `MAIL_ALLOWED_DOMAINS`. Aussi : `textLinkClassName` (`packages/ui`), `EMAIL_RADII` testés contre
`theme.css`, `EMAIL_LINK_VALIDITY`, corps des routes d'auth typés (`AuthRequestBodies`), `AUTH_PAGES` dans
`constants`, gabarits réduits à leurs données (`actionMail`), journal de Better Auth figé à `warn`.

**Attendu ensuite** : push + PR, vérif Brave (inscription → Mailpit `localhost:8025` → lien), modèle Espace.

**Vérifié le 2026-10-27** (PR #16, CI verte) : portes + `format:check` OK ; `test:integration` 15/15 ; `test:e2e`
24/24. À la main dans Chrome (dev local + Mailpit) : inscription ⇒ « Vérifie ta boîte mail » ⇒ e-mail reçu (HTML
Check Mailpit : 87 % supporté) ⇒ lien ⇒ session ouverte ; mot de passe oublié ⇒ e-mail ⇒ nouveau mot de passe ⇒
connexion OK ; lien rejoué ⇒ « Ce lien n'est plus valable ». Aucune erreur console. **Resend réel** : clé dans
`apps/api/.env.local`, `MAIL_FROM=onboarding@resend.dev` ⇒ e-mail reçu dans Gmail (seule l'adresse du compte
Resend est autorisée sans domaine). PR #16 mergée le 2026-10-27, ticket `869fhwtm6` clos ; gabarit d'invitation
renvoyé au ticket `869fhwtgx`.

**Ouvert (2026-10-27)** : ticket `869fmt5aa` « Domaine d'envoi Resend », bloqué par le nom et le branding ; boucle de rechargement de `/` vue une fois dans Brave en dev (HMR de Next, non reproduite
dans Chrome) ; un 429 sur `account/me/get` fait planter la page (`getCurrentUser` relance tout sauf
`UNAUTHORIZED`), à traiter si ça se reproduit.

**Suites (utilisateur)** : domaine Resend à discuter en session dédiée (`docs/A-DISCUTER-domaine-resend.md`) ;
changement d'e-mail ⇒ ticket `869fmk5dw` ; écart de durée ⇒ dette long terme (`project-context` §7.6) ; `jsx` dans le
commit du package : exception acceptée (config transverse à isoler dans son propre commit à l'avenir).

## 2026-10-26 — Smoke E2E Playwright (branche `feat/e2e-playwright`, ticket `869fkd81n`)

**Fait** : fiche `@playwright/test` ~1.64.1 validée par l'utilisateur (Chromium seul) et installée via `catalog:`.
`apps/web/e2e/` : inscription → accueil → déconnexion → connexion, accueil sans session ⇒ `/connexion`, thème
clair/nuit selon le système ; projets PC et mobile (Pixel 7) ; pas de débordement horizontal. Web construit
(`next start`, ports 3100/3101) + API, base `_test` imposée (Zod), secret Better Auth tiré à chaque run. Tâche turbo
`test:e2e` (après `build`), job CI `e2e` séparé (décision : la fiche validée). Corrections de revue : aucun nouvel
essai, un comportement par test, nuit comparée au token, débordement vérifié sur les trois pages.
Parcours du compte en série (un compte et une connexion par format, session passée par cookies) : un compte par test
déclenchait la limitation de débit de Better Auth. Vitest limité à `src/` dans le web.

**Vérifié** : `pnpm check-types`, `pnpm lint`, `pnpm test`, `pnpm build`, `format:check` OK ; `pnpm test:e2e` sur
`planifier_test` : 18/18 OK, deux fois de suite ; refusé sur `planifier`. **Non vérifié** : CI (rien poussé).

**Ouvert** : revue humaine (CI) ; serveur autonome (`output: standalone`) non testé, attend l'image Docker.

**Attendu ensuite** : push + PR (empilée sur `feat/profil`).

## 2026-10-26 — Décisions sur le profil (branche `feat/profil`)

**Fait** (décisions de l'utilisateur) : changement de mot de passe avec case « Déconnecter mes autres appareils »,
décochée par défaut (contrat : `revokeOtherSessions: boolean`) ; barre du haut des pages connectées (`AppHeader`) avec
un bouton « Profil » à part (`aria-current` sur `/profil`) ; lien provisoire de l'accueil et « Retour » du profil
retirés. `packages/ui` : `Checkbox`, `buttonClassName` (allure de bouton pour un lien). `me.get` du layout racine
gardé tel quel (pas de cookie de thème : une copie à synchroniser de plus). Tests d'intégration du mot de passe dans
leur propre `describe` (limite de longueur de fonction).

**Vérifié** : `pnpm check-types`, `pnpm lint`, `pnpm test`, `pnpm build` OK ; `pnpm test:integration` OK (10 tests API,
dont mot de passe changé sans révoquer, puis avec). Rendu visuel toujours non vu.

**Attendu ensuite** : push des branches par l'utilisateur, PR, vérif Brave.

## 2026-10-26 — Corrections de revue du profil (branche `feat/profil`)

**Fait** : `/update-user` refuse `image` (avatar non géré) ; `themePreferenceSchema` partagé dans `api-contract` ;
`revokeOtherSessions` fixé par le contrat (`.default(true)`), plus par le formulaire ; `getThemePreference` ne
rattrape que les refus d'API et les coupures réseau ; token `--text-control` (15 px) à la place de `text-[15px]`.
**Bug trouvé en passant** : tailwind-merge prenait `text-control` pour une couleur et l'effaçait devant `text-ink` ;
déclaré dans `cn`, testé.

**Vérifié** : `pnpm check-types`, `pnpm lint`, `pnpm test`, `pnpm build` OK ; `pnpm test:integration` OK (avatar
refusé, `avatarUrl` resté nul) ; `.text-control{font-size:15px}` présent dans le CSS construit.

**Ouvert (décisions de l'utilisateur)** : autres sessions toujours fermées au changement de mot de passe, ou au choix ?
Initiale ronde et accès au profil (mobile, PC) ? `me.get` appelé aussi sur `/connexion` par le layout racine : garder ?

## 2026-10-26 — Profil : nom, thème, mot de passe (branche `feat/profil`, ticket `869fhwtf7`, partie 2)

**Fait**

- `ThemePreference` (`SYSTEM`/`LIGHT`/`DARK`) : enum Prisma + miroir `THEME_PREFERENCES` dans `constants` ; migration
  `theme_prefere` (colonne libre recréée, non nulle, défaut `SYSTEM`).
- Auth : `preferredTheme` champ additionnel de Better Auth, validé par Zod ; exposé par la session et `account.me.get`.
- Contrat : `/update-user` (nom + thème) et `/change-password` (actuel exigé, autres sessions toujours fermées) décrits
  dans `api-contract` ; code `INVALID_PASSWORD`.
- Web : page `/profil` (deux formulaires), lien depuis l'accueil, `data-theme` posé par le layout racine (rendu
  serveur, sans éclair). `ChoiceGroup` (radios en pastilles) dans `packages/ui`. Hook `useFormValidation` extrait des
  quatre formulaires (règle des trois).

**Décisions** : tout passe par Better Auth, comme connexion et inscription (pas d'accès base dans `api`). Changement
d'e-mail et suppression de compte hors périmètre (vérification par e-mail, service `owner_left_at`). Thème : en cas
d'API injoignable, le layout racine retombe sur `SYSTEM` plutôt que de casser la page d'erreur.

**Vérifié**

- `pnpm check-types`, `pnpm lint`, `pnpm test`, `pnpm build`, `prettier --check` OK ; `pnpm test:integration` OK
  (9 tests API dont 3 de profil : thème par défaut puis enregistré, thème inconnu et e-mail refusés, mot de passe
  avec l'actuel et révocation des autres sessions).
- `pnpm dev` + curl : `/profil` sans session ⇒ 307 ; avec ⇒ page rendue ; après choix « Nuit » ⇒
  `<html data-theme="dark">` ; `/connexion` sans attribut. Seed relancé après migration.
- **Non vérifié** : rendu visuel (pas de navigateur pilotable).

**Ouvert** : revue humaine (auth, migration, `packages/ui`) ; branche empilée sur `feat/ecrans-connexion` (non poussée,
non mergée) ; `/update-user` accepte `image` sans contrôle (préexistant) ; le conteneur Postgres s'est arrêté seul
pendant les portes (relancé).

**Attendu ensuite** : push des deux branches par l'utilisateur, PR, vérif Brave.

## 2026-10-26 — Vérification des écrans de connexion, PR (branche `feat/ecrans-connexion`)

**Fait** : parcours testés contre `pnpm dev` (base locale migrée et seedée) ; PR ouverte.

**Vérifié**

- HTTP : `/` sans session ⇒ 307 vers `/connexion` ; avec session ⇒ 200 ; `/connexion` avec session ⇒ 307 vers `/`.
- Connexion `alice@example.test` OK ; mauvais mot de passe ⇒ 401 `INVALID_EMAIL_OR_PASSWORD` ; inscription OK ;
  doublon ⇒ 422 `USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL` (codes traduits par `auth-error-message`, testé).
- `pnpm check-types`, `pnpm lint`, `pnpm test`, `pnpm build` OK.
- **Non vérifié** : rendu visuel. Extension Chrome non connectée, Brave headless bloqué par le bac à sable (même sur
  une page vide).

**Ouvert** : vérif visuelle Brave (clair/nuit, mobile) par l'utilisateur ; revue humaine (auth, tokens) ; glossaire
Journal ; l'inscription révèle qu'un e-mail existe (inhérent sans vérification d'e-mail, à revoir avec `mails`).

**Attendu ensuite** : revue + merge (PR #10 incluse), puis profil (`869fhwtf7`, partie 2).

## 2026-10-21 — Maquettes v2 lues, écrans de connexion alignés (branche `feat/ecrans-connexion`)

**Fait**

- Maquettes `Planifier v2 — Phase 1-light/dark.html` déplacées de `newContext/` vers `docs/maquettes/`. Contenu :
  Phase 1 inchangée + module **Journal** (33 écrans par thème) ; aucun écran connexion, inscription ni profil.
- Tokens de couleur identiques à `packages/tokens`. Écarts corrigés : bouton principal en pastille 50 px
  (`--radius-pill` ajouté), champ 48 px à bordure 2 px (accent au focus), libellé gras.
- **Bug corrigé** : Tailwind ne scannait pas `packages/ui` ; les classes de `Button` et `TextField` manquaient du CSS
  construit (boutons et champs sans style). `@source` ajouté dans `globals.css`.
- `ux-design-brief` : sources, contrôles, erreurs, Journal, navigation mobile (barre du bas, maquettée).
  `CONTEXT.md` : section Journal (d'après la maquette, à confirmer).

**Vérifié** : `pnpm check-types`, `pnpm lint`, `pnpm test`, `pnpm build` OK ; classes présentes dans le CSS construit.
Rien vu dans un navigateur.

**Ouvert** : revue humaine (auth, tokens) ; glossaire Journal à valider ; vérif Brave toujours due.

**Attendu ensuite** : vérif Brave, push + PR, puis profil (`869fhwtf7`).

## 2026-10-20 — Écrans de connexion et d'inscription (branche `feat/ecrans-connexion`, ticket `869fhwtf7`, partie 1)

**Fait**

- `packages/ui` : `Button`, `TextField` (libellé, aide, erreur reliés, `aria-invalid`), tests d'interaction + axe-core.
- `@planifier/constants/account` : bornes du nom et du mot de passe, lues par `auth` (Better Auth) et le web.
- `api-contract` : `AUTH_ROUTES`, `AUTH_ERROR_CODES`, schémas d'inscription et de connexion (routes Better Auth).
- `apps/web` : module `account` (formulaires, `fetch` maison dans `queries/`, messages d'erreur, déconnexion) ;
  pages `/connexion`, `/inscription` ; groupe `(app)` réservé aux connectés via `getCurrentUser()` (appel serveur de
  `account.me.get` avec cookie + IP) ; `UNAUTHORIZED` global ⇒ cache vidé, retour à la connexion.
- Seed : `pnpm seed` (racine) = seed `db` puis mots de passe de démo (`auth`, hash Better Auth, `planifier-demo`) ;
  `@planifier/db/seeding` (comptes de démo, base locale gardée).
- Intégration : codes d'erreur du contrat vérifiés contre Better Auth ; inscription en double ⇒ 422 ; suites
  d'intégration sérialisées (`^test:integration`, même base).
- Fiches : jsdom, Testing Library, axe-core (dev) ; dérogations D4 (jsdom 29, Node 24.11) et D5 (licence MPL-2.0).

**Décisions** (utilisateur, 2026-10-20) : profil en PR 2 ; tutoiement chaleureux, jamais familier (`ux-design-brief`) ;
`fetch` maison plutôt que `better-auth/client` ; seed dans `auth` ; jsdom + Testing Library + axe-core ; smoke
Playwright dans un ticket dédié (`869fkd81n`).

**Vérifié** (2026-10-20)

- `pnpm format:check`, `check-types`, `lint`, `test` (102 tests), `build` : OK.
- `test:integration` : auth 1/1 (seed relancé ×2, connexion des 3 comptes), api 6/6.
- `pnpm seed` sur la base locale : OK. `pnpm dev`, parcours HTTP via le proxy : `/` anonyme ⇒ 307 `/connexion` ;
  connexion `alice@example.test` ⇒ 200 ; `/` ⇒ « Bonjour Alice » ; `/connexion` connecté ⇒ 307 `/` ; déconnexion ⇒
  `/` ⇒ 307 `/connexion`. Aucun mot de passe dans les journaux.
- Mutation : sans le focus du premier champ invalide, le test du formulaire échoue.
- **Non vérifié** : rendu dans un navigateur (JS des formulaires, clair/nuit, mobile/PC : pas de Chrome, à voir par
  l'utilisateur dans Brave) ; CI réelle (non poussé) ; contraste mesuré (axe ne le calcule pas en jsdom).

**Ouvert**

- Revue humaine obligatoire : auth (garde serveur, seed de mots de passe), `turbo.json`, dépendances, dérogation D5.
- Énumération des comptes : l'inscription dit « un compte existe déjà » (sans e-mail de vérification, inévitable ;
  à revoir avec `mails`, `requireEmailVerification` rend une réponse générique).
- Chaque rendu d'une page `(app)` appelle `me` : compté dans la limite 120/min/IP des plans.
- Pas de redirection vers la page demandée après connexion (évite une redirection ouverte ; à concevoir si utile).
- Pas de maquette pour ces écrans : composition déduite du brief.

**Corrections de revue** (`/code-review`, même jour, validées par l'utilisateur)

- Règle des trois : `AuthErrorAlert` (atome), `useSessionRedirect`, aide de test `@planifier/ui/testing/axe`.
- `REQUEST_ID_HEADER` dans `constants/http` (web, proxy, API) ; `AUTH_BASE_PATH` dans le test d'intégration.
- `AuthRequestError` dans son fichier ; `forms/invalid-fields.ts` → `utils/form-validation.ts` ; raison du `fetch`
  direct écrite dans `auth.queries.ts` ; note `tsx` (seed d'`auth`) dans `DEPENDANCES.md`.
- `app/error.tsx` : API injoignable au rendu ⇒ message + « Réessayer » (au lieu de la page par défaut de Next).
- Liens connexion ↔ inscription : cible 44 px.
- Non repris de l'ancien formulaire, à décider : afficher le mot de passe, confirmation du mot de passe à
  l'inscription, parcours d'invitation (`inviteToken`, e-mail pré-rempli ; attend le module Événements).
- Non retenu : double garde layout/page (la page a besoin de `user`, `cache` évite le second appel) ; alias
  `InvalidFields` ; `handleSubmit` dupliqué deux fois (règle des trois) ; pas de token d'erreur distinct (ticket design
  system) ; contraste non mesuré (E2E navigateur).

**Attendu ensuite**

- Vérif visuelle par l'utilisateur dans Brave (non faite), puis push et PR (sur demande).
- Deux nouveaux fichiers de maquettes annoncés par l'utilisateur (pas encore dans `docs/maquettes/`) : à lire avant
  la partie 2, écarts avec ces écrans à corriger.
- PR 2 du ticket `869fhwtf7` : profil (nom, mot de passe, thème) ; e-mail après `mails`.
- Ticket E2E Playwright `869fkd81n`.

## 2026-10-20 — Authentification Better Auth (branche `feat/auth`, ticket `869fhwtf2`)

**Fait**

- `packages/auth` : Better Auth 1.7.10 (adaptateur Prisma, e-mail + mot de passe, cookie httpOnly `planifier.*`,
  `Secure` en prod, télémétrie coupée, contrôle d'origine forcé, limitation de débit en mémoire), `env.ts` (secret
  ≥ 32 car., non trivial et https en prod), `getSessionUser`, gestionnaire Node.
- `db` : tables `sessions`, `accounts`, `verifications` ; `User.name` obligatoire (remplissage depuis l'e-mail),
  `email_verified`, `modules` par défaut vide ; migration unique `auth_better_auth`. `server-only` retiré de `db`.
- `api` : `userGuard` / `userProcedure` (débit puis session, `UNAUTHORIZED` sinon), débit 120/min/IP sur les plans,
  route protégée `account.me.get` (liste blanche). Contexte : `clientIp`, `getSessionUser` injectés.
- `apps/api` : `/api/auth/*` → Better Auth ; IP lue dans `x-planifier-client-ip`.
- `apps/web` : proxy `/api/auth/*` ; IP = entrée la plus à droite de `x-forwarded-for`, posée dans
  `x-planifier-client-ip` ; en-têtes relayés : + `origin`, `referer`, `sec-fetch-*`, `user-agent`.
- `@planifier/constants/http` (`AUTH_BASE_PATH`, `CLIENT_IP_HEADER`) ; tâche `test:integration` (Turbo, CI après les
  migrations) ; ADR 0016 ; fiche `better-auth` ; READMEs, `project-context`, `workspace-architecture`, `.env.example`.

**Décisions** (utilisateur, 2026-10-20) : `server-only` retiré de `db` ; `name` obligatoire, `image` ↔ `avatarUrl`,
`emailVerified` ajouté ; pas de vérification d'e-mail (attend `mails`) ; débit en mémoire + relais d'IP assaini.

**Vérifié** (2026-10-20)

- `pnpm format:check`, `check-types`, `lint`, `test` (70 tests), `build` : OK.
- `pnpm test:integration` (4 tests, base réelle) : inscription (e-mail ramené en minuscules, cookie HttpOnly),
  `me`, déconnexion ⇒ `UNAUTHORIZED`, reconnexion, mauvais mot de passe ⇒ 401 sans session, 4ᵉ essai ⇒ 429 (autre IP
  libre), origine étrangère ⇒ 403.
- Base neuve : migrations, aucune dérive, seed ×2 ; remplissage de `name` testé sur une ligne sans nom.
- Local via le proxy web (`next dev` + API) : flux complet OK ; `x-planifier-client-ip` envoyé par le client ignoré
  (429 au 4ᵉ essai) ; origine étrangère ⇒ 403 `INVALID_ORIGIN` ; aucun mot de passe ni jeton dans les journaux.
- `pnpm audit --prod` : 4 alertes (mysql2 et deepmerge-ts via prisma, braces via next) **déjà présentes sur master**.
- **Non testé** : UI (aucun écran de connexion dans cette PR) ; CI réelle (non poussé) ; derrière un vrai relais.

**Ouvert**

- Revue humaine obligatoire : auth, nouvelle route publique `/api/auth/*`, CI, migration, ADR 0016.
- IP fiable seulement si un relais de l'hébergeur ajoute `x-forwarded-for` devant le web (sinon falsifiable).
- Débit en mémoire ⇒ une seule instance d'API. Pas de limite de corps sur `/api/auth/*` côté API (le proxy borne à 1 Mo).
- Base locale `planifier` toujours en dérive (init modifiée) : `docker compose down -v` puis `migrate:deploy` + seed.
- Comptes du seed sans mot de passe : connexion impossible avec eux (à traiter avec les écrans de connexion).

**Corrections de revue** (`/code-review`, même jour, décisions de l'utilisateur)

- Nom affiché validé à chaque écriture (`parseDisplayName` + `databaseHooks`) : `""` ou espaces ⇒ 400, rien n'est créé.
- Production : requête sans IP valide posée par le proxy ⇒ 400 (plus de compteur `unknown` partagé).
- `SessionUser` dérivé de Prisma (`Pick<User, …>`, type `User` exporté par `db`) ; constantes de débit et préfixe de
  cookie importés dans les tests ; `clientIpOf` renommés (`lastHopIpOf` côté web, `proxiedClientIpOf` côté API).
- Renommage `rpc-target` → `api-target` isolé dans son propre commit.
- Vérifié : portes OK (77 tests) ; `test:integration` 5/5 sur base neuve, aucune ligne restante ; test du nom vide
  rouge sans la validation (mutation), vert avec.
- Non retenu : façades `createAuthNodeHandler`/`parseAuthEnv` gardées (évitent d'importer `better-auth` dans
  `apps/api`) ; câblage auth dupliqué deux fois (règle des trois).

**Principe « produit neuf, code propre »** (décision de l'utilisateur, même jour)

- Règle 16 d'`AGENTS.md` : aucune concession à l'existant ; une dérogation seulement face à une contrainte externe ;
  une règle mal calibrée se corrige à la source.
- Aucune reprise des comptes de l'ancienne app (amendement d'ADR 0004 ; skills `auth-authorization` et
  `database-prisma` alignés). Ticket bcrypt `869fhwtf4` devenu sans objet (à fermer dans ClickUp par l'utilisateur).
- Migration `auth_better_auth` sans remplissage de `name` ; dérogations D4/D5 retirées. `database-prisma` précise :
  expand/contract dès qu'une version tourne sur un environnement partagé, pas avant la première mise en ligne.
- Tests d'intégration : base locale dédiée en `_test`, vidée avant le fichier (`resetTestDatabase`, export
  `@planifier/db/testing`, SQL constant) ; garde `assertTestDatabase` (hôte local + suffixe `_test`), garde du seed
  généralisée (`assertLocalDatabase`). CI sur `planifier_test`. `testing-standards` complété (parcours HTTP).
- Vérifié : `test:integration` 5/5 deux fois de suite sur `planifier_test` ; refusé sur `planifier` (base de dev).

**Merge** : PR #9 mergée le 2026-10-20 ; CI `verify` verte (migrations, dérive, seed, tests d'intégration compris).

**Seconde revue (règle 16), corrections**

- IP posée par le proxy obligatoire dans tous les environnements (400 sinon) : `clientIp: string`, plus de compteur
  `unknown` ni de branche `NODE_ENV`. Limiteur injecté par le serveur dans le contexte (`consumeRateLimit`), un par
  instance ; tests sans état partagé.
- `createTestDatabase()` : garde et client sur la même URL (remplace `resetTestDatabase`).
- `apps/api` : `vitest.config.ts` à deux projets (`unit`, `integration`) au lieu de filtres par chaîne.
- Règles alignées : `AGENTS.md` règle 9, `database-prisma` (import `auth`), `runtime-configuration` (`server-only`
  réservé au web) ; `.env.example` (`DATABASE_URL` de l'API) ; dette n°4 avec réexamen.
- Non retenu : `SessionUser` reste dans `auth` (dépendance `api` → `auth` permise, import de type seul, un seul
  endroit qui le dérive de Prisma).

**Attendu ensuite** : voir `docs/SUITE.md`.

---

## 2026-10-18 — Contrats et API oRPC (branche `feat/api-orpc`, ticket `869fhwtcj`)

**Fait**

- `packages/api-contract` : contrat `system.health.get` (`.input()` strict vide, `.output()` `{ status: "ok" }`), type
  `ApiClient`. Lint : aucune dépendance serveur.
- `packages/api` : `implement(contract)`, plan public (`publicGuard`, `publicProcedure`), routeur, test qui parcourt le
  routeur et échoue si une procédure ne commence pas par une garde de plan.
- `apps/api` (`@planifier/api-server`) : `http.createServer` + `@orpc/server/node` sous `/rpc`, 404 ailleurs, corps
  limité à 1 Mo, journal JSON par requête (chemin sans query), `x-request-id`, arrêt propre. `node --import tsx`.
- `apps/web` : proxy `/rpc/[...path]` vers `API_INTERNAL_URL` (lue à la requête, en-têtes en liste blanche, 502 si API
  injoignable), client oRPC + TanStack Query, `features/_shared/queries/health.queries.ts`, statut affiché sur l'accueil.
- Lint : le web entier (plus seulement `features/`) interdit `db`, `api`, `auth`, `mails`, `@orpc/server`.
- ADR 0015 ; fiches oRPC 1.15.7 et `@tanstack/react-query` 5.104.3 validées et installées ; READMEs ; `.env.example`.
- Ticket auth `869fhwtf2` : décisions en commentaire ClickUp, dépendance « en attente de `869fhwtcj` ».

**Décisions** (utilisateur) : API avant auth ; Node natif, pas de Hono ; proxy même origine ; tsx à l'exécution, pas de
bundle ; découpage `api-contract` + `api` + `apps/api`. Auth : sans plugin d'organisations, `better-auth@~1.7.10`, hash
des jetons et suppression de compte hors PR.

**Vérifié** (2026-10-18)

- `pnpm format:check`, `pnpm check-types`, `pnpm lint`, `pnpm test` (38 tests), `pnpm build` : OK.
- Mutation : procédure sans garde ⇒ le test des gardes échoue.
- Local, `next start` + API : POST via le proxy ⇒ `{"status":"ok"}` ; entrée hors contrat ⇒ 400 ; route inconnue ⇒ 404 ;
  API arrêtée ⇒ 502 ; page servie avec l'état de chargement.
- `pnpm dev` avec `API_INTERNAL_URL` : « API joignable. » affiché dans le navigateur (vérifié par l'utilisateur, Brave).

**Ouvert**

- Revue humaine : nouvelle route publique (proxy), lint, ADR.
- `server-only` (importé par `db`) lève une erreur hors condition `react-server` : `apps/api` ne pourra pas importer
  `db` tel quel (à régler au premier service qui lit la base).
- Limitation de débit du plan public absente (prévue avec l'auth). Pas de Dockerfile pour `apps/api` (`869fhwtcc`).

**Corrections de revue** (`/code-review`, même jour)

- API : cible mal formée ⇒ 400 au lieu d'un plantage du processus ; rejet du routeur rattrapé (500) ; journal sur
  `close` (requêtes abandonnées incluses) ; arrêt forcé après 10 s ; `NODE_ENV` obligatoire.
- Proxy web : segments `.`/`..` refusés (404, plus de sortie du préfixe `/rpc`) ; corps limité à 1 Mo en lecture (413) ;
  délai de 15 s limité à l'attente des en-têtes.
- Lint : `SERVER_PACKAGES` partagé (`base.js`) entre le web et `api-contract`. Vitest ajouté au web (fiche existante).
- Reporté au ticket auth (commentaire ClickUp) : relayer l'IP du client pour la limitation de débit.
- Vérifié : portes OK (51 tests), test de cible mal formée qui échoue sur l'ancien code ; en local via `pnpm dev` :
  `..` ⇒ 404, 2 Mo ⇒ 413, cible `http://[` ⇒ 400 et API toujours debout, `SIGTERM` ⇒ sortie 0, démarrage sans
  `NODE_ENV` refusé.

**Principe « produit neuf, code propre »** (décision de l'utilisateur, même jour)

- Règle 16 d'`AGENTS.md` : aucune concession à l'existant ; une dérogation seulement face à une contrainte externe ;
  une règle mal calibrée se corrige à la source.
- Aucune reprise des comptes de l'ancienne app (amendement d'ADR 0004 ; skills `auth-authorization` et
  `database-prisma` alignés). Ticket bcrypt `869fhwtf4` devenu sans objet (à fermer dans ClickUp par l'utilisateur).
- Migration `auth_better_auth` sans remplissage de `name` ; dérogations D4/D5 retirées. `database-prisma` précise :
  expand/contract dès qu'une version tourne sur un environnement partagé, pas avant la première mise en ligne.
- Tests d'intégration : base locale dédiée en `_test`, vidée avant le fichier (`resetTestDatabase`, export
  `@planifier/db/testing`, SQL constant) ; garde `assertTestDatabase` (hôte local + suffixe `_test`), garde du seed
  généralisée (`assertLocalDatabase`). CI sur `planifier_test`. `testing-standards` complété (parcours HTTP).
- Vérifié : `test:integration` 5/5 deux fois de suite sur `planifier_test` ; refusé sur `planifier` (base de dev).

**Seconde revue (règle 16), corrections**

- IP posée par le proxy obligatoire dans tous les environnements (400 sinon) : `clientIp: string`, plus de compteur
  `unknown` ni de branche `NODE_ENV`. Limiteur injecté par le serveur dans le contexte (`consumeRateLimit`), un par
  instance ; tests sans état partagé.
- `createTestDatabase()` : garde et client sur la même URL (remplace `resetTestDatabase`).
- `apps/api` : `vitest.config.ts` à deux projets (`unit`, `integration`) au lieu de filtres par chaîne.
- Règles alignées : `AGENTS.md` règle 9, `database-prisma` (import `auth`), `runtime-configuration` (`server-only`
  réservé au web) ; `.env.example` (`DATABASE_URL` de l'API) ; dette n°4 avec réexamen.
- Non retenu : `SessionUser` reste dans `auth` (dépendance `api` → `auth` permise, import de type seul, un seul
  endroit qui le dérive de Prisma).

**Attendu ensuite** : voir `docs/SUITE.md`.

---

## 2026-10-18 — Nettoyage, commentaires, visibilité d'Espace, CI (branches `chore/nettoyage-depot`, `chore/commentaires`, `feat/db-visibilite-espace`, `chore/ci-github-actions`)

**Fait**

- Nettoyage : `newContext/` allégé (doublon de `CONTEXT.md`, ADR déjà éclatés, tickets 00/01/02 déjà dans ClickUp) ;
  maquette déplacée dans `docs/maquettes/phase-1.html` (skill `ux-design-brief` et `.prettierignore` mis à jour).
- Commentaires aux endroits non évidents (seed, `env.ts`, `next.config.ts`, droits).
- Migration `visibilite_espace` : colonne `spaces.restrict_visibility` (booléen, défaut `false`), additive.
- CI `.github/workflows/ci.yml` : format, types, lint, tests, build, migrations sur base vide, dérive, seed. Actions épinglées
  par SHA (fiche dans `docs/DEPENDANCES.md`).
- Tickets fermés dans ClickUp : TypeScript strict + ESLint (`869fhwtc5`).

**Décisions**

- Partage par ressource (NONE/READ/WRITE) **pas modélisé** : aucun modèle liste ni agenda n'existe encore, une table
  polymorphe sans clé étrangère serait fragile. Il viendra avec les modèles Todo et Agenda.
- Visibilité d'Espace = un booléen pour tout l'Espace (granularité par module ou par membre non décidée).
- CI : pas de construction d'images Docker (aucun Dockerfile ; ticket Docker `869fhwtcc`).

**Vérifié** (2026-10-18)

- Chaque branche : `pnpm check-types`, `pnpm lint`, `pnpm test`, `pnpm build` OK, sauf `chore/nettoyage-depot` (seulement
  `format:check`, suppressions et déplacement) et `feat/db-visibilite-espace` (tout OK).
- Migration : appliquée sur base temporaire, pas de dérive, seed lancé deux fois sans erreur.
- CI : YAML valide ; étapes migrations, dérive et seed rejouées en local sur une base vide. **Le workflow n'a pas tourné
  sur GitHub.**

**Ouvert**

- Revue humaine : droits (PR #3), CI, migration.
- Base locale existante : lancer `pnpm --filter @planifier/db migrate:deploy` (colonne `restrict_visibility`).
- Après un changement de branche touchant le schéma : `pnpm --filter @planifier/db generate` (client Prisma gitignored).

**Principe « produit neuf, code propre »** (décision de l'utilisateur, même jour)

- Règle 16 d'`AGENTS.md` : aucune concession à l'existant ; une dérogation seulement face à une contrainte externe ;
  une règle mal calibrée se corrige à la source.
- Aucune reprise des comptes de l'ancienne app (amendement d'ADR 0004 ; skills `auth-authorization` et
  `database-prisma` alignés). Ticket bcrypt `869fhwtf4` devenu sans objet (à fermer dans ClickUp par l'utilisateur).
- Migration `auth_better_auth` sans remplissage de `name` ; dérogations D4/D5 retirées. `database-prisma` précise :
  expand/contract dès qu'une version tourne sur un environnement partagé, pas avant la première mise en ligne.
- Tests d'intégration : base locale dédiée en `_test`, vidée avant le fichier (`resetTestDatabase`, export
  `@planifier/db/testing`, SQL constant) ; garde `assertTestDatabase` (hôte local + suffixe `_test`), garde du seed
  généralisée (`assertLocalDatabase`). CI sur `planifier_test`. `testing-standards` complété (parcours HTTP).
- Vérifié : `test:integration` 5/5 deux fois de suite sur `planifier_test` ; refusé sur `planifier` (base de dev).

**Seconde revue (règle 16), corrections**

- IP posée par le proxy obligatoire dans tous les environnements (400 sinon) : `clientIp: string`, plus de compteur
  `unknown` ni de branche `NODE_ENV`. Limiteur injecté par le serveur dans le contexte (`consumeRateLimit`), un par
  instance ; tests sans état partagé.
- `createTestDatabase()` : garde et client sur la même URL (remplace `resetTestDatabase`).
- `apps/api` : `vitest.config.ts` à deux projets (`unit`, `integration`) au lieu de filtres par chaîne.
- Règles alignées : `AGENTS.md` règle 9, `database-prisma` (import `auth`), `runtime-configuration` (`server-only`
  réservé au web) ; `.env.example` (`DATABASE_URL` de l'API) ; dette n°4 avec réexamen.
- Non retenu : `SessionUser` reste dans `auth` (dépendance `api` → `auth` permise, import de type seul, un seul
  endroit qui le dérive de Prisma).

**Attendu ensuite** : voir `docs/SUITE.md`.

---

## 2026-10-18 — Package `domain-access` (branche `feat/domain-access`)

**Fait** : `packages/domain-access` (`resource.ts`, `event.ts`, README) : droits purs sur ressource (propriétaire, Espace,
partage direct) et sur événement (OWNER, ORGANIZER, GUEST, reprise de propriété). 23 tests Vitest.
**Décisions** (utilisateur) : membre d'Espace en lecture, écriture sur liste partagée ; suppression par le propriétaire
ou le propriétaire d'Espace ; matrice d'événement OK telle quelle (ORGANIZER n'est pas autorisé à désactiver une brique).
Ajout : le propriétaire d'Espace ne supprime que ce qu'il voit.
**Vérifié** : `pnpm check-types`, `pnpm lint`, `pnpm test` (33 tests), `pnpm build` ; mutations du code : 9 tests échouent.
**Ouvert** : revue humaine (droits). Champ de visibilité de l'Espace absent du schéma : `spaceLevel` est fourni par
l'appelant, le champ viendra avec une migration. Pas de partage par ressource en base (NONE/READ/WRITE) : à modéliser.
**Principe « produit neuf, code propre »** (décision de l'utilisateur, même jour)

- Règle 16 d'`AGENTS.md` : aucune concession à l'existant ; une dérogation seulement face à une contrainte externe ;
  une règle mal calibrée se corrige à la source.
- Aucune reprise des comptes de l'ancienne app (amendement d'ADR 0004 ; skills `auth-authorization` et
  `database-prisma` alignés). Ticket bcrypt `869fhwtf4` devenu sans objet (à fermer dans ClickUp par l'utilisateur).
- Migration `auth_better_auth` sans remplissage de `name` ; dérogations D4/D5 retirées. `database-prisma` précise :
  expand/contract dès qu'une version tourne sur un environnement partagé, pas avant la première mise en ligne.
- Tests d'intégration : base locale dédiée en `_test`, vidée avant le fichier (`resetTestDatabase`, export
  `@planifier/db/testing`, SQL constant) ; garde `assertTestDatabase` (hôte local + suffixe `_test`), garde du seed
  généralisée (`assertLocalDatabase`). CI sur `planifier_test`. `testing-standards` complété (parcours HTTP).
- Vérifié : `test:integration` 5/5 deux fois de suite sur `planifier_test` ; refusé sur `planifier` (base de dev).

**Seconde revue (règle 16), corrections**

- IP posée par le proxy obligatoire dans tous les environnements (400 sinon) : `clientIp: string`, plus de compteur
  `unknown` ni de branche `NODE_ENV`. Limiteur injecté par le serveur dans le contexte (`consumeRateLimit`), un par
  instance ; tests sans état partagé.
- `createTestDatabase()` : garde et client sur la même URL (remplace `resetTestDatabase`).
- `apps/api` : `vitest.config.ts` à deux projets (`unit`, `integration`) au lieu de filtres par chaîne.
- Règles alignées : `AGENTS.md` règle 9, `database-prisma` (import `auth`), `runtime-configuration` (`server-only`
  réservé au web) ; `.env.example` (`DATABASE_URL` de l'API) ; dette n°4 avec réexamen.
- Non retenu : `SessionUser` reste dans `auth` (dépendance `api` → `auth` permise, import de type seul, un seul
  endroit qui le dérive de Prisma).

**Attendu ensuite** : voir `docs/SUITE.md`.

---

## 2026-10-18 — Tests Vitest sur `db` (branche `feat/tests-vitest`)

**Fait** : `vitest@~5.0.4` (fiche validée par l'utilisateur) au `catalog:` et dans `db` ; script `test` ; tests de
`getDbEnv` (4) et `assertSeedAllowed` (6). Ticket TypeScript strict + ESLint fermé dans ClickUp (déjà livré).
**Décisions** : 5.0.4 et non 5.0.5 (sous `minimumReleaseAge`). `getCliDatabaseUrl` non testée (lit `.env.local` du
dossier courant).
**Vérifié** : `pnpm check-types`, `pnpm lint`, `pnpm test` (10 tests OK), `pnpm build` : OK, exécutés le 2026-10-18.
**Ouvert** : rien commité ni poussé. Tests du seed sur vraie base : avec la CI.
**Attendu ensuite** : voir `docs/SUITE.md`.

---

## 2026-10-17 — Corrections de revue du package `db` (branche `feat/package-db`)

**Fait**

- Alerte GitGuardian « Generic Password » (`docker-compose.yml`, commit `16ed327`) : faux positif, identifiants de dev
  locaux. Aucun secret réel dans l'historique (recherche par motifs ; ni `gitleaks` ni `trufflehog` installés).
- `docker-compose.yml` : PostgreSQL publié sur `127.0.0.1:5433` seulement (plus sur toutes les interfaces).
- Seed : garde `assertSeedAllowed` (`seed/guard.ts`) — refus si l'hôte n'est pas local, en plus de `NODE_ENV=production`.
- `turbo.json` : `dev` dépend de `@planifier/db#generate` (clone neuf).
- Client : singleton sur `globalThis` (rechargement à chaud de `next dev`).
- CLI Prisma : plus d'URL factice ni de chemin `node_modules/prisma/build` ; `prisma.config.ts` lit `.env.local` via
  `getCliDatabaseUrl()` (`src/env.ts`), l'URL est optionnelle pour `generate`/`validate`/`format`.
- Schéma : index `events(start_date)`, `events(space_id, start_date)`, `invites(inviter_id)`, `invites(user_id)`,
  `proposed_invites(proposer_id)`, `notifications(event_id)`, `notifications(user_id, is_read, created_at)`,
  `friendships(friend_id)` (remplace `friendships(user_id)`, couvert par l'unique).
- E-mails en minuscules : contraintes `CHECK` ajoutées à la main dans la migration (`users`, `invites`, `proposed_invites`).
- Seed : l'événement personnel a son participant OWNER et ses réglages, comme un événement créé par le service.
- Migration `init` régénérée (jamais déployée) : toujours une seule migration dans la PR.

**Décisions**

- Pas de `citext` : les extensions sont expérimentales dans la config Prisma 7 ; la contrainte `CHECK` donne la même
  garantie sans extension.
- `Event.ownerId` nullable, `onDelete: SetNull`, avec `ownerLeftAt` (décision de l'utilisateur) : le propriétaire qui
  supprime son compte laisse l'événement aux participants ; un co-organisateur peut reprendre la propriété, sans
  obligation ; sans repreneur sous 48 h, un job planifié supprime l'événement. Contrainte `CHECK` écrite à la main :
  `owner_id` null impose `owner_left_at`, sinon la suppression du compte échoue. Skill `database-prisma` aligné
  (`ownerId` non nul sauf exception documentée).
- Hash des jetons d'invitation (`Invite.token` en clair) : reporté au ticket `auth`, décision de l'utilisateur.
- `Event.space` passe en `onDelete: SetNull` (décision de l'utilisateur) : supprimer un Espace ne détruit rien, ses
  événements deviennent personnels pour leur propriétaire et les participants gardent leur accès. Vérifié sur une base
  temporaire.
- Visibilité par défaut (décision de l'utilisateur, `CONTEXT.md`) : un membre d'Espace voit tous les éléments de
  l'Espace ; elle se restreint dans les paramètres de l'Espace (champ à ajouter avec `domain-access`).
- Scripts d'installation de `prisma`, `@prisma/engines` et `esbuild` autorisés (`onlyBuiltDependencies`).

**Vérifié** (exécuté le 2026-10-17, relancé le 2026-10-18 après `SetNull`)

- `pnpm check-types`, `pnpm lint`, `pnpm test`, `pnpm build`, `prettier --check` : OK. `pnpm test` ne teste toujours rien.
- Base locale neuve : `migrate deploy` OK, `migrate diff --exit-code` sans dérive, seed lancé deux fois sans doublon,
  insertion d'un e-mail en majuscules refusée par la contrainte, seed refusé sur une URL Neon fictive.
- `turbo run dev --dry` : chaque `dev` dépend bien de `@planifier/db#generate`.
- Base temporaire : Espace supprimé ⇒ événements personnels, participants conservés ; compte supprimé sans
  `owner_left_at` ⇒ refusé par la contrainte ; avec ⇒ événements gardés sans propriétaire, autres participants conservés.
- **Non testé** : `pnpm dev` réellement lancé ; Windows ; un vrai Neon.

**Ouvert**

- Alerte GitGuardian à classer en faux positif (action de l'utilisateur) pour que le check passe.
- Revues humaines de l'entrée précédente toujours dues ; s'y ajoutent les contraintes `CHECK` écrites à la main et
  l'exception à la skill `database-prisma`.
- Événement personnel d'un compte supprimé : il resterait sans participant pendant 48 h ; le service de suppression
  de compte devrait le supprimer tout de suite (à trancher dans `auth`).
- Base locale existante : migration `init` modifiée après application, à recréer (`docker compose down -v`).

**Attendu ensuite**

- Classer l'alerte, revue humaine, puis merge.
- Ticket `auth` : hash des jetons d'invitation, service de suppression de compte (renseigne `owner_left_at`),
  normalisation des e-mails (Zod).
- Ticket jobs planifiés (ADR 0007) : suppression des événements sans repreneur 48 h après `owner_left_at`.
- Ticket `domain-access` : droits, dont la reprise de propriété par un co-organisateur et la visibilité de l'Espace.

## 2026-10-17 — Package `db` : schéma Prisma 7, migration, seed (branche `feat/package-db`)

**Fait**

- `packages/db` : schéma Prisma 7 (modèles de l'ancien `back/` + Espace, membres, rôles, modules activés ;
  `spaceId` nullable sur `Event`), migration unique `init`, client `getDb()` (singleton, `server-only`), `env.ts` (Zod),
  seed idempotent en trois modules (`users`, `spaces`, `events`), refusé si `NODE_ENV=production`.
- Neon : deux URL, `DATABASE_URL` (poolée, client et seed) et `DATABASE_URL_UNPOOLED` (directe, CLI Prisma).
- `docker-compose.yml` : PostgreSQL 17 local, port hôte **5433** (le 5432 est pris par un autre projet de la machine).
- Turborepo : tâche `generate` (client Prisma), dont dépendent `build`, `lint`, `check-types` et `test`.
- Fiches de dépendances (`prisma`, `@prisma/client`, `@prisma/adapter-pg`, `tsx`) validées, installées via `catalog:`.
- `back/` et `front/` non touchés.

**Décisions**

- Prisma épinglé `~7.10.0`, pas 7.10.1 (publiée le 2026-10-15, sous le seuil `minimumReleaseAge`).
- **Aucune génération Zod depuis Prisma, pas de package `db-types`** : `zod-prisma-types` produisait un fichier
  inutilisable avec Prisma 7 (chemin faux, import du client Prisma), un générateur maison aurait été du code à
  maintenir. Les DTO de l'API s'écrivent à la main dans `api-contract` ; les enums viennent de `@planifier/constants`.
  Skills `project-context`, `typescript-strictness` et `workspace-architecture` alignés.
- Pas de helper `upsertById` dans le seed : le typer sans `as` coûte plus que la répétition.
- Tables Better Auth (`Session`, `Account`, `Verification`) : dans le ticket `auth`, pas ici.

**Vérifié** (exécuté le 2026-10-15, relancé avant le commit)

- `pnpm check-types`, `pnpm lint`, `pnpm build` : OK. `pnpm test` : OK **mais rien n'est testé** (aucun package n'a de
  script `test`). `prettier --check` : OK.
- Migration appliquée sur une base vide, absence de dérive schéma/migration, seed lancé deux fois sans doublon.
- **Non testé** : connexion à un vrai Neon (pas d'accès aux environnements partagés) ; aucun test automatisé de la base.

**Ouvert**

- Revue humaine obligatoire avant merge : `turbo.json` (outillage), trois skills modifiés, abandon de `db-types`.
- Les scripts `generate`, `validate` et `format` passent une URL factice (`DATABASE_URL_UNPOOLED=postgresql://unused@…`) :
  documenté, mais c'est un contournement.
- `preferredTheme` et `color` sont des chaînes libres : à fermer (liste dans `constants`) si l'ensemble est stable.
- Le SQL de la migration `init` (267 lignes) est à relire en revue.

**Attendu ensuite**

- Push de la branche puis revue humaine (le push du 2026-10-15 avait échoué : accès SSH à `origin`).
- Ticket « Tests » : fiche Vitest à valider, puis tests du seed et de `getDbEnv` ; ajouter un script `test` à `db`.
- Ticket « CI » : appliquer les migrations sur une base vide, prouver l'absence de dérive, puis seed (procédure déjà
  validée à la main).
- Tickets suivants du kit : `auth` (tables Better Auth, migration des hashs bcrypt), `domain-access` (droits purs),
  `api-contract` puis `api`. Ordre à confirmer.
