/**
 * Section d'informations principales de l'événement
 */

import React from "react";
import {
  Paper,
  Typography,
  Stack,
  Box,
  Avatar,
  TextField,
} from "@mui/material";
import { MapPin, FileText, User } from "lucide-react";

/**
 * @param {Object} props
 * @param {Object} props.event - Événement
 * @param {Object} props.organizer - Organisateur
 * @param {boolean} props.isEditing - Mode édition
 * @param {Object} props.editedEvent - Données éditées
 * @param {Function} props.onEditChange - Callback changement
 */
export default function EventInfo({
  event,
  organizer,
  isEditing,
  editedEvent,
  onEditChange,
}) {
  return (
    <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Informations
      </Typography>

      <Stack spacing={2.5}>
        {/* Lieu */}
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <MapPin size={20} style={{ marginTop: 2, flexShrink: 0 }} />
          <Box flex={1}>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              Lieu
            </Typography>
            {isEditing ? (
              <TextField
                fullWidth
                value={editedEvent?.location || ""}
                onChange={(e) =>
                  onEditChange({ ...editedEvent, location: e.target.value })
                }
                placeholder="Ajouter un lieu"
                size="small"
                sx={{ mt: 0.5 }}
              />
            ) : (
              <Typography variant="body1">
                {event.location || "Non spécifié"}
              </Typography>
            )}
          </Box>
        </Stack>

        {/* Description */}
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <FileText size={20} style={{ marginTop: 2, flexShrink: 0 }} />
          <Box flex={1}>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              Description
            </Typography>
            {isEditing ? (
              <TextField
                fullWidth
                multiline
                rows={4}
                value={editedEvent?.description || ""}
                onChange={(e) =>
                  onEditChange({ ...editedEvent, description: e.target.value })
                }
                placeholder="Ajouter une description"
                size="small"
                sx={{ mt: 0.5 }}
              />
            ) : (
              <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                {event.description || "Aucune description"}
              </Typography>
            )}
          </Box>
        </Stack>

        {/* Couleur */}
        {isEditing && (
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ width: 20, flexShrink: 0 }} />
            <Box flex={1}>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                Couleur
              </Typography>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}
              >
                <input
                  type="color"
                  value={editedEvent?.color || "#ff6b35"}
                  onChange={(e) =>
                    onEditChange({ ...editedEvent, color: e.target.value })
                  }
                  style={{
                    width: "50px",
                    height: "35px",
                    border: "2px solid #ddd",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  {editedEvent?.color || "#ff6b35"}
                </Typography>
              </Box>
            </Box>
          </Stack>
        )}

        {/* Organisateur */}
        {organizer && (
          <Stack direction="row" spacing={2} alignItems="center">
            <User size={20} style={{ flexShrink: 0 }} />
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                Organisateur
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar
                  src={organizer.avatarUrl}
                  sx={{ width: 24, height: 24 }}
                >
                  {organizer.name?.[0]}
                </Avatar>
                <Typography variant="body1">{organizer.name}</Typography>
              </Stack>
            </Box>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
