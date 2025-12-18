# 🎉 Guide : Page de Création d'Événement

## 📍 Accès à la page

**URL** : `http://localhost:3000/events/create`

La page est protégée par `AuthGuard`, donc l'utilisateur doit être connecté.

---

## 🎯 Fonctionnalités

### ✅ Champs du formulaire

#### **Obligatoires**
- ✅ **Nom de l'événement** : Titre de l'événement (ex: "Soirée jeux de société")
- ✅ **Date** : Date de l'événement (sélecteur de date)

#### **Optionnels**
- ⏰ **Heure** : Heure de début (sélecteur d'heure)
- 📍 **Lieu** : Adresse ou description du lieu
- 📝 **Description** : Texte libre pour décrire l'événement
- 🏷️ **Tags** : Tags personnalisés avec couleurs
- 🖼️ **Image de couverture** : Upload d'image (preview incluse)

---

## 🏷️ Système de Tags

### Créer un tag personnalisé

1. Cliquer sur **"Ajouter un tag"**
2. Entrer le nom du tag (ex: "Sport", "Anniversaire", "Soirée")
3. Choisir une couleur parmi 10 options :
   - 🔴 Rouge
   - 🟠 Orange
   - 🟡 Jaune
   - 🟢 Vert
   - 🔵 Bleu
   - 🟣 Indigo
   - 🟣 Violet
   - 🌸 Rose
   - ⚫ Gris
   - ⚫ Noir
4. Voir l'aperçu du tag
5. Cliquer sur **"Ajouter"**

### Supprimer un tag

Cliquer sur le ❌ du tag dans la liste.

---

## 🖼️ Gestion de l'image

### Ajouter une image
1. Cliquer sur **"Choisir une image"**
2. Sélectionner une image depuis votre appareil
3. L'aperçu s'affiche automatiquement

### Supprimer une image
Cliquer sur le ❌ en haut à droite de l'aperçu.

---

## 🔧 Validation

### Règles de validation

- ❌ **Nom vide** → Erreur : "Le nom de l'événement est obligatoire"
- ❌ **Date vide** → Erreur : "La date de l'événement est obligatoire"
- ✅ Tous les autres champs sont optionnels

### Comportement après création

1. **Message de succès** : "Événement créé avec succès !"
2. **Réinitialisation du formulaire** après 2 secondes
3. **Redirection vers `/events/{id}`** (commentée pour l'instant)

---

## 📡 API Backend

### Endpoint utilisé

```
POST /api/events
```

### Headers requis

```
Authorization: Bearer <token>
Content-Type: application/json
```

### Body envoyé

```json
{
  "title": "Soirée jeux de société",
  "startDate": "2025-12-25T20:00:00",
  "endDate": null,
  "location": "Chez Marie, 12 rue de la Paix",
  "description": "Venez nombreux !\n\nTags: #Soirée #Jeux",
  "coverUrl": null,
  "settings": {
    "isGuestListVisible": true,
    "allowGuestInvite": false,
    "maxParticipants": null
  }
}
```

### Réponse attendue

```json
{
  "id": "uuid-de-l-evenement",
  "title": "Soirée jeux de société",
  "startDate": "2025-12-25T20:00:00.000Z",
  "location": "Chez Marie, 12 rue de la Paix",
  "description": "Venez nombreux !\n\nTags: #Soirée #Jeux",
  "participants": [
    {
      "userId": "uuid-du-createur",
      "role": "OWNER",
      "status": "GOING",
      "user": {
        "id": "uuid",
        "name": "John Doe",
        "avatarUrl": null
      }
    }
  ],
  "settings": {
    "isGuestListVisible": true,
    "allowGuestInvite": false,
    "maxParticipants": null
  }
}
```

---

## 🎨 Design & UX

### Mobile-First

- ✅ Responsive sur tous les écrans
- ✅ Formulaire centré avec largeur max
- ✅ Espacement adaptatif (xs/sm/md)

### Composants MUI utilisés

- `Container` : Conteneur responsive
- `Paper` : Carte avec ombre et bordures arrondies
- `TextField` : Champs de formulaire avec icônes
- `Chip` : Tags colorés
- `Dialog` : Modale pour créer un tag
- `Button` : Boutons d'action
- `Alert` : Messages d'erreur/succès
- `CircularProgress` : Spinner de chargement

### Icônes (Lucide React)

- 📄 `FileText` : Nom de l'événement
- 📅 `Calendar` : Date
- ⏰ `Clock` : Heure
- 📍 `MapPin` : Lieu
- 🖼️ `ImageIcon` : Image de couverture
- ➕ `Plus` : Ajouter un tag
- ❌ `X` : Supprimer
- 💾 `Save` : Enregistrer
- 🏷️ `Tag` : Tag

---

## 📂 Structure des fichiers

```
front/app/events/create/
├── page.js          # Page principale du formulaire
└── layout.js        # Layout avec AuthGuard + Navbar
```

---

## 🔄 Flux de données

```
1. User remplit le formulaire
   ↓
2. User clique "Créer l'événement"
   ↓
3. Validation frontend (nom + date obligatoires)
   ↓
4. Préparation des données :
   - Combiner date + heure → startDate
   - Ajouter tags à la description
   ↓
5. POST /api/events avec token JWT
   ↓
6. Backend crée l'événement + settings + participant OWNER
   ↓
7. Réponse avec l'événement créé
   ↓
8. Message de succès + réinitialisation du formulaire
   ↓
9. (À venir) Redirection vers /events/{id}
```

---

## 🚀 Prochaines étapes

### À implémenter

- [ ] **Page de détail d'événement** : `/events/{id}`
- [ ] **Upload d'image réel** : Intégration avec un service de stockage
- [ ] **Modèle Tag dans Prisma** : Stocker les tags en base de données
- [ ] **Autocomplete des tags** : Suggérer des tags existants
- [ ] **Date de fin** : Ajouter un champ pour la date/heure de fin
- [ ] **Paramètres avancés** : Visibilité, invitations, nombre max de participants

### Code commenté à décommenter

```javascript
// Dans page.js, ligne 4
import { useRouter } from "next/navigation";

// Dans page.js, ligne 56
const router = useRouter();

// Dans page.js, après la création réussie
setTimeout(() => {
  router.push(`/events/${data.id}`);
}, 1000);
```

---

## 🧪 Tests manuels

### Test 1 : Validation des champs obligatoires
1. Laisser le nom vide
2. Cliquer sur "Créer l'événement"
3. ✅ Erreur : "Le nom de l'événement est obligatoire"

### Test 2 : Création minimale
1. Remplir uniquement nom + date
2. Cliquer sur "Créer l'événement"
3. ✅ Événement créé avec succès

### Test 3 : Création complète
1. Remplir tous les champs
2. Ajouter 2-3 tags
3. Uploader une image
4. Cliquer sur "Créer l'événement"
5. ✅ Événement créé avec tous les détails

### Test 4 : Tags personnalisés
1. Cliquer sur "Ajouter un tag"
2. Entrer "Sport"
3. Choisir la couleur verte
4. Cliquer sur "Ajouter"
5. ✅ Tag affiché avec la bonne couleur
6. Cliquer sur ❌ du tag
7. ✅ Tag supprimé

### Test 5 : Image de couverture
1. Cliquer sur "Choisir une image"
2. Sélectionner une image
3. ✅ Aperçu affiché
4. Cliquer sur ❌
5. ✅ Image supprimée

---

## 🐛 Problèmes connus

### Tags non persistés en base
**Cause** : Pas de modèle `Tag` dans le schéma Prisma.  
**Solution temporaire** : Les tags sont ajoutés à la description sous forme de hashtags.  
**Solution définitive** : Créer un modèle `Tag` et une relation `EventTag`.

### Upload d'image non fonctionnel
**Cause** : Pas de service de stockage configuré.  
**Solution temporaire** : Le champ `coverUrl` est null.  
**Solution définitive** : Intégrer Cloudinary, AWS S3, ou un service similaire.

### Pas de redirection après création
**Cause** : Page `/events/{id}` pas encore créée.  
**Solution** : Décommenter le code de redirection une fois la page créée.

---

## 💡 Conseils d'utilisation

### Pour les développeurs

- Les tags sont stockés dans la description pour l'instant
- Le format est : `Tags: #Tag1 #Tag2 #Tag3`
- L'heure par défaut est `00:00:00` si non spécifiée
- Le créateur est automatiquement ajouté comme participant `OWNER` avec statut `GOING`

### Pour les utilisateurs

- Utilisez des noms d'événement clairs et concis
- Ajoutez une description pour donner plus de contexte
- Les tags aident à catégoriser et retrouver vos événements
- L'image de couverture rend l'événement plus attractif

---

**Créé le** : 25 novembre 2025  
**Version** : 1.0  
**Auteur** : Cascade AI
