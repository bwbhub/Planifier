# 0005 — PostgreSQL sur Neon, Prisma 7, pas de dépendance à l'hébergeur

Statut : accepté · Date : 2026-10-15

Décision : Neon (gratuit, branches), Prisma 7. Prisma 8 en release candidate (rc.22 au 14/10/2026) : on n'y passe pas avant sa stabilité. Prisma 7 reste supporté environ 18 mois après la sortie de la 8.
Conséquences : portable par `pg_dump` ; passage payant à l'usage de Neon possible ; aucune fonction propre à un hébergeur.
