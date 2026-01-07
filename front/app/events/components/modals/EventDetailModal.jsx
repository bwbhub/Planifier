/**
 * Modale de détail d'un événement
 * Affiche toutes les informations d'un événement : date, heure, lieu, description, participants
 * Permet de naviguer vers la page complète de l'événement
 */

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  Divider,
  Chip,
  Avatar,
} from "@mui/material";
import {
  Calendar as CalendarIcon,
  MapPin,
  Users,
  ExternalLink,
} from "lucide-react";

/**
 * @param {Object} props
 * @param {boolean} props.open - État d'ouverture de la modale
 * @param {Object} props.event - Événement à afficher
 * @param {Function} props.onClose - Fonction de fermeture de la modale
 * @param {Function} props.onViewEvent - Fonction pour voir l'événement complet
 */
export default function EventDetailModal({
  open,
  event,
  onClose,
  onViewEvent,
}) {
  if (!event) return null;

  const startDate = new Date(event.startDate);
  const endDate = event.endDate ? new Date(event.endDate) : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          m: { xs: 2, sm: 3 },
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: "bold", fontSize: "1.5rem" }}>
        {event.title}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5}>
          {/* Date et heure */}
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
            <CalendarIcon size={20} style={{ marginTop: 2, flexShrink: 0 }} />
            <Box>
              <Typography variant="body1" fontWeight="600">
                {startDate.toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {startDate.toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {endDate &&
                  ` → ${endDate.toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`}
              </Typography>
            </Box>
          </Box>

          {/* Lieu */}
          {event.location && (
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
              <MapPin size={20} style={{ marginTop: 2, flexShrink: 0 }} />
              <Typography variant="body1">{event.location}</Typography>
            </Box>
          )}

          {/* Description */}
          {event.description && (
            <>
              <Divider />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ whiteSpace: "pre-wrap" }}
              >
                {event.description}
              </Typography>
            </>
          )}

          {/* Participants */}
          {event.participants && event.participants.length > 0 && (
            <>
              <Divider />
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    gap: 1.5,
                    alignItems: "center",
                    mb: 1.5,
                  }}
                >
                  <Users size={20} />
                  <Typography variant="body1" fontWeight="600">
                    Participants (
                    {event._count?.participants || event.participants.length})
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {event.participants.slice(0, 5).map((participant, index) => (
                    <Chip
                      key={index}
                      avatar={
                        <Avatar>{participant.user?.name?.[0] || "?"}</Avatar>
                      }
                      label={participant.user?.name || "Utilisateur"}
                      size="small"
                      variant={
                        participant.role === "OWNER" ? "filled" : "outlined"
                      }
                      color={
                        participant.role === "OWNER" ? "primary" : "default"
                      }
                    />
                  ))}
                  {event.participants.length > 5 && (
                    <Chip
                      label={`+${event.participants.length - 5}`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Stack>
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Fermer
        </Button>
        <Button
          onClick={onViewEvent}
          variant="contained"
          endIcon={<ExternalLink size={18} />}
        >
          Voir l&apos;événement
        </Button>
      </DialogActions>
    </Dialog>
  );
}
