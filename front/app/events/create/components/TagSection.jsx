/**
 * Section de gestion des tags pour l'événement
 */

import React from "react";
import { Box, Typography, Chip, Divider } from "@mui/material";
import { Plus } from "lucide-react";
import { TAG_COLORS } from "../utils/tagColors";

/**
 * @param {Object} props
 * @param {Array} props.tags - Liste des tags
 * @param {Function} props.onRemoveTag - Fonction de suppression d'un tag
 * @param {Function} props.onOpenDialog - Fonction d'ouverture de la modale
 */
export default function TagSection({ tags, onRemoveTag, onOpenDialog }) {
  return (
    <>
      <Divider />
      <Typography variant="h6" fontWeight="bold" color="primary">
        Tags
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Ajoutez des tags pour catégoriser votre événement
      </Typography>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {tags.map((tag) => {
          const tagColorObj = TAG_COLORS.find((c) => c.value === tag.color);
          return (
            <Chip
              key={tag.id}
              label={tag.name}
              onDelete={() => onRemoveTag(tag.id)}
              sx={{
                bgcolor: tagColorObj?.light || "#F3F4F6",
                color: tag.color,
                fontWeight: 600,
                "& .MuiChip-deleteIcon": {
                  color: tag.color,
                },
              }}
            />
          );
        })}
        <Chip
          icon={<Plus size={16} />}
          label="Ajouter un tag"
          onClick={onOpenDialog}
          variant="outlined"
          sx={{ cursor: "pointer" }}
        />
      </Box>
    </>
  );
}
