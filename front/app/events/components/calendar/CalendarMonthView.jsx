/**
 * Vue mensuelle du calendrier
 * Affiche une grille de 6 semaines avec les événements de chaque jour
 * Les jours hors du mois actuel sont affichés avec une opacité réduite
 */

import React from "react";
import { Box, Paper, Typography, Stack } from "@mui/material";

/**
 * Génère toutes les dates à afficher dans la vue mois (6 semaines)
 * @param {Date} date - Date de référence
 * @returns {Date[]} Tableau de 42 dates (6 semaines x 7 jours)
 */
const getMonthDates = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const endDay = lastDay.getDay() === 0 ? 6 : lastDay.getDay() - 1;

  const dates = [];

  // Jours du mois précédent
  for (let i = startDay - 1; i >= 0; i--) {
    const prevDate = new Date(year, month, -i);
    dates.push(prevDate);
  }

  // Jours du mois actuel
  for (let i = 1; i <= lastDay.getDate(); i++) {
    dates.push(new Date(year, month, i));
  }

  // Jours du mois suivant
  const remainingDays = 42 - dates.length;
  for (let i = 1; i <= remainingDays; i++) {
    dates.push(new Date(year, month + 1, i));
  }

  return dates;
};

/**
 * @param {Object} props
 * @param {Date} props.currentDate - Date actuelle du calendrier
 * @param {Array} props.events - Liste des événements à afficher
 * @param {Function} props.onEventClick - Callback lors du clic sur un événement
 */
export default function CalendarMonthView({
  currentDate,
  events,
  onEventClick,
}) {
  const monthDates = getMonthDates(currentDate);
  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  /**
   * Récupère les événements pour un jour donné
   * @param {Date} date - Date du jour
   * @returns {Array} Liste des événements du jour
   */
  const getEventsForDay = (date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startDate);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  /**
   * Vérifie si une date appartient au mois actuel
   * @param {Date} date - Date à vérifier
   * @returns {boolean}
   */
  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  /**
   * Vérifie si une date est aujourd'hui
   * @param {Date} date - Date à vérifier
   * @returns {boolean}
   */
  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <Paper
      elevation={2}
      sx={{
        overflow: "hidden",
        borderRadius: 1,
        display: "flex",
        flexDirection: "column",
        flex: 1,
      }}
    >
      {/* En-tête des jours de la semaine */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          bgcolor: "background.default",
          borderBottom: (theme) => `2px solid ${theme.palette.text.secondary}`,
          flexShrink: 0,
        }}
      >
        {weekDays.map((day, index) => (
          <Box
            key={day}
            sx={{
              py: 0.75,
              px: 1,
              textAlign: "center",
              position: "relative",
              "&::before":
                index > 0
                  ? {
                      content: '""',
                      position: "absolute",
                      left: 0,
                      top: "50%",
                      bottom: "0",
                      width: "1px",
                      bgcolor: "text.secondary",
                    }
                  : {},
            }}
          >
            <Typography
              variant="caption"
              fontWeight="600"
              color="text.secondary"
              sx={{ fontSize: "0.7rem" }}
            >
              {day.toUpperCase()}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Grille du mois */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gridTemplateRows: "repeat(6, 1fr)",
          flex: 1,
          overflow: "auto",
        }}
      >
        {monthDates.map((date, index) => {
          const dayEvents = getEventsForDay(date);
          const displayEvents = dayEvents.slice(0, 2);
          const remainingCount = dayEvents.length - 2;

          return (
            <Box
              key={index}
              sx={{
                height: "100%",
                p: 1,
                borderRight:
                  (index + 1) % 7 !== 0
                    ? (theme) => `1px solid ${theme.palette.text.secondary}`
                    : "none",
                borderBottom:
                  index < 35
                    ? (theme) => `1px solid ${theme.palette.text.secondary}`
                    : "none",
                bgcolor: !isCurrentMonth(date)
                  ? "action.hover"
                  : "background.paper",
                opacity: !isCurrentMonth(date) ? 0.5 : 1,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Numéro du jour */}
              <Typography
                variant="body2"
                fontWeight={isToday(date) ? "bold" : "normal"}
                sx={{
                  color: isToday(date) ? "primary.main" : "text.primary",
                  mb: 0.5,
                }}
              >
                {date.getDate()}
              </Typography>

              {/* Liste des événements (max 2 affichés) */}
              <Stack spacing={0.5} sx={{ flex: 1, overflow: "hidden" }}>
                {displayEvents.map((event) => (
                  <Box
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    sx={{
                      bgcolor: "primary.main",
                      color: "white",
                      borderRadius: 0.5,
                      px: 0.5,
                      py: 0.25,
                      cursor: "pointer",
                      "&:hover": {
                        bgcolor: "primary.dark",
                      },
                    }}
                  >
                    {/* Heure */}
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: "0.65rem",
                        fontWeight: "500",
                        display: "block",
                        lineHeight: 1.2,
                      }}
                    >
                      {new Date(event.startDate).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Typography>
                    {/* Titre avec ellipsis */}
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: "0.7rem",
                        fontWeight: "600",
                        display: "block",
                        lineHeight: 1.2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {event.title}
                    </Typography>
                  </Box>
                ))}

                {/* Indicateur d'événements supplémentaires */}
                {remainingCount > 0 && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: "0.65rem" }}
                  >
                    +{remainingCount} autre{remainingCount > 1 ? "s" : ""}
                  </Typography>
                )}
              </Stack>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
