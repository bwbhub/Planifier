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

**Vérifié** : `pnpm check-types`, `pnpm lint`, `pnpm test`, `pnpm build`, `format:check` OK ; `test:integration`
36/36 (dont 21 Espaces : droits par rôle, dernier propriétaire, lien consommé, expiré, concurrence sur un même lien,
Espace plein). **Non vérifié** : CI, E2E (aucun écran), Neon.

**Ouvert** : revue humaine (droits, nouvelle route d'invitation, skill modifiée). Garde puis verrou : un rôle changé
entre les deux n'est revérifié que pour les règles d'état. Pas d'UI (ticket `869fhwtfk`). Seed sans lien d'invitation.

**Attendu ensuite** : revue, push + PR sur demande ; UI de gestion des Espaces (`869fhwtfk`).

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
