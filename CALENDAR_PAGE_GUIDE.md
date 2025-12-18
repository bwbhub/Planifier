# 📅 Guide : Page Calendrier d'Événements

## 📍 Accès à la page

**URL** : `http://localhost:3000/events`

La page est protégée par `AuthGuard`, donc l'utilisateur doit être connecté.

---

## 🎯 Fonctionnalités principales

### ✅ Deux vues disponibles

1. **Vue Semaine** (par défaut)
   - Grille horaire 6h → 00h (19 heures)
   - 7 colonnes (Lundi → Dimanche)
   - Événements positionnés selon leur heure de début/fin
   - Style Google Agenda simplifié

2. **Vue Mois**
   - Grille 7 × 6 (42 jours)
   - Chaque case = un jour
   - Liste verticale d'événements (max 2 visibles + "+X autres")
   - Jours hors du mois grisés

---

## 🎨 Interface utilisateur

### Header du calendrier

```
┌─────────────────────────────────────────────────────────┐
│ Semaine du 3 → 9 février 2025                          │
│                                                          │
│ [Aujourd'hui] [<] [>] [Semaine] [Mois]                │
└─────────────────────────────────────────────────────────┘
```

**Éléments** :
- **Titre dynamique** :
  - Vue semaine : "Semaine du 3 → 9 février 2025"
  - Vue mois : "Février 2025"
- **Bouton "Aujourd'hui"** : Revenir à la date actuelle
- **Navigation** : `<` et `>` pour semaine/mois précédent/suivant
- **Bascule de vue** : Boutons "Semaine" et "Mois"

---

## 📱 Mobile-First

### Vue Semaine sur mobile

**Comportement** :
- Affiche **un seul jour** à la fois
- Navigation avec flèches `<` et `>` en haut
- Titre du jour : "lundi 3 février"
- Scroll vertical pour voir toutes les heures

**Exemple** :
```
┌─────────────────────────────────┐
│  <  lundi 3 février  >          │
├─────────────────────────────────┤
│ 6h  │                           │
│ 7h  │ ┌───────────────────┐     │
│ 8h  │ │ Réunion d'équipe  │     │
│ 9h  │ └───────────────────┘     │
│ 10h │                           │
│ ... │                           │
└─────────────────────────────────┘
```

### Vue Mois sur mobile

**Comportement** :
- Grille 7 × 6 responsive
- Cases plus petites (min-height: 80px)
- Événements affichés en format compact
- Scroll vertical si nécessaire

---

## 🗓️ Vue Semaine détaillée

### Structure

```
┌──────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│      │ Lun │ Mar │ Mer │ Jeu │ Ven │ Sam │ Dim │
│      │  3  │  4  │  5  │  6  │  7  │  8  │  9  │
├──────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ 6h   │     │     │     │     │     │     │     │
├──────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ 7h   │     │     │     │     │     │     │     │
├──────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ 8h   │ ┌─┐ │     │     │     │     │     │     │
│ 9h   │ │E│ │     │     │     │     │     │     │
│ 10h  │ └─┘ │     │     │     │     │     │     │
├──────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ ...  │     │     │     │     │     │     │     │
└──────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘
```

### Positionnement des événements

**Calcul automatique** :
```javascript
// Position verticale (top)
top = ((heureDebut - 6) / 19) * 100 + "%"

// Hauteur (height)
height = ((heureFin - heureDebut) / 19) * 100 + "%"
```

**Exemple** :
- Événement de 8h à 10h :
  - `top = ((8 - 6) / 19) * 100 = 10.5%`
  - `height = ((10 - 8) / 19) * 100 = 10.5%`

### Affichage des événements

**Carte d'événement** :
```
┌─────────────────────┐
│ Réunion d'équipe    │
│ 📍 Salle A          │
└─────────────────────┘
```

**Propriétés** :
- Fond : `primary.main`
- Texte : blanc
- Border-radius : 4px
- Padding : 4px
- Hover : `primary.dark`
- Cursor : pointer

---

## 🗓️ Vue Mois détaillée

### Structure

```
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ Lun │ Mar │ Mer │ Jeu │ Ven │ Sam │ Dim │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ 29  │ 30  │ 31  │  1  │  2  │  3  │  4  │
│     │     │     │ 8h  │     │ 14h │     │
│     │     │     │ Réu │     │ Cin │     │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│  5  │  6  │  7  │  8  │  9  │ 10  │ 11  │
│ 10h │     │     │     │     │     │     │
│ Spo │     │     │     │     │     │     │
│ +2  │     │     │     │     │     │     │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ ... │     │     │     │     │     │     │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘
```

### Affichage des événements

**Limite** : 2 événements visibles par jour

**Format** :
```
┌─────────────────┐
│ 5               │ ← Numéro du jour
│ 10h Sport       │ ← Événement 1
│ 14h Cinéma      │ ← Événement 2
│ +2 autres       │ ← Indicateur si > 2
└─────────────────┘
```

**Jours hors du mois** :
- Opacité : 50%
- Fond : `action.hover`

**Jour actuel** :
- Numéro en gras
- Couleur : `primary.main`

---

## 🔍 Modale de détail d'événement

### Déclenchement

**Clic sur un événement** → Ouverture de la modale

### Contenu de la modale

```
┌───────────────────────────────────────┐
│ Réunion d'équipe                      │
├───────────────────────────────────────┤
│                                       │
│ 📅 lundi 3 février 2025               │
│    8h00 → 10h00                       │
│                                       │
│ 📍 Salle de réunion A                 │
│                                       │
│ ─────────────────────────────────     │
│                                       │
│ Discussion sur le projet Q1           │
│                                       │
│ Tags: #Travail #Important             │
│                                       │
│ ─────────────────────────────────     │
│                                       │
│ 👥 Participants (5)                   │
│ [John] [Marie] [Paul] [Sophie] +1     │
│                                       │
├───────────────────────────────────────┤
│         [Fermer] [Voir l'événement]   │
└───────────────────────────────────────┘
```

### Éléments affichés

1. **Titre** : Nom de l'événement
2. **Date et heure** :
   - Format : "lundi 3 février 2025"
   - Heure : "8h00 → 10h00"
3. **Lieu** : Si présent
4. **Description** : Texte complet avec retours à la ligne
5. **Participants** :
   - Chips avec avatars
   - Max 5 visibles + "+X" si plus
   - Badge "OWNER" pour le créateur
6. **Actions** :
   - Bouton "Fermer"
   - Bouton "Voir l'événement" → Redirection vers `/events/{id}`

---

## 🔄 Navigation

### Boutons de navigation

**Semaine précédente/suivante** :
```javascript
// Précédent
currentDate.setDate(currentDate.getDate() - 7)

// Suivant
currentDate.setDate(currentDate.getDate() + 7)
```

**Mois précédent/suivant** :
```javascript
// Précédent
currentDate.setMonth(currentDate.getMonth() - 1)

// Suivant
currentDate.setMonth(currentDate.getMonth() + 1)
```

**Aujourd'hui** :
```javascript
setCurrentDate(new Date())
```

---

## 📡 API Backend

### Endpoint utilisé

```
GET /api/events
```

### Headers requis

```
Authorization: Bearer <token>
```

### Réponse attendue

```json
[
  {
    "id": "uuid",
    "title": "Réunion d'équipe",
    "description": "Discussion sur le projet Q1\n\nTags: #Travail",
    "location": "Salle A",
    "startDate": "2025-02-03T08:00:00.000Z",
    "endDate": "2025-02-03T10:00:00.000Z",
    "participants": [
      {
        "userId": "uuid",
        "role": "OWNER",
        "status": "GOING",
        "user": {
          "id": "uuid",
          "name": "John Doe",
          "avatarUrl": null
        }
      }
    ],
    "_count": {
      "participants": 5
    }
  }
]
```

---

## 🎨 Composants utilisés

### MUI Components

- `Container` : Conteneur responsive (maxWidth="xl")
- `Paper` : Cartes avec ombre et bordures
- `Button` : Boutons de navigation et actions
- `IconButton` : Boutons avec icônes uniquement
- `Dialog` : Modale de détail
- `Chip` : Tags et participants
- `Avatar` : Avatars des participants
- `Stack` : Layout vertical
- `Divider` : Séparateurs
- `CircularProgress` : Spinner de chargement
- `Typography` : Textes stylisés

### Icônes Lucide React

- 📅 `CalendarIcon` : Date
- ⏰ `Clock` : Heure
- 📍 `MapPin` : Lieu
- 👥 `Users` : Participants
- 🔗 `ExternalLink` : Lien externe
- ◀️ `ChevronLeft` : Navigation gauche
- ▶️ `ChevronRight` : Navigation droite

---

## 🎯 Fonctionnalités avancées

### Détection du jour actuel

**Vue semaine** :
- Numéro du jour en couleur `primary.main`
- Police en gras

**Vue mois** :
- Numéro du jour en couleur `primary.main`
- Police en gras

### Responsive Design

**Breakpoints** :
- `xs` (< 600px) : Vue jour unique en mode semaine
- `sm` (600px - 900px) : Vue semaine complète
- `md` (900px+) : Vue semaine complète avec plus d'espace

### Scroll

**Vue semaine** :
- Hauteur fixe : 600px (desktop) / 70vh (mobile)
- Scroll vertical pour voir toutes les heures

**Vue mois** :
- Hauteur auto
- Scroll si nécessaire

---

## 🧪 Tests manuels

### Test 1 : Navigation semaine
1. Aller sur `/events`
2. Cliquer sur `>`
3. ✅ Affiche la semaine suivante
4. Cliquer sur `<`
5. ✅ Revient à la semaine précédente
6. Cliquer sur "Aujourd'hui"
7. ✅ Revient à la semaine actuelle

### Test 2 : Bascule de vue
1. Cliquer sur "Mois"
2. ✅ Affiche la vue mois
3. Cliquer sur "Semaine"
4. ✅ Revient à la vue semaine

### Test 3 : Affichage des événements
1. Créer un événement pour aujourd'hui à 10h
2. Aller sur `/events`
3. ✅ L'événement apparaît dans la grille horaire
4. ✅ Position correcte (10h)

### Test 4 : Modale de détail
1. Cliquer sur un événement
2. ✅ Modale s'ouvre
3. ✅ Toutes les infos affichées
4. Cliquer sur "Voir l'événement"
5. ✅ Redirection vers `/events/{id}`

### Test 5 : Mobile
1. Réduire la fenêtre < 768px
2. ✅ Vue jour unique
3. ✅ Flèches de navigation visibles
4. ✅ Scroll vertical fonctionne

---

## 🐛 Problèmes connus

### Événements qui se chevauchent
**Cause** : Plusieurs événements à la même heure.  
**Solution actuelle** : Les événements se superposent.  
**Solution future** : Décalage horizontal automatique.

### Événements de plusieurs jours
**Cause** : Pas de gestion des événements multi-jours.  
**Solution actuelle** : L'événement n'apparaît que le jour de début.  
**Solution future** : Barre horizontale sur plusieurs jours.

### Page `/events/{id}` non créée
**Cause** : Page de détail pas encore implémentée.  
**Solution** : Le bouton "Voir l'événement" redirige mais la page n'existe pas.

---

## 🚀 Prochaines étapes

### À implémenter

- [ ] **Page `/events/{id}`** : Détail complet de l'événement
- [ ] **Gestion des événements multi-jours** : Barre horizontale
- [ ] **Décalage automatique** : Événements qui se chevauchent
- [ ] **Drag & Drop** : Déplacer un événement dans le calendrier
- [ ] **Filtres** : Par tag, par participant, par statut
- [ ] **Export** : iCal, Google Calendar
- [ ] **Notifications** : Rappels avant l'événement

---

## 💡 Astuces d'utilisation

### Pour les développeurs

- Les événements sont filtrés par jour avec `getEventsForDay()`
- Le positionnement est calculé en % pour être responsive
- La grille horaire commence à 6h et finit à 00h (24h)
- Les dates sont gérées avec l'objet `Date` natif de JavaScript

### Pour les utilisateurs

- Cliquez sur un événement pour voir tous les détails
- Utilisez "Aujourd'hui" pour revenir rapidement à la date actuelle
- La vue semaine est idéale pour planifier votre semaine
- La vue mois donne une vision globale de vos événements

---

**Créé le** : 25 novembre 2025  
**Version** : 1.0  
**Auteur** : Cascade AI
