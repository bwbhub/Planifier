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
} from "@mui/material";
import { ArrowLeft, Edit, Calendar, Clock } from "lucide-react";
import { formatDate, formatTime } from "../utils/eventHelpers";

/**
 * @param {Object} props
 * @param {Object} props.event - Événement
 * @param {boolean} props.isOrganizer - L'utilisateur est-il organisateur
 * @param {Function} props.onBack - Callback retour
 * @param {Function} props.onEdit - Callback édition
 */
export default function EventHeader({ event, isOrganizer, onBack, onEdit }) {
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
        {isOrganizer && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<Edit size={16} />}
            onClick={onEdit}
          >
            Modifier
          </Button>
        )}
      </Stack>

      <Typography variant="h3" fontWeight="bold" gutterBottom>
        {event.title}
      </Typography>

      <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
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
      </Stack>
    </Paper>
  );
}
