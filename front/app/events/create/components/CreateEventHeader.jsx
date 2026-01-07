/**
 * En-tête de la page de création d'événement
 */

import React from "react";
import { Box, Typography } from "@mui/material";

export default function CreateEventHeader() {
  return (
    <Box sx={{ mb: 4, textAlign: "center" }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Créer un événement
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Organisez votre prochain événement entre amis
      </Typography>
    </Box>
  );
}
