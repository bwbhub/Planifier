# Suite

À écraser en fin de session. Sources de vérité : règles (`AGENTS.md`, skills), tickets ClickUp, code. Le reste : demander.

## 1. À faire par l'utilisateur

- **Appliquer la migration** `20261105230000_modules_utilisateur` sur la base locale (`pnpm --filter @planifier/db migrate:deploy`),
  puis `pnpm seed` si besoin. Sans elle, les comptes existants n'ont aucun module (navigation vide).
- **Voir à l'œil** (`pnpm dev`) : navigation (panneau latéral PC, barre basse mobile 375 px), `/profil` (section
  Modules), `/composants` ; clair et nuit. Rien de ceci n'a été vu dans un navigateur.
- **Tester le Todo** : `alice@example.test` / `planifier-demo` → « Ouvrir mes listes ». Listes perso et partagées,
  tâches, sous-tâches, récurrence, « Cochée par » ; clair et nuit ; mobile et PC.
- Revue humaine : droits des listes et de l'agenda (voir §4) ; migration des modules et `account.me.setModules`.
- **Domaine** Resend : à discuter en session dédiée (`docs/A-DISCUTER-domaine-resend.md`) ; sans lui, aucun e-mail réel.
- **Git** : supprimer les branches distantes fusionnées (refusé par l'auto mode, à faire à la main ou à autoriser).
  Branches locales gardées, non fusionnées : `backup/espaces-ui-avant-redecoupage`, `feat/e2e-playwright` (2 commits
  locaux), `feat/premier-espace`, `feat/profil` : à regarder avant de les supprimer.
- **Barre d'état** du contexte posée (`~/.claude/statusline-context.sh`, orange dès 40 %). Champ lu :
  `context_window.used_percentage`, non confirmé par la doc : si elle affiche `ctx --`, corriger le champ.

## 2. Prochain ticket

État au 2026-11-05 : `master` contient l'Agenda complet (entrées, participants, déplacement), les composants de base
(`869fhwtg1`) et la navigation par modules (`869fhwtg4`, PR #34). Les deux tickets restent ouverts dans ClickUp
(commentés) : revue visuelle d'abord. Piège vu 3 fois : une PR empilée fusionnée dans sa branche de base **après**
la fusion de la base dans `master` laisse ses commits hors de `master`. Fusionner de bas en haut en changeant la base
de la suivante vers `master`, ou viser `master` directement.

Priorités ClickUp (urgent d'abord) : `869fhwtg4` (reste : bouton « + », pastille de non-lus, carte, entrées sans
écran), `869fhwtg1` (clore après revue visuelle), `869fhwtce` (db : reste la migration sur une vraie branche Neon,
avec `869fhwtv0`). Puis, en high : Aujourd'hui (`869fhwtu9`, la navigation est prête), composants de retour
(`869fp54cr`), composants de domaine partagés (`869fhwtg9`), Nouvelle tâche (`869fhwtr3`, donne le « + »), Détail de
tâche (`869fp54d9`), puis iCal (`869fjgrcc`, `869fhwtup`). Changement d'e-mail (`869fmk5dw`) : rapide, à glisser.

## 3. Ensuite

1. Module Événements, avec la liste d'événement (fin du Todo). Gabarit d'invitation (ancien `emailService`) : avec lui.
2. Hors PR : hash des jetons d'invitation, service de suppression de compte (`owner_left_at`).
3. Pas prévu à court terme (décision du 2026-11-02) : jobs planifiés (`869fjgrcd`), Docker (`869fhwtcc`). Sans cron,
   rappels, relances, notification de présence et rafraîchissement iCal n'ont rien pour se déclencher. Docker : vérifier
   si Next garde un `x-forwarded-for` envoyé par le navigateur (IP choisie par le client ⇒ limitation de débit
   contournable).

## 4. Questions ouvertes pour l'utilisateur

- `newContext/Decisions techniques.md` : supprimer ?
- Granularité de la visibilité d'Espace ; suppression par le propriétaire d'Espace limitée à ce qu'il voit : à confirmer.
- Hébergeur : son relais ajoute-t-il `x-forwarded-for` (fiabilité de l'IP, ADR 0016) ?
- Après connexion, revenir à la page demandée (`?suite=`, chemin interne seulement) : utile ?
- Ancien formulaire : remettre « afficher le mot de passe » et la confirmation à l'inscription ? Invitation par
  lien (e-mail pré-rempli) : avec le module Événements.
- Token d'erreur : la maquette v2 n'en a pas (erreurs en `ink`/`accent-text` + icône). Question close sauf avis contraire.
- Module Journal (nouveau dans la maquette) : ticket à créer ? Glossaire posé dans `CONTEXT.md`, à valider. Verrou à
  6 chiffres + « Utiliser mon mot de passe » : revue sécurité à prévoir.

- **Sous-tâches (revue de #19), à trancher** :
  - Sous-tâche ouverte sous une tâche cochée : elle reste dans « Cochées » et n'est comptée nulle part. Voulu ?
  - Sous-tâches comptées dans la limite de 500 tâches par liste ; pas de changement de parent. D'accord ?

- **Récurrence** : ADR 0017 laissé « proposé » tant que la mise en place des tâches planifiées (cron) n'est pas
  décidée (la récurrence elle-même n'en a pas besoin). Reste ouvert : champ « Intervalle » affiché même avec
  « Jamais » ; forme du compteur de sous-tâches (« on verra la shape »).

- **Espaces (revue de `feat/espaces-ui`), à trancher** :
  - Dialogues des modules : un store par module demanderait une dépendance (Zustand), sinon recalibrer la règle.
  - Maquette 3 : les bascules de réglages sont remplacées par le formulaire (règle 13). D'accord ?
  - Visibilité absente à la création (le contrat `create` ne la prend pas) : l'ajouter ?
  - Invité sans compte : après inscription, il doit rouvrir le lien (le retour ne traverse pas l'inscription).
  - « Choisir un propriétaire » (dernier propriétaire qui part) : simple ancre vers les membres ; suffisant ?
  - Un membre simple voit tous les réglages en lecture : voulu ?
  - Deux `useSetMemberRole` (proposition à deux, fiche « Gérer ») : laissés séparés, jugé acceptable.
  - Revue humaine (sécurité) : `RPC_RATE_LIMIT_PER_MINUTE` (limite des plans réglable, relevée à 1000 en E2E
    seulement) ; réessai E2E après la limite de Better Auth ; paramètre `retour` de la connexion ; jeton
    d'invitation retiré de l'adresse après lecture.

- **Listes partagées (branche `feat/todo-listes-partagees`)** : tranché le 2026-10-29 (liste à l'Espace, créateur
  parti sans accès ; membres renomment, propriétaire d'Espace supprime ; rien ne disparaît si Todo est désactivé ;
  nom proposé « Liste <Espace> »). Reste ouvert :
  - Compte du créateur supprimé : ses listes partagées partent avec lui (`owner` en `Cascade`), contrairement à
    « elle reste à l'Espace ». À traiter avec la suppression de compte (propriétaire nullable, ou passage à un membre).
  - « Cochée par » apparaît après la réponse du serveur, pas au moment de la coche (rendu optimiste sans le nom), et
    écrit le nom même quand c'est soi (« toi » demanderait l'utilisateur courant dans le module).
  - Choix « Partager avec » : parmi les 100 premiers Espaces seulement (borne du contrat `spaces.list`).
  - Revue humaine (droits) : `domain-access/todo-list`, `todo-guard.ts`, `list-access.ts`, `lists.service.ts`
    (visibilité, Espace visé, `members`).

- **Assignation (revue de `feat/todo-assignation`), à trancher** :
  - « Atténuer » : opacité 45 % de la maquette sur du texte `muted`, contraste sous 4,5:1 probable (non mesuré). Option
    choisie par l'utilisateur : garder, ou remonter l'opacité ?
  - « Atténuer » touche aussi les tâches sans assigné (lecture littérale du libellé) et n'est pas retenue au
    rechargement. D'accord ?
  - Option en case à cocher dans l'en-tête de liste (maquette : interrupteur).
  - `lists.members` rend `callerId` : le web n'a pas l'utilisateur courant dans le module. Mieux à terme : un accès
    commun à l'utilisateur courant (servirait aussi à « toi » dans « Cochée par »).
  - Brief « Nouvelle tâche » : champ « liste » absent ; en-tête « dates » absent (listes d'événement).
  - Revue humaine (droits) : `canBeAssigned`, `deleteMembership`, `unassignOutsideSpace`.

- **Lecture seule (branche `feat/todo-partage-lecture`), à trancher** : partage avec un Espace choisi le 2026-11-01.
  - Reste visible quand Todo est désactivé dans l'Espace (comme une liste partagée) et même si l'Espace restreint sa
    visibilité : d'accord ?
  - Liste retirée sous les yeux d'un membre : il bascule sur sa première liste, sans message (comme une liste supprimée
    par un autre).
  - Espace où Todo a été désactivé : changer de niveau répond `TODO_DISABLED` ; retirer le partage marche.
  - Passer en lecture seule efface « Cochée par » des autres sur la liste (les lecteurs ne sont pas forcément ceux qui
    ont coché) ; revenir en partagée ne le rend pas.
  - Revue humaine (droits) : `canAccessTodoList` (`isReader`), `visibleTo`, `nextSharing`, `deleteMembership`.

- **Agenda (branche `feat/agenda-modele`), à trancher** : choix pris d'après la maquette nuit, à confirmer.
  - **Déplacer une entrée** (accepté le 2026-11-05) : PC, glisser-déposer à la souris ; mobile, appui long (~1 s) qui
    la décolle, puis toucher d'un créneau (toucher un jour de l'en-tête change de jour, l'entrée reste décollée). Le
    décalage compte depuis l'endroit où l'entrée a été prise ; pas de 15 min, durée gardée, sans dépendance. Clavier :
    le formulaire. Limites : grilles Jour et Semaine seulement (pas le Mois) ; un créneau horaire ne devient pas « à la
    journée » ni l'inverse ; pas de rendu optimiste (estompée pendant l'envoi, puis à sa place) ; un déplacement à la
    fois ; pas de défilement auto en tirant près du bord ; pas de redimensionnement ; une heure qui n'existe pas
    (02:30 au passage à l'heure d'été) devient l'heure suivante. Pas essayé sur un vrai téléphone (iOS, Firefox
    Android) : l'appui long n'y est vu que par Playwright.
  - **Vie privée** (accepté par l'utilisateur le 2026-11-02) : un Espace avec Agenda voit titre, horaire et lieu de toutes
    tes entrées non masquées, passées comprises ; jamais la description.
  - Couleur : teinte de l'entrée dans mon agenda, teinte de la personne dans la vue fusionnée (maquette). La maquette
    a aussi une teinte pour les entrées communes (`t-couple`) et les événements (`t-trip`) : à venir avec eux.
  - **Écarts à la maquette** :
    - participants en texte libre (accepté le 2026-11-05) : écrits « avec Marie, Léo », pas en avatars comme la
      maquette (où ce sont des membres de l'Espace, propriétaire compris) ; montrés quand le créneau a la place, au
      survol sinon ; visibles par l'Espace comme le lieu (la maquette les montre) : noms de tiers, à confirmer en
      revue droits ;
    - filtres par personne : pastilles pleine taille sur mobile, pas les pastilles compactes de la ligne de bascule ;
    - ajout non demandé : entrée masquée en pointillés dans mon agenda, gardé pour que ça se voie ;
    - pas de « Peut-être », ni d'événements dans les filtres (« Anniversaire de Léo ») : module Événements ;
    - pas de vignette ; barre latérale et barre mobile absentes (`869fhwtg4`), en-tête provisoire sur deux lignes ;
    - choix de l'Espace ajouté (« Mon agenda », « Alice & Bob ») : la maquette ne montre qu'un groupe de personnes.
  - **Sans maquette, faits au plus simple** : vue Mois, formulaire d'entrée, entrées à la journée, version claire.
  - Sur mobile, la vue Semaine est très serrée (7 colonnes) ; la vue par défaut y est Jour.
  - Une entrée masquée disparaît aussi de la vue fusionnée pour son propriétaire (elle reste dans son agenda) ; masquer
    vaut pour tous les Espaces. Espace qui restreint sa visibilité : la vue fusionnée ne montre que ses propres entrées.
  - Quatre teintes pour toutes les personnes (`tintOf`) : deux membres peuvent se confondre, le nom et l'avatar tranchent.
  - Lier un créneau à une tâche : API faite, pas de champ à l'écran. Pas de récurrence sur les entrées.
  - Limites : 5 000 entrées par personne, 366 jours par entrée, 62 jours lus à la fois.
  - Revue humaine (droits) : `domain-access/agenda.ts`, `agenda-guard.ts`, `listSpaceEntries`, `assertReadableTask`.

- **Fusion Espaces → Todo** : `Button` taille `sm` unifiée (texte `sm`, padding réduit) : les petits boutons des
  Espaces rapetissent ; à valider à l'œil. `todo/atoms/load-error.tsx` double `LoadError` de `packages/ui` : à
  remplacer par celui-ci dans une PR Todo.

## 5. Pièges de l'environnement

- Push SSH impossible depuis ma session ; `git fetch` marche en HTTPS via `gh` (`credential.helper='!gh auth git-credential'`).
- Merge de PR refusé en mode auto : l'utilisateur fusionne.
- PR empilées : avant de fusionner, vérifier que la base n'est pas déjà fusionnée (#23 a manqué `master` ainsi).
- CI : `Can't resolve '@vercel/turbopack-next/internal/font/google/font'` au build = téléchargement Google Fonts raté,
  pas le code (vu une fois sur #25, job `e2e` du même commit vert) ; le build dépend de ce réseau.
- Après un changement de branche qui touche `schema.prisma` : `pnpm --filter @planifier/db generate`.
- TypeScript 6 n'inclut plus `@types/*` par défaut : `"types": ["node"]` dans le tsconfig d'un package Node.
- Navigateur : Brave seulement, pas de Chrome ⇒ pas d'extension Claude in Chrome ; vérif visuelle par l'utilisateur.
- Base locale : `docker compose up -d`, port 5433. Dépendance nouvelle : fiche validée avant `pnpm add`.
- `pnpm --filter X add` peut délier les `node_modules` d'autres packages : relancer `pnpm install` ensuite.
- Better Auth coupe son contrôle d'origine en environnement de test : `disableOriginCheck: false` le garde actif.
- Migrer la base de test : `DATABASE_URL_UNPOOLED` (la CLI Prisma ignore `DATABASE_URL`, qui laisse la base locale).
- Tests sur base : `DATABASE_URL=postgresql://planifier:planifier@localhost:5433/planifier_test pnpm test:integration`
  (suites sérialisées : `auth` puis `api-server`, même base).
- Node local 24.11 : jsdom 30 refusé (D4). Tests de composants web : `// @vitest-environment jsdom` en tête de fichier.
- `/update-user` de Better Auth accepte aussi `image` (→ `avatarUrl`) sans contrôle : à fermer avec les avatars.
- jsdom n'a pas `CSS.escape` : `userEvent.keyboard` sur des radios plante ; tester au clic.
- Le tsconfig de Next garde le JSX (`preserve`) : `oxc.jsx` dans `apps/web/vitest.config.ts`.
- Tests E2E : `DATABASE_URL=…/planifier_test pnpm test:e2e` ; la limitation de débit de Better Auth (par IP, 10 s)
  refuse un compte par test : partager un compte en série.
- GitGuardian : exclusions dans le tableau de bord (`project-context` §5), pas dans le dépôt.

- **Composants de base et navigation (revue de `feat/navigation-modules`), à trancher** :
  - `me.get` lit `modules` par une seconde requête (la session Better Auth ne les porte pas) : à chaque rendu du
    layout. Les déclarer en champ additionnel de Better Auth les ferait venir avec la session ; à voir si le coût compte.
  - `Button loading` : désactivé + `aria-busy`, sans indicateur visuel. Ajouter un spinner (composant ou token) ?
  - `SegmentedControl` et `Tabs` ne sont pas encore utilisés par l'agenda et le Todo (navigation par liens/URL).
    Les migrer, ou les garder pour les vues sans URL ?
  - Bouton flottant de l'agenda en `max-sm:bottom-20`, calé à la main sur la barre basse (`min-h-14`) : à relier si la
    hauteur de la barre change (variable CSS ou token).
  - Contraste non-texte AA du rail de l'interrupteur (`bg-line`) non mesuré ; `/composants` sans cas survol/focus
    ni lien depuis la navigation, et livrée en production derrière la connexion : à garder ?
  - Libellés de la barre basse sur 375 px quand « Événements » arrivera (sans icônes).
  - Revue humaine : migration `20261105230000_modules_utilisateur` (met à jour des comptes existants), procédure
    `account.me.setModules`.
  - Test serveur `server.test.ts` : « session lue » prouvée par une erreur interne faute de base (fragile) ; à refaire
    quand une procédure du plan utilisateur n'aura pas besoin de la base.
