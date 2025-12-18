# 📝 Guide de la Page Profil Utilisateur

## 🎯 Vue d'ensemble

La page de profil permet à l'utilisateur de :
- ✅ Voir ses informations actuelles (nom, email)
- ✅ Modifier son nom et son email
- ✅ Changer son mot de passe (optionnel)
- ✅ Voir un avatar avec son initiale

---

## 📂 Structure des fichiers

```
front/
├── app/
│   └── profile/
│       ├── page.js          # Page principale du profil
│       └── layout.js        # Layout avec AuthGuard + Navbar
├── context/
│   └── AuthContext.js       # Contexte d'authentification (mis à jour)
└── components/
    └── Navbar.js            # Navigation (lien vers /profile déjà présent)

back/
├── src/
│   ├── controllers/
│   │   └── authController.js  # Contrôleur avec updateProfile()
│   └── routes/
│       └── authRoutes.js      # Route PUT /api/auth/me
```

---

## 🔧 Backend : Routes API

### 1. **GET /api/auth/me** (déjà existante)
Récupère les informations de l'utilisateur connecté.

**Headers requis :**
```
Authorization: Bearer <token>
```

**Réponse :**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com"
}
```

---

### 2. **PUT /api/auth/me** (nouvelle)
Met à jour les informations de l'utilisateur connecté.

**Headers requis :**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body (tous les champs sont optionnels) :**
```json
{
  "name": "Nouveau Nom",
  "email": "nouveau@email.com",
  "password": "nouveauMotDePasse"
}
```

**Réponse :**
```json
{
  "id": 1,
  "name": "Nouveau Nom",
  "email": "nouveau@email.com",
  "token": "nouveau_token_jwt"
}
```

**Erreurs possibles :**
- `400` : Email déjà utilisé par un autre utilisateur
- `404` : Utilisateur non trouvé
- `401` : Token invalide ou manquant

---

## 💻 Frontend : Composant ProfilePage

### Structure du composant

```javascript
export default function ProfilePage() {
  // 1. Contexte d'authentification
  const { user, token, updateUser } = useAuth();

  // 2. États locaux
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 3. Chargement des données au montage
  useEffect(() => {
    fetchProfile();
  }, [token]);

  // 4. Soumission du formulaire
  const handleSubmit = async (e) => {
    // Validation + Appel API PUT
  };

  // 5. Rendu du formulaire
  return (
    <Container>
      {/* Avatar + Formulaire */}
    </Container>
  );
}
```

---

## 🔄 Flux de données

### 1. **Chargement initial**
```
Page montée
    ↓
useEffect() déclenché
    ↓
fetch("/api/auth/me", { GET })
    ↓
Pré-remplir les champs (name, email)
    ↓
setLoading(false)
```

### 2. **Modification du profil**
```
User remplit le formulaire
    ↓
User clique "Enregistrer"
    ↓
Validation (mots de passe correspondent ?)
    ↓
fetch("/api/auth/me", { PUT, body: {...} })
    ↓
Réponse OK ?
    ├─ OUI → updateUser(data) + Message succès
    └─ NON → Afficher erreur
```

---

## 🎨 Interface utilisateur

### Éléments visuels
- **Avatar** : Cercle avec l'initiale du nom (ex: "J" pour John)
- **Champs de formulaire** :
  - Nom complet (icône User)
  - Email (icône Mail)
  - Nouveau mot de passe (icône Lock, optionnel)
  - Confirmer mot de passe (icône Lock, optionnel)
- **Bouton** : "Enregistrer les modifications" avec icône Save
- **Messages** :
  - Succès (vert) : "Profil mis à jour avec succès !"
  - Erreur (rouge) : Message d'erreur de l'API

### États du bouton
- **Normal** : "Enregistrer les modifications"
- **Chargement** : "Enregistrement..." + spinner
- **Désactivé** : Pendant la sauvegarde

---

## 🛡️ Sécurité

### Protection de la route
La page est protégée par `AuthGuard` dans le layout :
```javascript
// app/profile/layout.js
<AuthGuard>
  <Navbar />
  {children}
</AuthGuard>
```

### Validation côté frontend
- Les mots de passe doivent correspondre
- Au moins un champ doit être rempli
- Les champs sont trimés (espaces supprimés)

### Validation côté backend
- Token JWT vérifié par le middleware `protect`
- Email unique vérifié avant mise à jour
- Mot de passe hashé avec bcrypt
- Nouveau token généré après modification

---

## 🧪 Tests manuels

### Test 1 : Chargement de la page
1. Se connecter
2. Aller sur `/profile`
3. ✅ Les champs doivent être pré-remplis avec nom et email

### Test 2 : Modifier le nom
1. Changer le nom
2. Cliquer "Enregistrer"
3. ✅ Message de succès affiché
4. ✅ Navbar et avatar mis à jour

### Test 3 : Changer le mot de passe
1. Remplir "Nouveau mot de passe"
2. Remplir "Confirmer mot de passe" (différent)
3. Cliquer "Enregistrer"
4. ✅ Erreur : "Les mots de passe ne correspondent pas"
5. Corriger et soumettre
6. ✅ Message de succès

### Test 4 : Email déjà utilisé
1. Changer l'email pour un email existant
2. Cliquer "Enregistrer"
3. ✅ Erreur : "Cet email est déjà utilisé"

---

## 🐛 Débogage

### Problème : Champs vides au chargement
- Vérifier que le token est présent dans localStorage
- Vérifier la console pour les erreurs API
- Vérifier que `GET /api/auth/me` retourne bien les données

### Problème : Erreur 401 lors de la sauvegarde
- Vérifier que le token est valide
- Vérifier que le header `Authorization` est bien envoyé
- Vérifier que le backend n'a pas redémarré (token expiré)

### Problème : Message de succès ne s'affiche pas
- Vérifier que `updateUser()` est bien appelé
- Vérifier la console pour les erreurs
- Vérifier que la réponse API contient bien `id`, `name`, `email`, `token`

---

## 📚 Ressources

### Composants MUI utilisés
- `Container` : Conteneur responsive
- `Paper` : Carte avec ombre
- `TextField` : Champs de formulaire
- `Button` : Bouton d'action
- `Avatar` : Avatar circulaire
- `Alert` : Messages d'erreur/succès
- `CircularProgress` : Spinner de chargement

### Icônes Lucide React
- `User` : Icône utilisateur
- `Mail` : Icône email
- `Lock` : Icône cadenas
- `Save` : Icône sauvegarde

---

## 🚀 Améliorations futures

- [ ] Upload d'avatar (image)
- [ ] Validation email en temps réel
- [ ] Force du mot de passe (indicateur visuel)
- [ ] Historique des modifications
- [ ] Authentification à deux facteurs (2FA)
- [ ] Suppression du compte

---

**Créé le :** 25 novembre 2025  
**Version :** 1.0  
**Auteur :** Cascade AI
