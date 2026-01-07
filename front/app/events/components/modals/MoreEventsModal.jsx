/**
 * Modale affichant la liste complète des événements pour un créneau horaire
 * Utilisée quand il y a plus de 3 événements dans une même heure
 */

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
} from "@mui/material";
import { useRouter } from "next/navigation";

/**
 * @param {Object} props
 * @param {boolean} props.open - État d'ouverture de la modale
 * @param {Function} props.onClose - Fonction de fermeture de la modale
 * @param {Object} props.data - Données des événements { date: Date, events: Array }
 */
export default function MoreEventsModal({ open, onClose, data }) {
  const router = useRouter();

  /**
   * Gère le clic sur un événement
   * Redirige vers la page de détail de l'événement
   */
  const handleEventClick = (eventId) => {
    router.push(`/events/${eventId}`);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Événements du{" "}
        {data?.date.toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={1} sx={{ mt: 1 }}>
          {data?.events.map((event) => {
            const startDate = new Date(event.startDate);
            const endDate = event.endDate
              ? new Date(event.endDate)
              : new Date(startDate.getTime() + 60 * 60 * 1000);

            return (
              <Box
                key={event.id}
                onClick={() => handleEventClick(event.id)}
                sx={{
                  p: 1.5,
                  bgcolor: "primary.main",
                  color: "white",
                  borderRadius: 1,
                  cursor: "pointer",
                  "&:hover": {
                    bgcolor: "primary.dark",
                  },
                }}
              >
                <Typography variant="body2" fontWeight="bold">
                  {event.title}
                </Typography>

                <Typography
                  variant="caption"
                  sx={{ display: "block", mt: 0.5 }}
                >
                  {startDate.toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  -{" "}
                  {endDate.toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Typography>

                {event.location && (
                  <Typography
                    variant="caption"
                    sx={{ display: "block", mt: 0.5, opacity: 0.9 }}
                  >
                    📍 {event.location}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
}
