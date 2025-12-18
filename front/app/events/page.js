"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Paper,
  Button,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Avatar,
  Stack,
  Divider,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";

/**
 * Page de calendrier d'événements
 * Vue semaine et mois avec navigation
 */
export default function EventsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // ========================================
  // ÉTATS
  // ========================================
  const [view, setView] = useState(isMobile ? "month" : "week"); // "week" ou "month"
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);

  // Pour la vue mobile (jour unique)
  const [currentDayIndex, setCurrentDayIndex] = useState(new Date().getDay() || 7); // 1-7 (lundi-dimanche)

  // ========================================
  // CHARGEMENT DES ÉVÉNEMENTS
  // ========================================
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/events", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Erreur lors du chargement des événements");

        const data = await res.json();
        setEvents(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchEvents();
    }
  }, [token]);

  // ========================================
  // UTILITAIRES DE DATE
  // ========================================
  const getWeekDates = (date) => {
    const curr = new Date(date);
    const first = curr.getDate() - curr.getDay() + 1; // Lundi
    const dates = [];

    for (let i = 0; i < 7; i++) {
      const day = new Date(curr.setDate(first + i));
      dates.push(day);
    }

    return dates;
  };

  const getMonthDates = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Trouver le lundi de la première semaine
    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay() || 7; // 0 = dimanche → 7
    startDate.setDate(firstDay.getDate() - dayOfWeek + 1);

    // Générer 6 semaines (42 jours)
    const dates = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      dates.push(day);
    }

    return dates;
  };

  const formatWeekTitle = (date) => {
    const weekDates = getWeekDates(date);
    const first = weekDates[0];
    const last = weekDates[6];

    const options = { day: "numeric", month: "long", year: "numeric" };
    const firstStr = first.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
    const lastStr = last.toLocaleDateString("fr-FR", options);

    return `Semaine du ${firstStr} → ${lastStr}`;
  };

  const formatMonthTitle = (date) => {
    return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  };

  // ========================================
  // NAVIGATION
  // ========================================
  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (view === "week") {
      newDate.setDate(currentDate.getDate() - 7);
    } else {
      newDate.setMonth(currentDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === "week") {
      newDate.setDate(currentDate.getDate() + 7);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // ========================================
  // GESTION DES ÉVÉNEMENTS
  // ========================================
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleCloseModal = () => {
    setShowEventModal(false);
    setSelectedEvent(null);
  };

  const handleViewEvent = () => {
    if (selectedEvent) {
      router.push(`/events/${selectedEvent.id}`);
    }
  };

  // ========================================
  // RENDU
  // ========================================
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "80vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, px: { xs: 1, sm: 2 }, height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <Paper
        elevation={1}
        sx={{
          px: 2,
          py: 1,
          mb: 2,
          borderRadius: 2,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
          gap: 1.5,
          flexShrink: 0,
        }}
      >
        {/* Titre */}
        <Box>
          <Typography variant="h5" fontWeight="bold">
            {view === "week" ? formatWeekTitle(currentDate) : formatMonthTitle(currentDate)}
          </Typography>
        </Box>

        {/* Contrôles */}
        <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent={{ xs: "center", sm: "flex-end" }}>
          {/* Bouton Aujourd'hui */}
          <Button variant="outlined" size="small" onClick={handleToday}>
            Aujourd&apos;hui
          </Button>

          {/* Navigation */}
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <IconButton size="small" onClick={handlePrevious}>
              <ChevronLeft size={20} />
            </IconButton>
            <IconButton size="small" onClick={handleNext}>
              <ChevronRight size={20} />
            </IconButton>
          </Box>

          {/* Vue Semaine / Mois */}
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Button
              variant={view === "week" ? "contained" : "outlined"}
              size="small"
              onClick={() => setView("week")}
            >
              Semaine
            </Button>
            <Button
              variant={view === "month" ? "contained" : "outlined"}
              size="small"
              onClick={() => setView("month")}
            >
              Mois
            </Button>
          </Box>
        </Stack>
      </Paper>

      {/* Calendrier */}
      {view === "week" ? (
        <CalendarWeekView
          currentDate={currentDate}
          events={events}
          onEventClick={handleEventClick}
          isMobile={isMobile}
          currentDayIndex={currentDayIndex}
          setCurrentDayIndex={setCurrentDayIndex}
        />
      ) : (
        <CalendarMonthView
          currentDate={currentDate}
          events={events}
          onEventClick={handleEventClick}
        />
      )}

      {/* Modale de détail d'événement */}
      <EventDetailModal
        open={showEventModal}
        event={selectedEvent}
        onClose={handleCloseModal}
        onViewEvent={handleViewEvent}
      />
    </Container>
  );
}

// ========================================
// COMPOSANT : VUE SEMAINE
// ========================================
function CalendarWeekView({ currentDate, events, onEventClick, isMobile, currentDayIndex, setCurrentDayIndex }) {
  const weekDates = getWeekDates(currentDate);
  const hours = Array.from({ length: 19 }, (_, i) => i + 6); // 6h → 00h (24h)

  // Sur mobile, afficher un seul jour
  const displayDates = isMobile ? [weekDates[currentDayIndex - 1]] : weekDates;

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

  const getEventPosition = (event) => {
    const start = new Date(event.startDate);
    const end = event.endDate ? new Date(event.endDate) : new Date(start.getTime() + 60 * 60 * 1000);

    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;

    const top = ((startHour - 6) / 19) * 100; // Position en %
    const height = ((endHour - startHour) / 19) * 100; // Hauteur en %

    return { top: `${top}%`, height: `${Math.max(height, 5)}%` };
  };

  return (
    <Paper elevation={2} sx={{ overflow: "hidden", borderRadius: 1, display: "flex", flexDirection: "column", flex: 1 }}>
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

      {/* En-tête des jours */}
      {!isMobile && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "60px repeat(7, 1fr)",
            borderBottom: (theme) => `2px solid ${theme.palette.text.secondary}`,
            bgcolor: "background.default",
            scrollbarGutter: "stable", // Réserve l'espace pour la scrollbar
            flexShrink: 0,
          }}
        >
          <Box sx={{ borderRight: (theme) => `2px solid ${theme.palette.text.secondary}` }} /> {/* Espace pour la colonne des heures */}
          {weekDates.map((date, index) => {
            const isToday =
              date.getDate() === new Date().getDate() &&
              date.getMonth() === new Date().getMonth();

            return (
              <Box
                key={index}
                sx={{
                  py: 0.75,
                  px: 1,
                  textAlign: "center",
                  position: "relative",
                  // Bordure gauche (sauf pour le premier jour)
                  "&::before": index > 0 ? {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    top: "50%",
                    bottom: "0",
                    width: "1px",
                    bgcolor: "text.secondary",
                  } : {},
                }}
              >
                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: "0.7rem" }}>
                  {date.toLocaleDateString("fr-FR", { weekday: "short" }).toUpperCase()}
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
        </Box>
      )}

      {/* Grille horaire */}
      <Box sx={{ 
        position: "relative", 
        flex: 1,
        overflow: "auto",
        scrollbarGutter: "stable", // Réserve l'espace pour la scrollbar
      }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: isMobile ? "60px 1fr" : "60px repeat(7, 1fr)",
            position: "relative",
          }}
        >
          {/* Colonne des heures */}
          <Box sx={{ borderRight: (theme) => `2px solid ${theme.palette.text.secondary}` }}>
            {hours.map((hour) => (
              <Box
                key={hour}
                sx={{
                  height: "50px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderTop: (theme) => `1px solid ${theme.palette.text.secondary}`,
                  bgcolor: "background.default",
                }}
              >
                <Typography variant="caption" color="text.secondary" fontWeight="500">
                  {hour}h
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Colonnes des jours */}
          {displayDates.map((date, dayIndex) => {
            const dayEvents = getEventsForDay(date);

            return (
              <Box
                key={dayIndex}
                sx={{
                  position: "relative",
                  borderLeft: (theme) => `1px solid ${theme.palette.text.secondary}`,
                  borderRight: dayIndex === displayDates.length - 1 ? (theme) => `1px solid ${theme.palette.text.secondary}` : "none",
                }}
              >
                {/* Lignes horaires */}
                {hours.map((hour) => (
                  <Box
                    key={hour}
                    sx={{
                      height: "50px",
                      borderTop: (theme) => `1px solid ${theme.palette.text.secondary}`,
                    }}
                  />
                ))}

                {/* Événements */}
                {dayEvents.map((event) => {
                  const position = getEventPosition(event);

                  return (
                    <Box
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      sx={{
                        position: "absolute",
                        ...position,
                        left: "4px",
                        right: "4px",
                        bgcolor: "primary.main",
                        color: "white",
                        borderRadius: 1,
                        p: 0.5,
                        cursor: "pointer",
                        overflow: "hidden",
                        fontSize: "0.75rem",
                        "&:hover": {
                          bgcolor: "primary.dark",
                        },
                      }}
                    >
                      <Typography variant="caption" fontWeight="bold" noWrap>
                        {event.title}
                      </Typography>
                      {event.location && (
                        <Typography variant="caption" display="block" noWrap sx={{ opacity: 0.9 }}>
                          📍 {event.location}
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Box>
            );
          })}
        </Box>
      </Box>
    </Paper>
  );
}

// ========================================
// COMPOSANT : VUE MOIS
// ========================================
function CalendarMonthView({ currentDate, events, onEventClick }) {
  const monthDates = getMonthDates(currentDate);
  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

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

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <Paper elevation={2} sx={{ overflow: "hidden", borderRadius: 1, display: "flex", flexDirection: "column", flex: 1 }}>
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
              // Bordure gauche (sauf pour le premier jour)
              "&::before": index > 0 ? {
                content: '""',
                position: "absolute",
                left: 0,
                top: "50%",
                bottom: "0",
                width: "1px",
                bgcolor: "text.secondary",
              } : {},
            }}
          >
            <Typography variant="caption" fontWeight="600" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
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
          gridTemplateRows: "repeat(6, 1fr)", // Hauteur flexible
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
                height: "100%", // Prend toute la hauteur de la cellule
                p: 1,
                borderRight: (index + 1) % 7 !== 0 ? (theme) => `1px solid ${theme.palette.text.secondary}` : "none",
                borderBottom: index < 35 ? (theme) => `1px solid ${theme.palette.text.secondary}` : "none",
                bgcolor: !isCurrentMonth(date) ? "action.hover" : "background.paper",
                opacity: !isCurrentMonth(date) ? 0.5 : 1,
                overflow: "hidden", // Empêche le débordement
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

              {/* Liste des événements */}
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
                    {/* Heure sur la première ligne */}
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
                    {/* Titre sur la deuxième ligne avec ellipsis */}
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

                {/* +X autres */}
                {remainingCount > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>
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

// ========================================
// COMPOSANT : MODALE DE DÉTAIL
// ========================================
function EventDetailModal({ open, event, onClose, onViewEvent }) {
  if (!event) return null;

  const startDate = new Date(event.startDate);
  const endDate = event.endDate ? new Date(event.endDate) : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          m: { xs: 2, sm: 3 },
        },
      }}
    >
      <DialogTitle>
        <Typography variant="h5" fontWeight="bold">
          {event.title}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5}>
          {/* Date et heure */}
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
            <CalendarIcon size={20} style={{ marginTop: 2, flexShrink: 0 }} />
            <Box>
              <Typography variant="body1" fontWeight="600">
                {startDate.toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {startDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                {endDate && ` → ${endDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`}
              </Typography>
            </Box>
          </Box>

          {/* Lieu */}
          {event.location && (
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
              <MapPin size={20} style={{ marginTop: 2, flexShrink: 0 }} />
              <Typography variant="body1">{event.location}</Typography>
            </Box>
          )}

          {/* Description */}
          {event.description && (
            <>
              <Divider />
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                {event.description}
              </Typography>
            </>
          )}

          {/* Participants */}
          {event.participants && event.participants.length > 0 && (
            <>
              <Divider />
              <Box>
                <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", mb: 1.5 }}>
                  <Users size={20} />
                  <Typography variant="body1" fontWeight="600">
                    Participants ({event._count?.participants || event.participants.length})
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {event.participants.slice(0, 5).map((participant, index) => (
                    <Chip
                      key={index}
                      avatar={<Avatar>{participant.user?.name?.[0] || "?"}</Avatar>}
                      label={participant.user?.name || "Utilisateur"}
                      size="small"
                      variant={participant.role === "OWNER" ? "filled" : "outlined"}
                      color={participant.role === "OWNER" ? "primary" : "default"}
                    />
                  ))}
                  {event.participants.length > 5 && (
                    <Chip label={`+${event.participants.length - 5}`} size="small" variant="outlined" />
                  )}
                </Stack>
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Fermer
        </Button>
        <Button onClick={onViewEvent} variant="contained" endIcon={<ExternalLink size={18} />}>
          Voir l&apos;événement
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ========================================
// UTILITAIRE : Obtenir les dates de la semaine
// ========================================
function getWeekDates(date) {
  const curr = new Date(date);
  const first = curr.getDate() - curr.getDay() + 1; // Lundi
  const dates = [];

  for (let i = 0; i < 7; i++) {
    const day = new Date(curr.setDate(first + i));
    dates.push(day);
  }

  return dates;
}

// ========================================
// UTILITAIRE : Obtenir les dates du mois
// ========================================
function getMonthDates(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);

  // Trouver le lundi de la première semaine
  const startDate = new Date(firstDay);
  const dayOfWeek = firstDay.getDay() || 7;
  startDate.setDate(firstDay.getDate() - dayOfWeek + 1);

  // Générer 6 semaines (42 jours)
  const dates = [];
  for (let i = 0; i < 42; i++) {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + i);
    dates.push(day);
  }

  return dates;
}
