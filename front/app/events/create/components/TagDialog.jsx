/**
 * Modale de création d'un tag personnalisé
 */

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Box,
  Typography,
  Chip,
} from "@mui/material";
import { Tag } from "lucide-react";
import { TAG_COLORS } from "../utils/tagColors";

/**
 * @param {Object} props
 * @param {boolean} props.open - État d'ouverture
 * @param {Function} props.onClose - Callback de fermeture
 * @param {string} props.tagName - Nom du tag
 * @param {Function} props.onTagNameChange - Callback de changement de nom
 * @param {string} props.tagColor - Couleur du tag
 * @param {Function} props.onTagColorChange - Callback de changement de couleur
 * @param {Function} props.onAdd - Callback d'ajout du tag
 */
export default function TagDialog({
  open,
  onClose,
  tagName,
  onTagNameChange,
  tagColor,
  onTagColorChange,
  onAdd,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Créer un tag</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Nom du tag */}
          <TextField
            fullWidth
            label="Nom du tag"
            placeholder="Ex: Sport, Soirée, Anniversaire..."
            value={tagName}
            onChange={(e) => onTagNameChange(e.target.value)}
            InputProps={{
              startAdornment: <Tag size={20} style={{ marginRight: 8 }} />,
            }}
          />

          {/* Sélection de la couleur */}
          <Box>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              Couleur
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
              {TAG_COLORS.map((color) => (
                <Box
                  key={color.value}
                  onClick={() => onTagColorChange(color.value)}
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    bgcolor: color.value,
                    cursor: "pointer",
                    border:
                      tagColor === color.value
                        ? "3px solid #000"
                        : "2px solid transparent",
                    transition: "all 0.2s",
                    "&:hover": {
                      transform: "scale(1.1)",
                    },
                  }}
                  title={color.name}
                />
              ))}
            </Box>
          </Box>

          {/* Aperçu du tag */}
          {tagName && (
            <Box>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                Aperçu
              </Typography>
              <Chip
                label={tagName}
                sx={{
                  bgcolor:
                    TAG_COLORS.find((c) => c.value === tagColor)?.light ||
                    "#F3F4F6",
                  color: tagColor,
                  fontWeight: 600,
                }}
              />
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button onClick={onAdd} variant="contained" disabled={!tagName.trim()}>
          Ajouter
        </Button>
      </DialogActions>
    </Dialog>
  );
}
