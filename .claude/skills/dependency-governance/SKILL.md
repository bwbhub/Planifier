---
name: dependency-governance
description: Processus et critères pour ajouter, mettre à jour ou retirer une dépendance (fiche de décision, licences, maintenance, doublons, chaîne d'approvisionnement, catalog pnpm). À lire avant tout pnpm add, toute montée de version ou tout override.
---

# Gouvernance des dépendances

**Ne jamais installer avant d'avoir une fiche validée dans `docs/DEPENDANCES.md`.** Un agent propose, un humain valide.

## Fiche de décision

```
Dépendance : <nom>@<version>    Cible : <package/app>    Type : prod | dev
Besoin : <1 phrase>
Doublon ? : <outil déjà présent> → adaptation possible : <oui/non>
Licence : <SPDX> (+ transitives : `pnpm licenses list --prod`)
Maintenance : dernière release <date> · mainteneurs · provenance npm
Poids : <gzip> · dépendances transitives · scripts d'installation : <oui/non>
Alternative écartée : <nom + raison>
Sortie : coût pour la retirer plus tard
```

## Licences

Autorisées : MIT, Apache-2.0, BSD-2/3, ISC, 0BSD, Unlicense, CC0, OFL (polices). À valider : MPL-2.0, LGPL, CC-BY,
double licence. Interdites : GPL, AGPL, SSPL, « source-available », absence de licence.

## « Activement maintenue »

Release < 12 mois, correctifs de sécurité publiés, dépôt non archivé, compatible avec nos majeures (React, Next, TS,
Zod), types inclus. Un échec sur ≥ 2 critères → alternative ou justification écrite.

## Un seul outil par besoin

La table de `project-context` §3 fait foi. Les bibliothèques écartées sont **interdites par lint**
(`no-restricted-imports`). Besoin qui chevauche une lib existante : étendre d'abord la lib en place.

## Chaîne d'approvisionnement

- pnpm ≥ 10.16 : `minimumReleaseAge` (3 jours) ; scripts d'installation limités à `onlyBuiltDependencies`.
- CI : `pnpm install --frozen-lockfile` ; le lockfile est relu en PR.
- Vérifier l'orthographe exacte du nom (typosquatting) et le dépôt source avant d'ajouter.
- Jamais d'exécution de code distant (`curl | sh`) dans les scripts.
- `pnpm audit --prod` doit rester à 0.

## Versions centralisées

Toutes les versions partagées vivent dans `pnpm-workspace.yaml` (`catalog:`). Les `package.json` écrivent `catalog:` ;
aucune version en dur. Dépendances internes en `workspace:*`. `overrides` réservés aux incompatibilités réelles
(commentaire : raison + date de réexamen, et ligne dans les dérogations de `project-context`).

## Où et comment installer

Dans le package qui **possède** le besoin (`pnpm --filter @planifier/<pkg> add`). Outils (CLI, test, build) en
`devDependencies`. **Prisma : épingler 7.x** — le tag `latest` du registre pointe sur une RC 8 (ADR 0005).
Avec `CI=true`, pnpm impose `--frozen-lockfile` : utiliser `--no-frozen-lockfile` pour modifier le lockfile.

## Retrait

Supprimer ce qui n'est plus utilisé plutôt que le laisser.
