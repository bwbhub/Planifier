"use client";
import React, { useState, useRef } from "react";
import {
  Box,
  Container,
  Paper,
  Button,
  Typography,
  IconButton,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Stack,
} from "@mui/material";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";

// Composants
import CalendarWeekView from "./components/calendar/CalendarWeekView.jsx";
import CalendarMonthView from "./components/calendar/CalendarMonthView.jsx";
import EventDetailModal from "./components/modals/EventDetailModal.jsx";
import CreateEventModal from "./components/modals/CreateEventModal.jsx";
import MoreEventsModal from "./components/modals/MoreEventsModal.jsx";

// Hooks
import { useEvents } from "./hooks/useEvents";
import { useScrollbar } from "./hooks/useScrollbar";

// Utilitaires
import { formatWeekTitle, formatMonthTitle } from "./utils/dateUtils";

/**
 * Page principale du calendrier d'événements
 * Gère la navigation entre les vues semaine/mois et l'affichage des événements
 */
export default function EventsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // ========================================
  // ÉTATS
  // ========================================
  const [view, setView] = useState(isMobile ? "month" : "week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showMoreEventsModal, setShowMoreEventsModal] = useState(false);
  const [moreEventsData, setMoreEventsData] = useState(null);

  // Pour la vue mobile (jour unique)
  const [currentDayIndex, setCurrentDayIndex] = useState(
    new Date().getDay() || 7
  );

  const scrollContainerRef = useRef(null);

  // ========================================
  // HOOKS PERSONNALISÉS
  // ========================================
  const { events, loading } = useEvents(token);
  const hasScrollbar = useScrollbar(scrollContainerRef, { events, view });

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

  const handleSlotClick = (date, hour) => {
    setSelectedSlot({ date, hour });
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setSelectedSlot(null);
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
    <Container
      maxWidth="xl"
      sx={{
        py: 4,
        px: { xs: 1, sm: 2 },
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* En-tête avec navigation */}
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
            {view === "week"
              ? formatWeekTitle(currentDate)
              : formatMonthTitle(currentDate)}
          </Typography>
        </Box>

        {/* Contrôles de navigation */}
        <Stack
          direction="row"
          spacing={{ xs: 0.5, sm: 1 }}
          flexWrap="wrap"
          justifyContent={{ xs: "center", sm: "flex-end" }}
        >
          <Button variant="outlined" size="small" onClick={handleToday}>
            Aujourd&apos;hui
          </Button>

          <Box sx={{ display: "flex", gap: 0.5 }}>
            <IconButton size="small" onClick={handlePrevious}>
              <ChevronLeft size={20} />
            </IconButton>
            <IconButton size="small" onClick={handleNext}>
              <ChevronRight size={20} />
            </IconButton>
          </Box>

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
          hasScrollbar={hasScrollbar}
          scrollContainerRef={scrollContainerRef}
          onSlotClick={handleSlotClick}
          setMoreEventsData={setMoreEventsData}
          setShowMoreEventsModal={setShowMoreEventsModal}
        />
      ) : (
        <CalendarMonthView
          currentDate={currentDate}
          events={events}
          onEventClick={handleEventClick}
        />
      )}

      {/* Modales */}
      <EventDetailModal
        open={showEventModal}
        event={selectedEvent}
        onClose={handleCloseModal}
        onViewEvent={handleViewEvent}
      />

      <CreateEventModal
        open={showCreateModal}
        onClose={handleCloseCreateModal}
        selectedSlot={selectedSlot}
      />

      <MoreEventsModal
        open={showMoreEventsModal}
        onClose={() => setShowMoreEventsModal(false)}
        data={moreEventsData}
      />
    </Container>
  );
}
