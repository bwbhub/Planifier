/**
 * Formulaire de modification du profil utilisateur
 * Gère tous les champs du profil et la soumission
 */

import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Divider,
  Typography,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import { User, Mail, Save } from "lucide-react";
import PasswordFields from "./PasswordFields.jsx";

/**
 * @param {Object} props
 * @param {Object} props.profile - Données du profil
 * @param {boolean} props.saving - État de sauvegarde
 * @param {string} props.error - Message d'erreur
 * @param {string} props.success - Message de succès
 * @param {Function} props.onSubmit - Callback de soumission
 * @param {Function} props.onErrorClose - Callback de fermeture d'erreur
 * @param {Function} props.onSuccessClose - Callback de fermeture de succès
 */
export default function ProfileForm({
  profile,
  saving,
  error,
  success,
  onSubmit,
  onErrorClose,
  onSuccessClose,
}) {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [preferredTheme, setPreferredTheme] = useState(profile.preferredTheme);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation des mots de passe
    if (password && password !== confirmPassword) {
      onErrorClose();
      onSubmit(null, "Les mots de passe ne correspondent pas");
      return;
    }

    // Validation : au moins un champ modifié
    if (!name.trim() && !email.trim() && !password.trim() && !preferredTheme) {
      onErrorClose();
      onSubmit(null, "Veuillez remplir au moins un champ");
      return;
    }

    // Préparer les données
    const updateData = {};
    if (name.trim()) updateData.name = name.trim();
    if (email.trim()) updateData.email = email.trim();
    if (password.trim()) updateData.password = password.trim();
    if (preferredTheme) updateData.preferredTheme = preferredTheme;

    // Soumettre
    onSubmit(updateData).then((success) => {
      if (success) {
        // Réinitialiser les mots de passe
        setPassword("");
        setConfirmPassword("");
      }
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {/* Messages d'erreur et de succès */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={onErrorClose}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={onSuccessClose}>
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

        {/* Section : Mot de passe */}
        <PasswordFields
          password={password}
          confirmPassword={confirmPassword}
          onPasswordChange={setPassword}
          onConfirmPasswordChange={setConfirmPassword}
          disabled={saving}
        />

        <Divider sx={{ my: 2 }} />

        {/* Section : Thème */}
        <Typography variant="h6" fontWeight="bold">
          Changer le thème
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Choisissez votre thème préféré
        </Typography>

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
          startIcon={
            saving ? <CircularProgress size={20} /> : <Save size={20} />
          }
          sx={{ mt: 2 }}
        >
          {saving ? "Enregistrement..." : "Enregistrer les modifications"}
        </Button>
      </Stack>
    </Box>
  );
}
