# Polices

Servies depuis le dépôt (`next/font/local`) : le build ne télécharge rien (avec `next/font/google`, une coupure
réseau vers Google Fonts faisait échouer `next build`).

| Fichier                           | Famille             | Graisses (axe `wght`) | Licence                                    |
| --------------------------------- | ------------------- | --------------------- | ------------------------------------------ |
| `bricolage-grotesque-latin.woff2` | Bricolage Grotesque | 500 à 700             | SIL OFL 1.1, `OFL-bricolage-grotesque.txt` |
| `dm-sans-latin.woff2`             | DM Sans             | 400 à 600             | SIL OFL 1.1, `OFL-dm-sans.txt`             |

Origine : API CSS de Google Fonts (`fonts.googleapis.com/css2`, `wght@500..700` et `wght@400..600`), fichiers
variables woff2 du sous-ensemble `latin` (couvre le français, `œ` et `€` compris), récupérés le 2026-11-08.
Licences : dépôt `google/fonts` (`ofl/bricolagegrotesque/OFL.txt`, `ofl/dmsans/OFL.txt`), à garder à côté des fichiers.

Changer de graisse ou de sous-ensemble : refaire la requête CSS, remplacer le fichier, mettre à jour ce tableau et
`weight` dans `../layout.tsx`.
