# À discuter : domaine d'envoi des e-mails (Resend)

Note de préparation (2026-10-26), à trancher dans une session dédiée puis à supprimer (décision ⇒ ADR ou
`project-context`). Tarifs et limites à reconfirmer sur les pages de Resend et du registraire le jour venu.

## Pourquoi c'est bloquant

- Vérification d'e-mail obligatoire (`requireEmailVerification`) : sans e-mail réel, **aucune inscription ni
  réinitialisation de mot de passe** possible hors local.
- En production, `packages/mails/src/env.ts` impose `MAIL_TRANSPORT=resend` (Mailpit refusé).
- Resend n'envoie qu'à son propre compte tant qu'aucun domaine n'est vérifié.

## Étapes

1. **Acheter le domaine** (registraire à choisir).
2. **Ajouter le domaine chez Resend** (région à choisir, UE de préférence : données personnelles minimales, RGPD).
3. **DNS** fournis par Resend, à poser chez le registraire :
   - DKIM : enregistrement TXT `resend._domainkey…` ;
   - SPF : MX + TXT sur le sous-domaine de retour (`send.…`) ;
   - DMARC : TXT `_dmarc…` (recommandé ; commencer en `p=none`, durcir ensuite).
4. Attendre la vérification (statut « Verified » dans le tableau de bord).
5. **Clé d'API** : permission « envoi seul », restreinte au domaine, **une par environnement** (preprod, prod).
   Jamais commitée ni affichée ; posée dans le gestionnaire de secrets de l'hébergeur.
6. **Variables** par environnement :
   - `MAIL_TRANSPORT=resend`, `RESEND_API_KEY=…` ;
   - `MAIL_FROM=` adresse sur le domaine vérifié (ex. `ne-pas-repondre@…`) ;
   - preprod : `MAIL_ALLOWED_DOMAINS=` domaines des testeurs (bac à sable).
7. Vérifier : inscription réelle → e-mail reçu (boîte de réception, pas indésirables) → lien ⇒ accueil.

## Questions à trancher

- Nom de domaine : le même que l'app, ou un domaine dédié ?
- Envoi depuis la racine ou un sous-domaine (`mail.…`) : un sous-domaine isole la réputation d'envoi.
- Registraire et hébergeur DNS (lien avec le ticket Docker / hébergement `869fhwtcc`).
- Plan Resend : le gratuit suffit-il au départ (quotas journalier et mensuel à confirmer) ?
- Adresse d'expédition et adresse de réponse (`reply-to` vers une vraie boîte, ou aucune ?).
- Rebonds et plaintes : webhooks Resend à brancher plus tard (nouvelle route publique ⇒ revue humaine) ou suivi
  manuel dans le tableau de bord au début ?
- Preprod : même domaine que la prod (clé distincte) ou sous-domaine distinct ?

## Liens

- Code : `packages/mails` (README), `packages/auth/src/auth-mails.ts`, `.env.example`.
- Fiche : `docs/DEPENDANCES.md` (Resend) ; ADR 0010.
