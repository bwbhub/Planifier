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
   * Inclut les événements qui commencent ce jour OU qui se déroulent sur ce jour
   * @param {Date} date - Date du jour
   * @returns {Array} Liste des événements du jour
   */
  const getEventsForDay = (date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return events.filter((event) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = event.endDate ? new Date(event.endDate) : eventStart;

      // L'événement se déroule ce jour si :
      // - Il commence ce jour, OU
      // - Il se termine ce jour, OU
      // - Il commence avant et se termine après (il englobe ce jour)
      return (
        (eventStart >= dayStart && eventStart <= dayEnd) || // Commence ce jour
        (eventEnd >= dayStart && eventEnd <= dayEnd) || // Se termine ce jour
        (eventStart < dayStart && eventEnd > dayEnd) // Englobe ce jour
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
                        const eventEnd = event.endDate
                          ? new Date(event.endDate)
                          : eventStart;

                        const dayStart = new Date(date);
                        dayStart.setHours(0, 0, 0, 0);
                        const dayEnd = new Date(date);
                        dayEnd.setHours(23, 59, 59, 999);

                        // Pour les événements multi-jours, afficher seulement dans la première cellule du jour
                        const isMultiDay =
                          eventStart < dayStart || eventEnd > dayEnd;

                        if (isMultiDay) {
                          // Si l'événement commence avant ce jour, afficher à partir de 0h
                          if (eventStart < dayStart) {
                            return hour === 0;
                          }
                          // Sinon afficher à l'heure de début
                          return eventStart.getHours() === hour;
                        }

                        // Pour les événements sur un seul jour
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
                            position: "relative",
                            display: "flex",
                            gap: 0.5,
                            p: 0.5,
                            height: "100%",
                            alignItems: "flex-start",
                          }}
                        >
                          {/* Événements visibles */}
                          {visibleEvents.map((event, eventIndex) => {
                            // Calculer la durée de l'événement
                            const eventStart = new Date(event.startDate);
                            const eventEnd = event.endDate
                              ? new Date(event.endDate)
                              : eventStart;

                            // Définir les limites du jour actuel
                            const dayStart = new Date(date);
                            dayStart.setHours(0, 0, 0, 0);
                            const dayEnd = new Date(date);
                            dayEnd.setHours(23, 59, 59, 999);

                            // Calculer le début et la fin effectifs pour ce jour
                            const effectiveStart =
                              eventStart < dayStart ? dayStart : eventStart;
                            const effectiveEnd =
                              eventEnd > dayEnd ? dayEnd : eventEnd;

                            // Calculer la durée pour ce jour spécifique
                            const durationMs = effectiveEnd - effectiveStart;
                            const durationHours = durationMs / (1000 * 60 * 60);

                            // Calculer la hauteur en pixels (60px par heure)
                            const heightPx = Math.max(
                              60 * durationHours - 4,
                              50
                            );

                            // Calculer les minutes de début pour le positionnement précis
                            const startMinutes = effectiveStart.getMinutes();
                            const startHour = effectiveStart.getHours();
                            const topOffset = (startMinutes / 60) * 60;

                            return (
                              <Box
                                key={event.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEventClick(event);
                                }}
                                sx={{
                                  position: "absolute",
                                  top: `${topOffset}px`,
                                  left: "50%",
                                  transform: "translateX(-50%)",
                                  width: "92%",
                                  height: `${heightPx}px`,
                                  bgcolor: event.color || "#ff6b35",
                                  color: "white",
                                  borderRadius: 1,
                                  p: 0.5,
                                  cursor: "pointer",
                                  overflow: "hidden",
                                  fontSize: "0.7rem",
                                  display: "flex",
                                  flexDirection: "column",
                                  zIndex: 10,
                                  boxShadow: 1,
                                  "&:hover": {
                                    filter: "brightness(0.85)",
                                    boxShadow: 3,
                                    zIndex: 20,
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
                                <Typography
                                  variant="caption"
                                  noWrap
                                  sx={{
                                    fontSize: "0.65rem",
                                    opacity: 0.9,
                                    lineHeight: 1.2,
                                  }}
                                >
                                  {eventStart.toLocaleTimeString("fr-FR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                  {event.endDate && (
                                    <>
                                      {" - "}
                                      {eventEnd.toLocaleTimeString("fr-FR", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </>
                                  )}
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
                            );
                          })}

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
                                position: "absolute",
                                right: "4px",
                                top: "4px",
                                width: "44%",
                                height: "50px",
                                bgcolor: "grey.700",
                                color: "white",
                                borderRadius: 1,
                                p: 0.5,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                zIndex: 10,
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
