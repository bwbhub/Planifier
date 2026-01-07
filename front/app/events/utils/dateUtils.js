/**
 * Utilitaires pour la manipulation des dates dans le calendrier
 */

/**
 * Retourne les 7 dates de la semaine (lundi à dimanche) pour une date donnée
 * @param {Date} date - Date de référence
 * @returns {Date[]} Tableau des 7 dates de la semaine
 */
export const getWeekDates = (date) => {
  const curr = new Date(date);
  const first = curr.getDate() - curr.getDay() + 1; // Lundi
  const dates = [];

  for (let i = 0; i < 7; i++) {
    const day = new Date(curr.setDate(first + i));
    dates.push(day);
  }

  return dates;
};

/**
 * Formate le titre de la semaine (ex: "Semaine du 1 janvier → 7 janvier 2024")
 * @param {Date} date - Date de référence
 * @returns {string} Titre formaté de la semaine
 */
export const formatWeekTitle = (date) => {
  const weekDates = getWeekDates(date);
  const first = weekDates[0];
  const last = weekDates[6];

  const options = { day: "numeric", month: "long", year: "numeric" };
  const firstStr = first.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
  });
  const lastStr = last.toLocaleDateString("fr-FR", options);

  return `Semaine du ${firstStr} → ${lastStr}`;
};

/**
 * Formate le titre du mois (ex: "janvier 2024")
 * @param {Date} date - Date de référence
 * @returns {string} Titre formaté du mois
 */
export const formatMonthTitle = (date) => {
  return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
};
