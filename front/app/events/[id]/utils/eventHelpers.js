/**
 * Fonctions utilitaires pour la page de détail d'événement
 */

// Réexporter les fonctions depuis les constantes
export {
  isUserOrganizer as isOrganizer,
  getUserParticipation as getMyParticipation,
  getStatusIcon,
  getStatusColor,
  getEventOwner,
} from "../../constants/participantConstants";

/**
 * Formate une date complète
 */
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

/**
 * Formate l'heure
 */
export const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Formate date et heure courte
 */
export const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};
