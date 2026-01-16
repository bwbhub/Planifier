/**
 * En-tête de la page de détail d'événement
 */

import React from "react";
import {
  Paper,
  Stack,
  IconButton,
  Button,
  Typography,
  Chip,
  alpha,
  useTheme,
  TextField,
} from "@mui/material";
import { ArrowLeft, Edit, Calendar, Clock, Save, X } from "lucide-react";
import { formatDate, formatTime } from "../utils/eventHelpers";

/**
 * @param {Object} props
 * @param {Object} props.event - Événement
 * @param {boolean} props.isOrganizer - L'utilisateur est-il organisateur
 * @param {Function} props.onBack - Callback retour
 * @param {Function} props.onEdit - Callback édition
 * @param {boolean} props.isEditing - Mode édition
 * @param {Object} props.editedEvent - Données éditées
 * @param {Function} props.onEditChange - Callback changement
 * @param {Function} props.onSave - Callback sauvegarde
 * @param {Function} props.onCancel - Callback annulation
 * @param {boolean} props.saving - État de sauvegarde
 */
export default function EventHeader({
  event,
  isOrganizer,
  onBack,
  onEdit,
  isEditing,
  editedEvent,
  onEditChange,
  onSave,
  onCancel,
  saving,
}) {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 3,
        borderRadius: 2,
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.primary.main,
          0.1
        )} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      >
        <IconButton onClick={onBack} size="small">
          <ArrowLeft size={20} />
        </IconButton>
        {isOrganizer && !isEditing && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<Edit size={16} />}
            onClick={onEdit}
          >
            Modifier
          </Button>
        )}
        {isEditing && (
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<X size={16} />}
              onClick={onCancel}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<Save size={16} />}
              onClick={onSave}
              disabled={saving}
            >
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </Stack>
        )}
      </Stack>

      {isEditing ? (
        <TextField
          fullWidth
          value={editedEvent?.title || ""}
          onChange={(e) =>
            onEditChange({ ...editedEvent, title: e.target.value })
          }
          variant="outlined"
          sx={{ mb: 2 }}
          inputProps={{
            style: { fontSize: "2rem", fontWeight: "bold" },
          }}
        />
      ) : (
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          {event.title}
        </Typography>
      )}

      <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
        {isEditing ? (
          <>
            <TextField
              type="datetime-local"
              label="Date de début"
              value={
                editedEvent?.startDate
                  ? new Date(editedEvent.startDate).toISOString().slice(0, 16)
                  : ""
              }
              onChange={(e) =>
                onEditChange({ ...editedEvent, startDate: e.target.value })
              }
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              type="datetime-local"
              label="Date de fin"
              value={
                editedEvent?.endDate
                  ? new Date(editedEvent.endDate).toISOString().slice(0, 16)
                  : ""
              }
              onChange={(e) =>
                onEditChange({ ...editedEvent, endDate: e.target.value })
              }
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </>
        ) : (
          <>
            <Chip
              icon={<Calendar size={16} />}
              label={formatDate(event.startDate)}
              variant="outlined"
            />
            <Chip
              icon={<Clock size={16} />}
              label={`${formatTime(event.startDate)}${
                event.endDate ? ` → ${formatTime(event.endDate)}` : ""
              }`}
              variant="outlined"
            />
          </>
        )}
      </Stack>
    </Paper>
  );
}
