# Guide : Page de détail d'événement

## 📍 Vue d'ensemble

La page `/events/[id]` affiche toutes les informations détaillées d'un événement, permettant aux participants de consulter les infos, communiquer via commentaires et chat, et gérer leur participation.

---

## 🎯 Fonctionnalités implémentées

### 1. **Header de l'événement**
- ✅ Titre de l'événement en grand
- ✅ Date formatée (ex: "Samedi 12 mars")
- ✅ Heure de début et fin (ex: "18h → 23h")
- ✅ Bouton "Retour" vers `/events`
- ✅ Bouton "Modifier" (visible uniquement pour l'organisateur)
- ✅ Design avec gradient subtil et bordure colorée

### 2. **Bloc "Infos clés"**
Card principale contenant :
- ✅ **Lieu** avec icône localisation
- ✅ **Description** (texte multiline, pre-wrap)
- ✅ **Organisateur** avec avatar et nom
- ✅ Design clean et lisible

### 3. **Bloc "Participants"**
- ✅ Liste des participants avec :
  - Avatar
  - Nom
  - Rôle (Organisateur / Invité)
  - Statut (Confirmé / Refusé / Peut-être) avec chip coloré
- ✅ Compteur de participants
- ✅ Bouton "+" pour ajouter un participant (organisateur uniquement)
- ✅ Bouton "Gérer les invitations" (organisateur uniquement)
- ✅ Scroll vertical si beaucoup de participants

### 4. **Bloc "Commentaires"**
- ✅ Liste des commentaires triés du plus récent au plus ancien
- ✅ Chaque commentaire affiche :
  - Avatar de l'auteur
  - Nom de l'auteur
  - Horodatage formaté
  - Texte du commentaire
- ✅ Champ de saisie avec textarea
- ✅ Bouton d'envoi avec icône
- ✅ Scroll vertical (max 400px)
- ✅ Message si aucun commentaire

### 5. **Chat dédié**
Distinct des commentaires, pour discussions informelles :
- ✅ Liste scrollable des messages
- ✅ Chaque message affiche :
  - Avatar miniature
  - Nom de l'auteur
  - Horodatage
  - Texte du message
- ✅ Auto-scroll vers le bas
- ✅ Input avec envoi par Enter
- ✅ Hauteur fixe (500px) avec scroll
- ✅ Message si aucun message

### 6. **Bloc "Organisation"**
Section extensible avec placeholders pour :
- ✅ Budget & Dépenses
- ✅ Liste de tâches
- ✅ Documents
- ✅ Boutons désactivés avec mention "Fonctionnalités à venir"

### 7. **Footer sticky**
Barre d'actions en bas de page :
- ✅ Bouton "Rejoindre" / "Quitter l'événement"
- ✅ Bouton "Partager" (copie le lien)
- ✅ Position fixe adaptative (mobile/desktop)
- ✅ Z-index élevé pour rester visible

### 8. **Modale d'ajout de participant**
- ✅ Dialog MUI
- ✅ Champ email
- ✅ Boutons Annuler / Ajouter
- ✅ Validation du champ

---

## 🎨 Design & UX

### Layout responsive
**Desktop** :
```
┌─────────────────────────────────────────┐
│           HEADER (gradient)             │
└─────────────────────────────────────────┘
┌──────────────────────┬──────────────────┐
│ Infos clés           │ Participants     │
│                      │                  │
│ Commentaires         │ Chat             │
│                      │                  │
│ Organisation         │                  │
└──────────────────────┴──────────────────┘
         ┌─────────────────────┐
         │  Footer sticky      │
         └─────────────────────┘
```

**Mobile** :
```
┌─────────────────┐
│ HEADER          │
├─────────────────┤
│ Infos clés      │
├─────────────────┤
│ Participants    │
├─────────────────┤
│ Commentaires    │
├─────────────────┤
│ Chat            │
├─────────────────┤
│ Organisation    │
└─────────────────┘
┌─────────────────┐
│ Footer sticky   │
└─────────────────┘
```

### Animations
- ✅ Fade-in au chargement (skeleton loaders)
- ✅ Hover subtil sur les boutons
- ✅ Transitions douces

### Couleurs & Thème
- ✅ Respect du dark mode
- ✅ Gradient subtil dans le header
- ✅ Chips colorés selon le statut
- ✅ Bordures légères et discrètes

---

## 🔧 Structure technique

### Fichiers créés
```
front/app/events/[id]/
├── page.js          # Page principale
└── layout.js        # Layout avec AuthGuard + Navbar
```

### États gérés
```javascript
// Données
const [event, setEvent] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

// Commentaires
const [comments, setComments] = useState([]);
const [newComment, setNewComment] = useState("");
const [sendingComment, setSendingComment] = useState(false);

// Chat
const [messages, setMessages] = useState([]);
const [newMessage, setNewMessage] = useState("");
const [sendingMessage, setSendingMessage] = useState(false);

// Modale
const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
const [participantEmail, setParticipantEmail] = useState("");
```

### Hooks utilisés
- ✅ `useParams()` - Récupération de l'ID depuis l'URL
- ✅ `useRouter()` - Navigation
- ✅ `useAuth()` - Authentification et user
- ✅ `useTheme()` - Thème MUI
- ✅ `useMediaQuery()` - Responsive
- ✅ `useRef()` - Auto-scroll du chat
- ✅ `useEffect()` - Chargement des données

### API appelées
```javascript
// Récupération de l'événement
GET /api/events/:id
Headers: { Authorization: `Bearer ${token}` }

// TODO: À implémenter
POST /api/events/:id/comments
POST /api/events/:id/messages
POST /api/events/:id/participants
PUT /api/events/:id/participation
```

---

## 📊 Données attendues

### Structure de l'événement
```javascript
{
  id: "uuid",
  title: "Soirée jeux",
  startDate: "2025-03-12T18:00:00Z",
  endDate: "2025-03-12T23:00:00Z",
  location: "Chez Marie",
  description: "Soirée jeux de société...",
  coverUrl: null,
  participants: [
    {
      id: "uuid",
      userId: "uuid",
      role: "ORGANIZER" | "GUEST",
      status: "CONFIRMED" | "DECLINED" | "MAYBE",
      user: {
        id: "uuid",
        name: "Marie Dupont",
        avatarUrl: "https://..."
      }
    }
  ],
  settings: { ... }
}
```

---

## 🚀 Fonctionnalités à implémenter

### Backend requis
1. **API Commentaires**
   - `POST /api/events/:id/comments` - Créer un commentaire
   - `GET /api/events/:id/comments` - Lister les commentaires

2. **API Chat**
   - `POST /api/events/:id/messages` - Envoyer un message
   - `GET /api/events/:id/messages` - Lister les messages
   - WebSocket pour temps réel (optionnel)

3. **API Participants**
   - `POST /api/events/:id/participants` - Inviter un participant
   - `PUT /api/events/:id/participation` - Rejoindre/Quitter

4. **API Organisation** (futur)
   - Budget & dépenses
   - Liste de tâches
   - Documents

### Frontend à améliorer
1. **Toast notifications**
   - Confirmation de copie du lien
   - Succès d'envoi de commentaire/message
   - Erreurs

2. **Temps réel**
   - WebSocket pour chat
   - Mise à jour auto des commentaires

3. **Optimisations**
   - Pagination des commentaires/messages
   - Lazy loading des participants
   - Cache des données

4. **Accessibilité**
   - ARIA labels
   - Navigation au clavier
   - Screen reader support

---

## 🧪 Tests recommandés

### Tests fonctionnels
- [ ] Chargement de l'événement
- [ ] Affichage correct des infos
- [ ] Liste des participants
- [ ] Envoi de commentaire
- [ ] Envoi de message chat
- [ ] Auto-scroll du chat
- [ ] Bouton retour
- [ ] Bouton modifier (organisateur)
- [ ] Bouton partager (copie lien)
- [ ] Modale ajout participant
- [ ] Responsive mobile/desktop

### Tests d'erreur
- [ ] Événement introuvable (404)
- [ ] Pas d'accès (403)
- [ ] Erreur réseau
- [ ] Token expiré

---

## 📝 Notes importantes

### Sécurité
- ✅ Route protégée par `AuthGuard`
- ✅ Token JWT requis
- ⚠️ Vérifier les permissions côté backend
- ⚠️ Valider les données avant envoi

### Performance
- ✅ Skeleton loaders pendant chargement
- ✅ Lazy rendering des messages
- ⚠️ Implémenter pagination si beaucoup de données
- ⚠️ Optimiser les re-renders

### UX
- ✅ Footer sticky pour actions rapides
- ✅ Auto-scroll du chat
- ✅ Feedback visuel sur les actions
- ⚠️ Ajouter des toasts de confirmation
- ⚠️ Gérer les états de chargement

---

## 🎯 Prochaines étapes

1. **Implémenter les APIs backend**
   - Commentaires
   - Chat
   - Gestion participants

2. **Ajouter les notifications toast**
   - Utiliser `notistack` ou équivalent

3. **Implémenter le temps réel**
   - WebSocket pour chat
   - Polling pour commentaires

4. **Créer la page d'édition**
   - `/events/[id]/edit`
   - Formulaire de modification

5. **Créer la page de gestion des participants**
   - `/events/[id]/participants`
   - Invitations, suppressions, rôles

6. **Implémenter les fonctionnalités d'organisation**
   - Budget
   - TODO list
   - Documents

---

## 📚 Ressources

### Composants MUI utilisés
- `Container`, `Box`, `Paper`, `Stack`
- `Typography`, `Button`, `IconButton`
- `Avatar`, `Chip`, `Divider`
- `TextField`, `Dialog`
- `Skeleton`

### Icônes Lucide
- `ArrowLeft`, `Edit`, `MapPin`, `Calendar`, `Clock`
- `User`, `Users`, `MessageSquare`, `Send`, `Share2`
- `UserPlus`, `Check`, `X`, `HelpCircle`
- `FileText`, `DollarSign`, `CheckSquare`

### Hooks Next.js
- `useParams` - Paramètres d'URL
- `useRouter` - Navigation
- `usePathname` - Chemin actuel

---

**Page créée avec succès ! 🎉**

Tous les layouts ont été mis à jour avec le bon padding (100px) pour correspondre au nouveau positionnement de la Navbar.
