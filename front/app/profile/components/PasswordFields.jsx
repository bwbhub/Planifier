/**
 * Champs de modification du mot de passe
 * Permet à l'utilisateur de changer son mot de passe avec confirmation
 */

import React, { useState } from "react";
import {
  TextField,
  IconButton,
  InputAdornment,
  Typography,
  Stack,
} from "@mui/material";
import { Lock, Eye, EyeOff } from "lucide-react";

/**
 * @param {Object} props
 * @param {string} props.password - Valeur du mot de passe
 * @param {string} props.confirmPassword - Valeur de confirmation
 * @param {Function} props.onPasswordChange - Callback pour le changement de mot de passe
 * @param {Function} props.onConfirmPasswordChange - Callback pour la confirmation
 * @param {boolean} props.disabled - État désactivé des champs
 */
export default function PasswordFields({
  password,
  confirmPassword,
  onPasswordChange,
  onConfirmPasswordChange,
  disabled,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <Stack spacing={3}>
      <Typography variant="h6" fontWeight="bold">
        Changer le mot de passe
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Laissez vide si vous ne souhaitez pas changer votre mot de passe
      </Typography>

      {/* Nouveau mot de passe */}
      <TextField
        fullWidth
        label="Nouveau mot de passe"
        type={showPassword ? "text" : "password"}
        placeholder="••••••••"
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
        disabled={disabled}
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

      {/* Confirmer le mot de passe */}
      <TextField
        fullWidth
        label="Confirmer le mot de passe"
        type={showConfirmPassword ? "text" : "password"}
        placeholder="••••••••"
        value={confirmPassword}
        onChange={(e) => onConfirmPasswordChange(e.target.value)}
        disabled={disabled}
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
    </Stack>
  );
}
