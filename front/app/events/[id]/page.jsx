"use client";
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Container,
  Box,
  Typography,
  Button,
  Stack,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
} from "@mui/material";
import { ArrowLeft, DollarSign, CheckSquare, FileText } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

// Composants
import EventHeader from "./components/EventHeader.jsx";
import EventInfo from "./components/EventInfo.jsx";
import CommentSection from "./components/CommentSection.jsx";
import ParticipantsList from "./components/ParticipantsList.jsx";
import ChatSection from "./components/ChatSection.jsx";
import EventActions from "./components/EventActions.jsx";

// Hooks
import { useEventDetail } from "./hooks/useEventDetail";
import { useComments } from "./hooks/useComments";
import { useChat } from "./hooks/useChat";

// Utils
import {
  isOrganizer,
  getMyParticipation,
  getEventOwner,
} from "./utils/eventHelpers";
import ParticipantManagement from "./components/ParticipantManagement";

/**
 * Page de détail d'un événement
 * Affiche toutes les informations, participants, commentaires et chat
 */
export default function EventDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token, user } = useAuth();

  // Hooks personnalisés
  const { event, loading, error } = useEventDetail(token, id);
  const {
    comments,
    newComment,
    setNewComment,
    sendingComment,
    loading: loadingComments,
    handleSendComment,
    handleDeleteComment,
  } = useComments(token, id);
  const {
    messages,
    newMessage,
    setNewMessage,
    sendingMessage,
    handleSendMessage,
    chatEndRef,
  } = useChat(user);

  // Modale d'ajout de participant
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [participantEmail, setParticipantEmail] = useState("");
  const [openDrawer, setOpenDrawer] = useState(false);

  // État d'édition
  const [isEditing, setIsEditing] = useState(false);
  const [editedEvent, setEditedEvent] = useState(null);
  const [saving, setSaving] = useState(false);

  // Actions
  const handleBack = () => router.push("/events");
  const handleEdit = () => {
    setIsEditing(true);
    setEditedEvent({
      title: event.title,
      description: event.description || "",
      location: event.location || "",
      startDate: event.startDate,
      endDate: event.endDate || "",
      color: event.color || "#ff6b35",
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedEvent(null);
  };

  const handleSaveEdit = async () => {
    if (!editedEvent) return;

    setSaving(true);
    try {
      const res = await fetch(`http://localhost:4000/api/events/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editedEvent),
      });

      if (!res.ok) throw new Error("Erreur lors de la sauvegarde");

      // Recharger l'événement
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/events/${id}`;
    navigator.clipboard.writeText(url);
  };

  const handleAddParticipant = async () => {
    if (!participantEmail.trim()) return;
    // TODO: Implémenter l'API d'invitation
    setShowAddParticipantModal(false);
    setParticipantEmail("");
  };

  const handleJoinLeave = async () => {
    // TODO: Implémenter rejoindre/quitter l'événement
  };

  // Chargement
  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Skeleton
          variant="rectangular"
          height={200}
          sx={{ mb: 3, borderRadius: 2 }}
        />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
            gap: 3,
          }}
        >
          <Skeleton
            variant="rectangular"
            height={400}
            sx={{ borderRadius: 2 }}
          />
          <Skeleton
            variant="rectangular"
            height={400}
            sx={{ borderRadius: 2 }}
          />
        </Box>
      </Container>
    );
  }

  // Erreur
  if (error || !event) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="h4" gutterBottom>
          Événement introuvable
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {error || "Cet événement n'existe pas ou vous n'avez pas accès."}
        </Typography>
        <Button
          variant="contained"
          onClick={handleBack}
          startIcon={<ArrowLeft size={20} />}
        >
          Retour aux événements
        </Button>
      </Container>
    );
  }

  const organizer = getEventOwner(event);
  const myParticipation = getMyParticipation(event, user);
  const userIsOrganizer = isOrganizer(event, user);

  return (
    <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
      {/* En-tête */}
      <EventHeader
        event={event}
        isOrganizer={userIsOrganizer}
        onBack={handleBack}
        onEdit={handleEdit}
        isEditing={isEditing}
        editedEvent={editedEvent}
        onEditChange={setEditedEvent}
        onSave={handleSaveEdit}
        onCancel={handleCancelEdit}
        saving={saving}
      />

      {/* Grille principale */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
          gap: 3,
        }}
      >
        {/* Colonne gauche */}
        <Stack spacing={3}>
          <EventInfo
            event={event}
            organizer={organizer}
            isEditing={isEditing}
            editedEvent={editedEvent}
            onEditChange={setEditedEvent}
          />

          <CommentSection
            comments={comments}
            newComment={newComment}
            onCommentChange={setNewComment}
            onSend={handleSendComment}
            sending={sendingComment}
            loading={loadingComments}
            onDelete={handleDeleteComment}
            currentUserId={user?.id}
            isOwner={userIsOrganizer}
          />

          {/* Section logistique (placeholder) */}
          <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Organisation
            </Typography>
            <Stack spacing={2}>
              <Button
                variant="outlined"
                startIcon={<DollarSign size={18} />}
                fullWidth
                sx={{ justifyContent: "flex-start" }}
                disabled
              >
                Budget & Dépenses
              </Button>
              <Button
                variant="outlined"
                startIcon={<CheckSquare size={18} />}
                fullWidth
                sx={{ justifyContent: "flex-start" }}
                disabled
              >
                Liste de tâches
              </Button>
              <Button
                variant="outlined"
                startIcon={<FileText size={18} />}
                fullWidth
                sx={{ justifyContent: "flex-start" }}
                disabled
              >
                Documents
              </Button>
            </Stack>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              mt={2}
            >
              Fonctionnalités à venir
            </Typography>
          </Paper>
        </Stack>

        {/* Colonne droite */}
        <Stack spacing={3}>
          <ParticipantsList
            participants={event.participants}
            isOrganizer={userIsOrganizer}
            onAddParticipant={() => setShowAddParticipantModal(true)}
            onManageInvitations={() => setOpenDrawer(true)}
          />

          <ChatSection
            messages={messages}
            newMessage={newMessage}
            onMessageChange={setNewMessage}
            onSend={handleSendMessage}
            sending={sendingMessage}
            chatEndRef={chatEndRef}
          />
        </Stack>
      </Box>

      {/* Actions */}
      <EventActions
        hasParticipation={!!myParticipation}
        onJoinLeave={handleJoinLeave}
        onShare={handleShare}
      />

      {/* Modale ajout participant */}
      <Dialog
        open={showAddParticipantModal}
        onClose={() => setShowAddParticipantModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Ajouter un participant</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Email du participant"
            type="email"
            value={participantEmail}
            onChange={(e) => setParticipantEmail(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddParticipantModal(false)}>
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleAddParticipant}
            disabled={!participantEmail.trim()}
          >
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>
      <ParticipantManagement
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        event={event}
      />
    </Container>
  );
}
