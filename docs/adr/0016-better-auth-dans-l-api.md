# 0016 — Better Auth monté dans l'API, session lue par la garde du plan utilisateur

Statut : accepté · Date : 2026-10-20

Contexte : ADR 0004 retient Better Auth ; ADR 0015 place l'API derrière un proxy même origine. Il faut brancher
inscription, connexion, déconnexion et session sans dupliquer de logique ni exposer de secret au navigateur.

Décision :

- Package `@planifier/auth` : configuration Better Auth (adaptateur Prisma, e-mail + mot de passe, cookies httpOnly
  préfixés `planifier`, `Secure` en production, télémétrie coupée, contrôle d'origine forcé), `getSessionUser`,
  gestionnaire Node. Pas de plugin d'organisations (Espace maison, ADR 0009).
- `apps/api` sert Better Auth sous `/api/auth/*` ; le web relaie ce préfixe comme `/rpc/*`. `BETTER_AUTH_URL` est
  l'origine publique du web, seule origine de confiance.
- Plan utilisateur dans `api` : `userGuard` (limitation de débit, puis session obligatoire, sinon `UNAUTHORIZED`)
  ajoute `user` au contexte. La lecture de session est injectée par le serveur (`ApiContext.getSessionUser`) : `api`
  se teste sans base.
- IP du client : le proxy du web prend l'entrée la plus à droite de `x-forwarded-for` (posée par le dernier relais) et
  la transmet dans `x-planifier-client-ip`, seul en-tête d'IP cru par l'API (Better Auth et garde de plan). Dans
  tous les environnements, l'API refuse (400) toute requête routée sans IP valide : pas de compteur commun qu'un
  client pourrait épuiser pour tous les autres, pas de branche propre à la production. En local, Next renseigne
  toujours `x-forwarded-for` (adresse du socket), le proxy pose donc toujours l'IP. Limiteur des plans injecté par
  le serveur dans le contexte (un par instance). Choix d'un en-tête maison plutôt que relayer `x-forwarded-for` : l'API n'a pas à savoir
  combien de relais précèdent le web.
- Limitation de débit en mémoire du processus (Better Auth : 3 essais / 10 s sur connexion et inscription ; plans
  oRPC : 120 requêtes / min / IP).
- `User.name` obligatoire et validé à chaque écriture (non vide une fois nettoyé, 100 caractères au plus ; Better
  Auth n'impose que `z.string()`), `User.emailVerified` ajouté, `User.modules` vide par défaut (Better Auth crée le
  compte sans le renseigner), `image` de Better Auth ↔ `avatarUrl`. Identifiants uuid v7
  générés par Prisma (`generateId: false`).
- `db` n'importe plus `server-only` : `apps/api` est du Node pur. Le lint (`SERVER_PACKAGES`) protège le web.

Conséquences : une seule instance d'API tant que les compteurs sont en mémoire. L'IP n'est fiable que si un relais
de l'hébergeur ajoute `x-forwarded-for` devant le web ; sans lui, elle est falsifiable (acceptable en local
seulement). Un appel direct à l'API (sonde de santé, curl) doit poser l'en-tête d'IP. Pas encore de vérification d'e-mail ni de réinitialisation de mot de passe (package `mails`). Écartés :
Auth.js (ADR 0004), session lue dans le web (le web n'importe ni `auth` ni `db`), stockage des compteurs en base
(une table et une écriture par requête pour une seule instance).
