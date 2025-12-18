"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Avatar,
  Stack,
  Chip,
  TextField,
  IconButton,
  Divider,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
  alpha,
} from "@mui/material";
import {
  ArrowLeft,
  Edit,
  MapPin,
  Calendar,
  Clock,
  User,
  Users,
  MessageSquare,
  Send,
  Share2,
  UserPlus,
  Check,
  X,
  HelpCircle,
  FileText,
  DollarSign,
  CheckSquare,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

/**
 * Page de détail d'un événement
 * Affiche toutes les informations, participants, commentaires et chat
 */
export default function EventDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token, user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // ========================================
  // ÉTATS
  // ========================================
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Commentaires
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  // Chat
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatEndRef = useRef(null);

  // Modale d'ajout de participant
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [participantEmail, setParticipantEmail] = useState("");

  // ========================================
  // CHARGEMENT DES DONNÉES
  // ========================================
  useEffect(() => {
    if (!token || !id) return;

    const fetchEvent = async () => {
      try {
        const res = await fetch(`/api/events/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error("Événement introuvable");
        }

        const data = await res.json();
        setEvent(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [token, id]);

  // Auto-scroll du chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ========================================
  // FONCTIONS UTILITAIRES
  // ========================================
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isOrganizer = () => {
    if (!event || !user) return false;
    return event.participants?.some(
      (p) => p.userId === user.id && p.role === "ORGANIZER"
    );
  };

  const getMyParticipation = () => {
    if (!event || !user) return null;
    return event.participants?.find((p) => p.userId === user.id);
  };

  const getStatusIcon = (status) => {
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

  const getStatusColor = (status) => {
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

  // ========================================
  // ACTIONS
  // ========================================
  const handleBack = () => {
    router.push("/events");
  };

  const handleEdit = () => {
    router.push(`/events/${id}/edit`);
  };

  const handleShare = () => {
    const url = `${window.location.origin}/events/${id}`;
    navigator.clipboard.writeText(url);
    // TODO: Afficher un toast de confirmation
  };

  const handleSendComment = async () => {
    if (!newComment.trim()) return;

    setSendingComment(true);
    try {
      // TODO: Implémenter l'API des commentaires
      const mockComment = {
        id: Date.now().toString(),
        text: newComment,
        author: user,
        createdAt: new Date().toISOString(),
      };
      setComments([mockComment, ...comments]);
      setNewComment("");
    } catch (err) {
      console.error(err);
    } finally {
      setSendingComment(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setSendingMessage(true);
    try {
      // TODO: Implémenter l'API du chat
      const mockMessage = {
        id: Date.now().toString(),
        text: newMessage,
        author: user,
        createdAt: new Date().toISOString(),
      };
      setMessages([...messages, mockMessage]);
      setNewMessage("");
    } catch (err) {
      console.error(err);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleAddParticipant = async () => {
    if (!participantEmail.trim()) return;

    try {
      // TODO: Implémenter l'API d'invitation
      setShowAddParticipantModal(false);
      setParticipantEmail("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoinLeave = async () => {
    const myParticipation = getMyParticipation();
    // TODO: Implémenter rejoindre/quitter l'événement
  };

  // ========================================
  // RENDU
  // ========================================
  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Skeleton variant="rectangular" height={200} sx={{ mb: 3, borderRadius: 2 }} />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" }, gap: 3 }}>
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
        </Box>
      </Container>
    );
  }

  if (error || !event) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="h4" gutterBottom>
          Événement introuvable
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {error || "Cet événement n'existe pas ou vous n'avez pas accès."}
        </Typography>
        <Button variant="contained" onClick={handleBack} startIcon={<ArrowLeft size={20} />}>
          Retour aux événements
        </Button>
      </Container>
    );
  }

  const organizer = event.participants?.find((p) => p.role === "ORGANIZER")?.user;
  const myParticipation = getMyParticipation();

  return (
    <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
      {/* HEADER */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <IconButton onClick={handleBack} size="small">
            <ArrowLeft size={20} />
          </IconButton>
          {isOrganizer() && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<Edit size={16} />}
              onClick={handleEdit}
            >
              Modifier
            </Button>
          )}
        </Stack>

        <Typography variant="h3" fontWeight="bold" gutterBottom>
          {event.title}
        </Typography>

        <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
          <Chip
            icon={<Calendar size={16} />}
            label={formatDate(event.startDate)}
            variant="outlined"
          />
          <Chip
            icon={<Clock size={16} />}
            label={`${formatTime(event.startDate)}${event.endDate ? ` → ${formatTime(event.endDate)}` : ""}`}
            variant="outlined"
          />
        </Stack>
      </Paper>

      {/* GRILLE PRINCIPALE */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
          gap: 3,
        }}
      >
        {/* COLONNE GAUCHE */}
        <Stack spacing={3}>
          {/* INFOS CLÉS */}
          <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Informations
            </Typography>

            <Stack spacing={2.5}>
              {/* Lieu */}
              {event.location && (
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <MapPin size={20} style={{ marginTop: 2, flexShrink: 0 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Lieu
                    </Typography>
                    <Typography variant="body1">{event.location}</Typography>
                  </Box>
                </Stack>
              )}

              {/* Description */}
              {event.description && (
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <FileText size={20} style={{ marginTop: 2, flexShrink: 0 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Description
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                      {event.description}
                    </Typography>
                  </Box>
                </Stack>
              )}

              {/* Organisateur */}
              {organizer && (
                <Stack direction="row" spacing={2} alignItems="center">
                  <User size={20} style={{ flexShrink: 0 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Organisateur
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar
                        src={organizer.avatarUrl}
                        sx={{ width: 24, height: 24 }}
                      >
                        {organizer.name?.[0]}
                      </Avatar>
                      <Typography variant="body1">{organizer.name}</Typography>
                    </Stack>
                  </Box>
                </Stack>
              )}
            </Stack>
          </Paper>

          {/* COMMENTAIRES */}
          <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
              Commentaires
            </Typography>

            {/* Liste des commentaires */}
            <Stack spacing={2} sx={{ mb: 3, maxHeight: 400, overflowY: "auto" }}>
              {comments.length === 0 ? (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                  Aucun commentaire pour le moment
                </Typography>
              ) : (
                comments.map((comment) => (
                  <Box key={comment.id}>
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <Avatar
                        src={comment.author?.avatarUrl}
                        sx={{ width: 32, height: 32 }}
                      >
                        {comment.author?.name?.[0]}
                      </Avatar>
                      <Box flex={1}>
                        <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                          <Typography variant="body2" fontWeight="600">
                            {comment.author?.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDateTime(comment.createdAt)}
                          </Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                          {comment.text}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                ))
              )}
            </Stack>

            {/* Champ de saisie */}
            <Divider sx={{ my: 2 }} />
            <Stack direction="row" spacing={1} alignItems="flex-end">
              <TextField
                fullWidth
                multiline
                maxRows={4}
                placeholder="Ajouter un commentaire..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={sendingComment}
                size="small"
              />
              <IconButton
                color="primary"
                onClick={handleSendComment}
                disabled={!newComment.trim() || sendingComment}
              >
                <Send size={20} />
              </IconButton>
            </Stack>
          </Paper>

          {/* SECTION LOGISTIQUE (Placeholder) */}
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
            <Typography variant="caption" color="text.secondary" display="block" mt={2}>
              Fonctionnalités à venir
            </Typography>
          </Paper>
        </Stack>

        {/* COLONNE DROITE */}
        <Stack spacing={3}>
          {/* PARTICIPANTS */}
          <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                Participants ({event.participants?.length || 0})
              </Typography>
              {isOrganizer() && (
                <IconButton
                  size="small"
                  onClick={() => setShowAddParticipantModal(true)}
                >
                  <UserPlus size={18} />
                </IconButton>
              )}
            </Stack>

            <Stack spacing={1.5} sx={{ maxHeight: 300, overflowY: "auto" }}>
              {event.participants?.map((participant) => (
                <Stack
                  key={participant.id}
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Stack direction="row" spacing={1.5} alignItems="center" flex={1}>
                    <Avatar
                      src={participant.user?.avatarUrl}
                      sx={{ width: 36, height: 36 }}
                    >
                      {participant.user?.name?.[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="500">
                        {participant.user?.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {participant.role === "ORGANIZER" ? "Organisateur" : "Invité"}
                      </Typography>
                    </Box>
                  </Stack>
                  <Chip
                    icon={getStatusIcon(participant.status)}
                    label={
                      participant.status === "CONFIRMED"
                        ? "Confirmé"
                        : participant.status === "DECLINED"
                        ? "Refusé"
                        : "Peut-être"
                    }
                    color={getStatusColor(participant.status)}
                    size="small"
                  />
                </Stack>
              ))}
            </Stack>

            {isOrganizer() && (
              <Button
                variant="outlined"
                fullWidth
                sx={{ mt: 2 }}
                onClick={() => router.push(`/events/${id}/participants`)}
              >
                Gérer les invitations
              </Button>
            )}
          </Paper>

          {/* CHAT */}
          <Paper elevation={1} sx={{ p: 3, borderRadius: 2, display: "flex", flexDirection: "column", height: 500 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Chat
            </Typography>

            {/* Messages */}
            <Box
              sx={{
                flex: 1,
                overflowY: "auto",
                mb: 2,
                pr: 1,
              }}
            >
              {messages.length === 0 ? (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                  Aucun message pour le moment
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  {messages.map((message) => (
                    <Box key={message.id}>
                      <Stack direction="row" spacing={1} alignItems="flex-start">
                        <Avatar
                          src={message.author?.avatarUrl}
                          sx={{ width: 28, height: 28 }}
                        >
                          {message.author?.name?.[0]}
                        </Avatar>
                        <Box flex={1}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="caption" fontWeight="600">
                              {message.author?.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDateTime(message.createdAt)}
                            </Typography>
                          </Stack>
                          <Typography variant="body2">{message.text}</Typography>
                        </Box>
                      </Stack>
                    </Box>
                  ))}
                  <div ref={chatEndRef} />
                </Stack>
              )}
            </Box>

            {/* Input */}
            <Divider sx={{ mb: 2 }} />
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                fullWidth
                placeholder="Envoyer un message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={sendingMessage}
                size="small"
              />
              <IconButton
                color="primary"
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sendingMessage}
              >
                <Send size={20} />
              </IconButton>
            </Stack>
          </Paper>
        </Stack>
      </Box>

      {/* FOOTER STICKY */}
      <Paper
        elevation={3}
        sx={{
          position: "fixed",
          bottom: { xs: 100, md: 20 },
          left: { xs: 16, md: "50%" },
          transform: { xs: "none", md: "translateX(-50%)" },
          right: { xs: 16, md: "auto" },
          p: 2,
          borderRadius: 2,
          zIndex: 1100,
          display: "flex",
          gap: 2,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="contained"
          size="large"
          onClick={handleJoinLeave}
          sx={{ minWidth: 150 }}
        >
          {myParticipation ? "Quitter l'événement" : "Rejoindre"}
        </Button>
        <Button
          variant="outlined"
          size="large"
          startIcon={<Share2 size={18} />}
          onClick={handleShare}
        >
          Partager
        </Button>
      </Paper>

      {/* MODALE AJOUT PARTICIPANT */}
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
          <Button onClick={() => setShowAddParticipantModal(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleAddParticipant}
            disabled={!participantEmail.trim()}
          >
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
