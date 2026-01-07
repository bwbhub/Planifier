/**
 * Modale de confirmation pour la création d'un événement
 * Affiche la date et l'heure sélectionnées et redirige vers le formulaire de création
 */

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";

/**
 * @param {Object} props
 * @param {boolean} props.open - État d'ouverture de la modale
 * @param {Function} props.onClose - Fonction de fermeture de la modale
 * @param {Object} props.selectedSlot - Créneau sélectionné { date: Date, hour: number }
 */
export default function CreateEventModal({ open, onClose, selectedSlot }) {
  const router = useRouter();

  /**
   * Gère la création d'un événement
   * Construit l'URL avec la date/heure de début et redirige vers le formulaire
   */
  const handleCreateEvent = () => {
    if (selectedSlot) {
      const startDate = new Date(selectedSlot.date);
      startDate.setHours(selectedSlot.hour, 0, 0, 0);

      // Créer une string ISO locale sans conversion UTC
      const year = startDate.getFullYear();
      const month = String(startDate.getMonth() + 1).padStart(2, "0");
      const day = String(startDate.getDate()).padStart(2, "0");
      const hours = String(startDate.getHours()).padStart(2, "0");
      const minutes = String(startDate.getMinutes()).padStart(2, "0");
      const localISOString = `${year}-${month}-${day}T${hours}:${minutes}:00`;

      router.push(`/events/create?start=${localISOString}`);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Créer un événement</DialogTitle>

      <DialogContent>
        <Typography>
          Voulez-vous créer un événement pour le{" "}
          {selectedSlot?.date.toLocaleDateString("fr-FR")} à{" "}
          {selectedSlot?.hour}h ?
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button variant="contained" onClick={handleCreateEvent}>
          Créer
        </Button>
      </DialogActions>
    </Dialog>
  );
}
