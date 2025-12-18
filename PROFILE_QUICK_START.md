# 🚀 Quick Start : Page Profil Utilisateur

## ✅ Ce qui a été créé

### Backend
1. **Contrôleur** : `back/src/controllers/authController.js`
   - Fonction `updateProfile()` ajoutée

2. **Route** : `back/src/routes/authRoutes.js`
   - `PUT /api/auth/me` ajoutée

### Frontend
1. **Page** : `front/app/profile/page.js`
   - Formulaire complet avec validation

2. **Layout** : `front/app/profile/layout.js`
   - Protection avec AuthGuard

3. **Contexte** : `front/context/AuthContext.js`
   - Fonction `updateUser()` ajoutée

---

## 🎯 Comment ça marche ?

### 1. L'utilisateur charge la page `/profile`

```javascript
// Au chargement, on récupère les données
useEffect(() => {
  const fetchProfile = async () => {
    const res = await fetch("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    
    // Pré-remplir les champs
    setName(data.name);
    setEmail(data.email);
  };
  
  fetchProfile();
}, [token]);
```

### 2. L'utilisateur modifie ses infos et clique "Enregistrer"

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validation
  if (password !== confirmPassword) {
    setError("Les mots de passe ne correspondent pas");
    return;
  }
  
  // Préparer les données
  const updateData = {};
  if (name.trim()) updateData.name = name.trim();
  if (email.trim()) updateData.email = email.trim();
  if (password.trim()) updateData.password = password.trim();
  
  // Envoyer à l'API
  const res = await fetch("/api/auth/me", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updateData),
  });
  
  const data = await res.json();
  
  if (res.ok) {
    // Mettre à jour le contexte
    updateUser(data);
    setSuccess("Profil mis à jour !");
  } else {
    setError(data.error);
  }
};
```

### 3. Le backend traite la requête

```javascript
// back/src/controllers/authController.js
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  
  // Vérifier si l'email est déjà utilisé
  if (email && email !== req.user.email) {
    const emailExists = await prisma.user.findUnique({
      where: { email },
    });
    if (emailExists) {
      throw new Error("Cet email est déjà utilisé");
    }
  }
  
  // Préparer les données
  const updateData = {
    name: name || req.user.name,
    email: email || req.user.email,
  };
  
  // Hasher le nouveau mot de passe si fourni
  if (password && password.trim() !== "") {
    const salt = await bcrypt.genSalt(10);
    updateData.passwordHash = await bcrypt.hash(password, salt);
  }
  
  // Mettre à jour
  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: updateData,
  });
  
  // Retourner les nouvelles données + nouveau token
  res.json({
    id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    token: generateToken(updatedUser.id),
  });
});
```

---

## 📋 États du composant

```javascript
// Champs du formulaire
const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");

// États de chargement
const [loading, setLoading] = useState(true);  // Chargement initial
const [saving, setSaving] = useState(false);   // Sauvegarde en cours

// Messages
const [error, setError] = useState("");        // Message d'erreur
const [success, setSuccess] = useState("");    // Message de succès
```

---

## 🎨 Structure du formulaire

```jsx
<Box component="form" onSubmit={handleSubmit}>
  {/* Messages */}
  {error && <Alert severity="error">{error}</Alert>}
  {success && <Alert severity="success">{success}</Alert>}
  
  {/* Champs */}
  <TextField
    label="Nom complet"
    value={name}
    onChange={(e) => setName(e.target.value)}
  />
  
  <TextField
    label="Email"
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
  
  <TextField
    label="Nouveau mot de passe"
    type="password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
  />
  
  <TextField
    label="Confirmer le mot de passe"
    type="password"
    value={confirmPassword}
    onChange={(e) => setConfirmPassword(e.target.value)}
  />
  
  {/* Bouton */}
  <Button type="submit" disabled={saving}>
    {saving ? "Enregistrement..." : "Enregistrer"}
  </Button>
</Box>
```

---

## 🔐 Sécurité

### Frontend
- ✅ Route protégée par `AuthGuard`
- ✅ Token JWT envoyé dans les headers
- ✅ Validation des mots de passe
- ✅ Trim des champs (suppression des espaces)

### Backend
- ✅ Middleware `protect` vérifie le token
- ✅ Vérification de l'unicité de l'email
- ✅ Hash du mot de passe avec bcrypt
- ✅ Génération d'un nouveau token après modification

---

## 🧪 Tester la page

1. **Démarrer le backend** :
   ```bash
   cd back
   npm run dev
   ```

2. **Démarrer le frontend** :
   ```bash
   cd front
   npm run dev
   ```

3. **Accéder à la page** :
   - Se connecter : `http://localhost:3000/login`
   - Aller sur le profil : `http://localhost:3000/profile`
   - Ou cliquer sur l'icône User dans la navbar

4. **Tester les modifications** :
   - Changer le nom → Enregistrer → ✅ Succès
   - Changer l'email → Enregistrer → ✅ Succès
   - Changer le mot de passe → Enregistrer → ✅ Succès
   - Mettre un email existant → ✅ Erreur affichée

---

## 🐛 Problèmes courants

### "Token invalide" ou "401 Unauthorized"
**Cause** : Le token a expiré ou n'est pas envoyé.  
**Solution** : Se reconnecter.

### "Cet email est déjà utilisé"
**Cause** : Un autre utilisateur utilise cet email.  
**Solution** : Choisir un autre email.

### Les champs ne se pré-remplissent pas
**Cause** : Erreur lors du chargement des données.  
**Solution** : Vérifier la console du navigateur (F12).

---

## 📝 Résumé du flux

```
1. User visite /profile
   ↓
2. useEffect() → GET /api/auth/me
   ↓
3. Pré-remplir les champs
   ↓
4. User modifie et clique "Enregistrer"
   ↓
5. Validation frontend
   ↓
6. PUT /api/auth/me avec les nouvelles données
   ↓
7. Backend valide et met à jour
   ↓
8. Réponse avec nouvelles données + token
   ↓
9. updateUser() met à jour le contexte
   ↓
10. Message de succès affiché
```

---

**C'est prêt ! 🎉**  
La page de profil est complètement fonctionnelle et sécurisée.
