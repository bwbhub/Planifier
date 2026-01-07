/**
 * Composant d'upload d'image de couverture
 */

import React from "react";
import { Box, Typography, Button, IconButton, Divider } from "@mui/material";
import { Image as ImageIcon, X } from "lucide-react";

/**
 * @param {Object} props
 * @param {string} props.preview - URL de prévisualisation
 * @param {Function} props.onChange - Callback de changement d'image
 * @param {Function} props.onRemove - Callback de suppression
 */
export default function ImageUpload({ preview, onChange, onRemove }) {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onChange(file);
    }
  };

  return (
    <>
      <Divider />
      <Typography variant="h6" fontWeight="bold" color="primary">
        Image de couverture
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Ajoutez une image pour illustrer votre événement (optionnel)
      </Typography>

      {preview ? (
        <Box sx={{ position: "relative", width: "100%", maxWidth: 400 }}>
          <Box
            component="img"
            src={preview}
            alt="Aperçu"
            sx={{
              width: "100%",
              height: 200,
              objectFit: "cover",
              borderRadius: 2,
            }}
          />
          <IconButton
            onClick={onRemove}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              bgcolor: "background.paper",
              "&:hover": { bgcolor: "error.light" },
            }}
            size="small"
          >
            <X size={18} />
          </IconButton>
        </Box>
      ) : (
        <Button
          variant="outlined"
          component="label"
          startIcon={<ImageIcon size={20} />}
          sx={{ alignSelf: "flex-start" }}
        >
          Choisir une image
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={handleFileChange}
          />
        </Button>
      )}
    </>
  );
}
