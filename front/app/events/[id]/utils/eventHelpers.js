/**
 * Fonctions utilitaires pour la page de détail d'événement
 */

import { Check, X, HelpCircle } from "lucide-react";

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

/**
 * Vérifie si l'utilisateur est organisateur
 */
export const isOrganizer = (event, user) => {
  if (!event || !user) return false;
  return event.participants?.some(
    (p) => p.userId === user.id && p.role === "ORGANIZER"
  );
};

/**
 * Récupère la participation de l'utilisateur
 */
export const getMyParticipation = (event, user) => {
  if (!event || !user) return null;
  return event.participants?.find((p) => p.userId === user.id);
};

/**
 * Récupère l'icône selon le statut
 */
export const getStatusIcon = (status) => {
  switch (status) {
    case "CONFIRMED":
      return <Check size={16} />;
    case "DECLINED":
      return <X size={16} />;
    case "MAYBE":
      return <HelpCircle size={16} />;
    default:
      return null;
  }
};

/**
 * Récupère la couleur selon le statut
 */
export const getStatusColor = (status) => {
  switch (status) {
    case "CONFIRMED":
      return "success";
    case "DECLINED":
      return "error";
    case "MAYBE":
      return "warning";
    default:
      return "default";
  }
};
