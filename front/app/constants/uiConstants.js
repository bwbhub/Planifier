/**
 * Constantes UI globales de l'application
 * Centralise les variantes, vues, thèmes et autres valeurs UI
 */

// ========================================
// VUES DU CALENDRIER
// ========================================
export const CalendarView = {
  WEEK: "week",
  MONTH: "month",
};

export const CalendarViewLabels = {
  [CalendarView.WEEK]: "Semaine",
  [CalendarView.MONTH]: "Mois",
};

// ========================================
// VUES DU DRAWER DE GESTION DES PARTICIPANTS
// ========================================
export const ParticipantManagementView = {
  PARTICIPANTS: "participants",
  ADD: "add",
};

export const ParticipantManagementViewLabels = {
  [ParticipantManagementView.PARTICIPANTS]: "Participants",
  [ParticipantManagementView.ADD]: "Ajouter",
};

// ========================================
// VARIANTES DE COMPOSANTS
// ========================================
export const ComponentVariant = {
  DEFAULT: "default",
  PRIMARY: "primary",
  SECONDARY: "secondary",
};

// ========================================
// THÈMES
// ========================================
export const Theme = {
  LIGHT: "light",
  DARK: "dark",
};

export const ThemeLabels = {
  LIGHT: "Clair",
  DARK: "Sombre",
};

// ========================================
// TOUCHES CLAVIER
// ========================================
export const KeyCode = {
  ENTER: "Enter",
  ESCAPE: "Escape",
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
  TAB: "Tab",
  SPACE: " ",
};

// ========================================
// HELPERS - Accès direct via objets
// ========================================

/**
 * Récupère le label d'une vue
 * Usage: CalendarViewLabels[view]
 */
export const getViewLabel = (view) =>
  CalendarViewLabels[view] || "Vue inconnue";

/**
 * Vérifie si la touche Entrée est pressée sans Shift
 */
export const isEnterWithoutShift = (event) => {
  return event.key === KeyCode.ENTER && !event.shiftKey;
};
