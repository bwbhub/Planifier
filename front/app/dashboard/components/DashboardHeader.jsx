/**
 * En-tête du dashboard
 * Affiche le message de bienvenue et la description
 */

import React from "react";
import { Box, Typography } from "@mui/material";

/**
 * @param {Object} props
 * @param {string} props.userName - Nom de l'utilisateur
 */
export default function DashboardHeader({ userName }) {
  return (
    <Box sx={{ mb: 5 }}>
      <Typography variant="h4" fontWeight="800" gutterBottom>
        Bonjour, {userName || "Alex"} 👋
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Voici ce qui se passe aujourd&apos;hui.
      </Typography>
    </Box>
  );
}
