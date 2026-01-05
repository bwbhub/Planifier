"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Avatar,
  Stack,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { User, Mail, Lock, Save, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

/**
 * Page de profil utilisateur
 * 
 * Cette page permet à l'utilisateur de :
 * 1. Voir ses informations actuelles (nom, email)
 * 2. Modifier ses informations
 * 3. Changer son mot de passe (optionnel)
 */
export default function ProfilePage() {
  // ========================================
  // 1. RÉCUPÉRATION DU CONTEXTE D'AUTHENTIFICATION
  // ========================================
  const { user, token, updateUser } = useAuth();

  // ========================================
  // 2. ÉTATS LOCAUX POUR LE FORMULAIRE
  // ========================================
  // Champs du formulaire
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [preferredTheme, setPreferredTheme] = useState("");

  // États de chargement et messages
  const [loading, setLoading] = useState(true); // Chargement initial des données
  const [saving, setSaving] = useState(false); // Sauvegarde en cours
  const [error, setError] = useState(""); // Message d'erreur
  const [success, setSuccess] = useState(""); // Message de succès
  
  // États pour afficher/masquer les mots de passe
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ========================================
  // 3. CHARGEMENT DES DONNÉES AU MONTAGE DU COMPOSANT
  // ========================================
  useEffect(() => {
    /**
     * Fonction pour récupérer les données du profil depuis l'API
     * Cette fonction s'exécute une seule fois au chargement de la page
     */
    const fetchProfile = async () => {
      try {
        // Appel GET vers l'API pour récupérer les infos du user
        const res = await fetch("/api/auth/me", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Token JWT pour l'authentification
          },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Erreur lors du chargement du profil");
        }

        // Pré-remplir les champs du formulaire avec les données récupérées
        setName(data.name || "");
        setEmail(data.email || "");
        setPreferredTheme(data.preferredTheme || "");
        setLoading(false); // Fin du chargement
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    // Lancer la récupération des données
    if (token) {
      fetchProfile();
    }
  }, [token]); // Se déclenche quand le token change

  // ========================================
  // 4. FONCTION DE SAUVEGARDE DES MODIFICATIONS
  // ========================================
  const handleSubmit = async (e) => {
    e.preventDefault(); // Empêcher le rechargement de la page

    // Réinitialiser les messages
    setError("");
    setSuccess("");

    // Validation : vérifier que les mots de passe correspondent
    if (password && password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    // Validation : au moins un champ doit être modifié
    if (!name.trim() && !email.trim() && !password.trim() && !preferredTheme) {
      setError("Veuillez remplir au moins un champ");
      return;
    }

    setSaving(true); // Démarrer l'état de sauvegarde

    try {
      // Préparer les données à envoyer (seulement les champs remplis)
      const updateData = {};
      if (name.trim()) updateData.name = name.trim();
      if (email.trim()) updateData.email = email.trim();
      if (password.trim()) updateData.password = password.trim();
      if (preferredTheme) updateData.preferredTheme = preferredTheme;
      
      // Appel PUT vers l'API pour mettre à jour le profil
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }

      // Mise à jour réussie !
      setSuccess("Profil mis à jour avec succès !");
      
      // Mettre à jour le contexte d'authentification avec les nouvelles données
      updateUser(data);

      // Réinitialiser les champs de mot de passe
      setPassword("");
      setConfirmPassword("");

      // Faire disparaître le message de succès après 3 secondes
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false); // Fin de la sauvegarde
    }
  };

  // ========================================
  // 5. AFFICHAGE PENDANT LE CHARGEMENT
  // ========================================
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "80vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // ========================================
  // 6. CHARGEMENTS DES ÉVÉNEMENTS
  // ========================================


  // ========================================
  // 7. RENDU DE LA PAGE
  // ========================================
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Titre de la page */}
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Mon Profil
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Gérez vos informations personnelles
      </Typography>

      <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
        {/* Avatar et nom d'utilisateur */}
        <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 4 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: "primary.main",
              fontSize: "2rem",
            }}
          >
            {name ? name.charAt(0).toUpperCase() : "U"}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {name || "Utilisateur"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {email || "email@example.com"}
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ my: 3 }} />

        {/* Formulaire de modification */}
        <Box component="form" onSubmit={handleSubmit}>
          {/* Messages d'erreur et de succès */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess("")}>
              {success}
            </Alert>
          )}

          <Stack spacing={3}>
            {/* Section : Informations personnelles */}
            <Typography variant="h6" fontWeight="bold">
              Informations personnelles
            </Typography>

            {/* Champ : Nom */}
            <TextField
              fullWidth
              label="Nom complet"
              placeholder="Votre nom"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
              InputProps={{
                startAdornment: <User size={20} style={{ marginRight: 8 }} />,
              }}
            />

            {/* Champ : Email */}
            <TextField
              fullWidth
              label="Email"
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={saving}
              InputProps={{
                startAdornment: <Mail size={20} style={{ marginRight: 8 }} />,
              }}
            />

            <Divider sx={{ my: 2 }} />

            {/* Section : Changer le mot de passe (optionnel) */}
            <Typography variant="h6" fontWeight="bold">
              Changer le mot de passe
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Laissez vide si vous ne souhaitez pas changer votre mot de passe
            </Typography>

            {/* Champ : Nouveau mot de passe */}
            <TextField
              fullWidth
              label="Nouveau mot de passe"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={saving}
              InputProps={{
                startAdornment: <Lock size={20} style={{ marginRight: 8 }} />,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Champ : Confirmer le mot de passe */}
            <TextField
              fullWidth
              label="Confirmer le mot de passe"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={saving}
              InputProps={{
                startAdornment: <Lock size={20} style={{ marginRight: 8 }} />,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      size="small"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Divider sx={{ my: 2 }} />
            
            {/* Section : Changer le mot de passe (optionnel) */}
            <Typography variant="h6" fontWeight="bold">
              Changer le thème
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Choisissez votre thème préféré
            </Typography>

            {/* Thème préféré */}
            <FormControl fullWidth>
              <Select
                value={preferredTheme}
                onChange={(e) => setPreferredTheme(e.target.value)}
                disabled={saving}
              >
                <MenuItem value="light">Clair</MenuItem>
                <MenuItem value="dark">Sombre</MenuItem>
              </Select>
            </FormControl>

            {/* Bouton de sauvegarde */}
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : <Save size={20} />}
              sx={{ mt: 2 }}
            >
              {saving ? "Enregistrement..." : "Enregistrer les modifications"}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
}
