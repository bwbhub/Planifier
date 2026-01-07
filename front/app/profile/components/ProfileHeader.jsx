/**
 * En-tête du profil utilisateur
 * Affiche l'avatar et les informations principales de l'utilisateur
 */

import React from "react";
import { Avatar, Box, Typography, Stack } from "@mui/material";

/**
 * @param {Object} props
 * @param {string} props.name - Nom de l'utilisateur
 * @param {string} props.email - Email de l'utilisateur
 */
export default function ProfileHeader({ name, email }) {
  return (
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
  );
}
