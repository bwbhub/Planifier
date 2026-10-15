# @planifier/tokens

Design tokens de la direction « Doux et vivant » (source : maquette Phase 1, clair et nuit).

| Fichier          | Rôle                                                              |
| ---------------- | ----------------------------------------------------------------- |
| `src/tokens.css` | variables CSS sémantiques, clair + nuit (système ou `data-theme`) |
| `src/theme.css`  | expose les variables à Tailwind 4 (`@theme inline`)               |

## Utilisation (dans une app)

```css
@import "tailwindcss";
@import "@planifier/tokens/tokens.css";
@import "@planifier/tokens/theme.css";
```

## Règles

- Les composants n'utilisent que des classes issues de ces tokens (`bg-surface`, `text-muted`…).
  Aucune couleur, ombre ou rayon en dur.
- Ajouter un token = l'ajouter en clair **et** en nuit (deux blocs dans `tokens.css`), puis dans `theme.css`.
- Polices : Bricolage Grotesque (titres, `font-display`) et DM Sans (texte). Elles sont chargées par l'app
  (`next/font`) et branchées sur `--font-bricolage` / `--font-dm-sans`.
