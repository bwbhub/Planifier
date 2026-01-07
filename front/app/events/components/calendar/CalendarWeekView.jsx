/**
 * Vue hebdomadaire du calendrier
 * Affiche une grille horaire avec les événements répartis par jour et par heure
 * Supporte la vue mobile (jour unique) et desktop (semaine complète)
 */

import React from "react";
import { Box, Paper, Typography, IconButton } from "@mui/material";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { getWeekDates } from "../../utils/dateUtils";

/**
 * @param {Object} props
 * @param {Date} props.currentDate - Date actuelle du calendrier
 * @param {Array} props.events - Liste des événements à afficher
 * @param {Function} props.onEventClick - Callback lors du clic sur un événement
 * @param {boolean} props.isMobile - Indique si on est en mode mobile
 * @param {number} props.currentDayIndex - Index du jour actuel en mode mobile (1-7)
 * @param {Function} props.setCurrentDayIndex - Fonction pour changer le jour en mode mobile
 * @param {boolean} props.hasScrollbar - Indique si la scrollbar est visible
 * @param {Object} props.scrollContainerRef - Référence au conteneur scrollable
 * @param {Function} props.onSlotClick - Callback lors du clic sur un créneau horaire
 * @param {Function} props.setMoreEventsData - Fonction pour définir les données de la modale
 * @param {Function} props.setShowMoreEventsModal - Fonction pour ouvrir la modale
 */
export default function CalendarWeekView({
  currentDate,
  events,
  onEventClick,
  isMobile,
  currentDayIndex,
  setCurrentDayIndex,
  hasScrollbar,
  scrollContainerRef,
  onSlotClick,
  setMoreEventsData,
  setShowMoreEventsModal,
}) {
  const weekDates = getWeekDates(currentDate);
  const hours = Array.from({ length: 24 }, (_, i) => i); // 00h → 23h

  // Sur mobile, afficher un seul jour
  const displayDates = isMobile ? [weekDates[currentDayIndex - 1]] : weekDates;

  /**
   * Récupère les événements pour un jour donné
   * @param {Date} date - Date du jour
   * @returns {Array} Liste des événements du jour
   */
  const getEventsForDay = (date) => {
    return events.filter((event) => {
      const eventStart = new Date(event.startDate);
      return (
        eventStart.getDate() === date.getDate() &&
        eventStart.getMonth() === date.getMonth() &&
        eventStart.getFullYear() === date.getFullYear()
      );
    });
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
      {/* Navigation mobile jour par jour */}
      {isMobile && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 2,
            bgcolor: "background.default",
          }}
        >
          <IconButton
            size="small"
            onClick={() => setCurrentDayIndex(Math.max(1, currentDayIndex - 1))}
            disabled={currentDayIndex === 1}
          >
            <ChevronLeft size={20} />
          </IconButton>
          <Typography variant="body1" fontWeight="bold">
            {weekDates[currentDayIndex - 1]?.toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </Typography>
          <IconButton
            size="small"
            onClick={() => setCurrentDayIndex(Math.min(7, currentDayIndex + 1))}
            disabled={currentDayIndex === 7}
          >
            <ChevronRight size={20} />
          </IconButton>
        </Box>
      )}

      {/* En-tête des jours (desktop uniquement) */}
      {!isMobile && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: hasScrollbar
              ? "60px repeat(7, 1fr) 15px"
              : "60px repeat(7, 1fr)",
            borderBottom: (theme) =>
              `2px solid ${theme.palette.text.secondary}`,
            bgcolor: "background.default",
            flexShrink: 0,
          }}
        >
          {/* Espace pour la colonne des heures */}
          <Box
            sx={{
              borderRight: (theme) =>
                `2px solid ${theme.palette.text.secondary}`,
            }}
          />

          {/* Jours de la semaine */}
          {weekDates.map((date, index) => {
            const isToday =
              date.getDate() === new Date().getDate() &&
              date.getMonth() === new Date().getMonth();

            return (
              <Box
                key={index}
                sx={{
                  py: 0.75,
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
                  color="text.secondary"
                  display="block"
                  sx={{ fontSize: "0.7rem" }}
                >
                  {date
                    .toLocaleDateString("fr-FR", { weekday: "short" })
                    .toUpperCase()}
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight="bold"
                  sx={{
                    color: isToday ? "primary.main" : "text.primary",
                    fontSize: "1rem",
                  }}
                >
                  {date.getDate()}
                </Typography>
              </Box>
            );
          })}

          {/* Espace pour la scrollbar */}
          {hasScrollbar && (
            <Box
              sx={{
                width: "15px",
                bgcolor: "background.default",
                height: "54px",
              }}
            />
          )}
        </Box>
      )}

      {/* Grille horaire du calendrier */}
      <Box
        ref={scrollContainerRef}
        sx={{
          position: "relative",
          flex: 1,
          overflow: "auto",
        }}
      >
        <Box
          component="table"
          sx={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
          }}
        >
          {/* Définition des colonnes */}
          <Box component="colgroup">
            <Box component="col" sx={{ width: "60px" }} />
            {displayDates.map((_, index) => (
              <Box component="col" key={index} />
            ))}
          </Box>

          <Box component="tbody">
            {hours.map((hour) => (
              <Box
                component="tr"
                key={hour}
                sx={{
                  height: "60px",
                }}
              >
                {/* Cellule de l'heure */}
                <Box
                  component="td"
                  sx={{
                    borderTop: (theme) => `1px solid ${theme.palette.divider}`,
                    borderRight: (theme) =>
                      `1px solid ${theme.palette.divider}`,
                    textAlign: "center",
                    verticalAlign: "top",
                    bgcolor: "background.default",
                    color: "text.secondary",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    p: 0.5,
                  }}
                >
                  {String(hour).padStart(2, "0")}:00
                </Box>

                {/* Cellules des jours */}
                {displayDates.map((date, dayIndex) => (
                  <Box
                    component="td"
                    key={dayIndex}
                    onClick={() => onSlotClick(date, hour)}
                    sx={{
                      borderTop: (theme) =>
                        `1px solid ${theme.palette.divider}`,
                      borderRight: (theme) =>
                        `1px solid ${theme.palette.divider}`,
                      borderLeft:
                        dayIndex === 0
                          ? (theme) => `1px solid ${theme.palette.divider}`
                          : "none",
                      position: "relative",
                      cursor: "pointer",
                      p: 0,
                      verticalAlign: "top",
                      "&:hover": {
                        bgcolor: "action.hover",
                      },
                    }}
                  >
                    {/* Afficher les événements pour cette heure spécifique */}
                    {(() => {
                      const dayEvents = getEventsForDay(date);
                      const hourEvents = dayEvents.filter((event) => {
                        const eventStart = new Date(event.startDate);
                        return eventStart.getHours() === hour;
                      });

                      if (hourEvents.length === 0) return null;

                      const MAX_VISIBLE = 3;
                      const totalEvents = hourEvents.length;
                      const visibleEvents =
                        totalEvents > MAX_VISIBLE
                          ? hourEvents.slice(0, 2)
                          : hourEvents;
                      const hiddenCount =
                        totalEvents > MAX_VISIBLE ? totalEvents - 2 : 0;

                      return (
                        <Box
                          sx={{
                            display: "flex",
                            gap: 0.5,
                            p: 0.5,
                            height: "100%",
                            alignItems: "stretch",
                          }}
                        >
                          {/* Événements visibles */}
                          {visibleEvents.map((event) => (
                            <Box
                              key={event.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onEventClick(event);
                              }}
                              sx={{
                                flex: 1,
                                bgcolor: "primary.main",
                                color: "white",
                                borderRadius: 1,
                                p: 0.5,
                                cursor: "pointer",
                                overflow: "hidden",
                                fontSize: "0.7rem",
                                display: "flex",
                                flexDirection: "column",
                                minWidth: 0,
                                "&:hover": {
                                  bgcolor: "primary.dark",
                                  boxShadow: 2,
                                },
                              }}
                            >
                              <Typography
                                variant="caption"
                                fontWeight="bold"
                                noWrap
                                sx={{
                                  fontSize: "0.7rem",
                                  lineHeight: 1.2,
                                }}
                              >
                                {event.title}
                              </Typography>
                              {event.location && (
                                <Typography
                                  variant="caption"
                                  noWrap
                                  sx={{
                                    fontSize: "0.65rem",
                                    opacity: 0.9,
                                    lineHeight: 1.2,
                                    mt: 0.25,
                                  }}
                                >
                                  📍 {event.location}
                                </Typography>
                              )}
                            </Box>
                          ))}

                          {/* Bouton "..." pour les événements supplémentaires */}
                          {hiddenCount > 0 && (
                            <Box
                              onClick={(e) => {
                                e.stopPropagation();
                                setMoreEventsData({
                                  date,
                                  events: hourEvents,
                                });
                                setShowMoreEventsModal(true);
                              }}
                              sx={{
                                flex: 1,
                                bgcolor: "grey.700",
                                color: "white",
                                borderRadius: 1,
                                p: 0.5,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                minWidth: 0,
                                "&:hover": {
                                  bgcolor: "grey.800",
                                  boxShadow: 2,
                                },
                              }}
                            >
                              <MoreHorizontal size={16} />
                            </Box>
                          )}
                        </Box>
                      );
                    })()}
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
