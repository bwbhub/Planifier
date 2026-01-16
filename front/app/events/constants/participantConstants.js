/**
 * Constantes et helpers pour les participants d'événements
 * Centralise tous les rôles, statuts et leurs labels/couleurs
 */

import { Check, X, HelpCircle } from "lucide-react";

// ========================================
// ENUMS - Rôles des participants
// ========================================
export const ParticipantRole = {
  OWNER: "OWNER",
  ORGANIZER: "ORGANIZER",
  GUEST: "GUEST",
};

// ========================================
// ENUMS - Statuts de participation
// ========================================
export const ParticipantStatus = {
  GOING: "GOING",
  CONFIRMED: "CONFIRMED",
  MAYBE: "MAYBE",
  DECLINED: "DECLINED",
  NOT_GOING: "NOT_GOING",
  PENDING: "PENDING",
};

// ========================================
// LABELS - Traductions françaises
// ========================================
export const RoleLabels = {
  [ParticipantRole.OWNER]: "Organisateur",
  [ParticipantRole.ORGANIZER]: "Organisateur",
  [ParticipantRole.GUEST]: "Invité",
};

export const StatusLabels = {
  [ParticipantStatus.GOING]: "Confirmé",
  [ParticipantStatus.CONFIRMED]: "Confirmé",
  [ParticipantStatus.MAYBE]: "Peut-être",
  [ParticipantStatus.DECLINED]: "Refusé",
  [ParticipantStatus.NOT_GOING]: "Refusé",
  [ParticipantStatus.PENDING]: "En attente",
};

// ========================================
// COULEURS - Pour les Chips MUI
// ========================================
export const StatusColors = {
  [ParticipantStatus.GOING]: "success",
  [ParticipantStatus.CONFIRMED]: "success",
  [ParticipantStatus.MAYBE]: "warning",
  [ParticipantStatus.DECLINED]: "error",
  [ParticipantStatus.NOT_GOING]: "error",
  [ParticipantStatus.PENDING]: "default",
};

// ========================================
// ICÔNES - Pour les statuts
// ========================================
export const StatusIcons = {
  [ParticipantStatus.GOING]: <Check size={16} />,
  [ParticipantStatus.CONFIRMED]: <Check size={16} />,
  [ParticipantStatus.DECLINED]: <X size={16} />,
  [ParticipantStatus.NOT_GOING]: <X size={16} />,
  [ParticipantStatus.MAYBE]: <HelpCircle size={16} />,
  [ParticipantStatus.PENDING]: null,
};

// ========================================
// HELPERS - Fonctions utilitaires
// ========================================

/**
 * Récupère le label d'un rôle
 */
export const getRoleLabel = (role) => {
  return RoleLabels[role] || "Participant";
};

/**
 * Récupère le label d'un statut
 */
export const getStatusLabel = (status) => {
  return StatusLabels[status] || "Inconnu";
};

/**
 * Récupère la couleur d'un statut
 */
export const getStatusColor = (status) => {
  return StatusColors[status] || "default";
};

/**
 * Récupère l'icône d'un statut
 */
export const getStatusIcon = (status) => {
  return StatusIcons[status] || null;
};

/**
 * Vérifie si un rôle est organisateur (OWNER ou ORGANIZER)
 */
export const isOrganizerRole = (role) => {
  return role === ParticipantRole.OWNER || role === ParticipantRole.ORGANIZER;
};

/**
 * Vérifie si un utilisateur est organisateur d'un événement
 */
export const isUserOrganizer = (event, user) => {
  if (!event || !user) return false;
  return event.participants?.some(
    (p) => p.userId === user.id && isOrganizerRole(p.role)
  );
};

/**
 * Récupère la participation d'un utilisateur à un événement
 */
export const getUserParticipation = (event, user) => {
  if (!event || !user) return null;
  return event.participants?.find((p) => p.userId === user.id);
};

/**
 * Récupère l'organisateur principal (OWNER) d'un événement
 */
export const getEventOwner = (event) => {
  if (!event) return null;
  return event.participants?.find((p) => p.role === ParticipantRole.OWNER)
    ?.user;
};

/**
 * Vérifie si un statut est positif (GOING, CONFIRMED)
 */
export const isPositiveStatus = (status) => {
  return (
    status === ParticipantStatus.GOING || status === ParticipantStatus.CONFIRMED
  );
};

/**
 * Vérifie si un statut est négatif (DECLINED, NOT_GOING)
 */
export const isNegativeStatus = (status) => {
  return (
    status === ParticipantStatus.DECLINED ||
    status === ParticipantStatus.NOT_GOING
  );
};
