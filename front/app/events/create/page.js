"use client";
import React, { useState } from "react";
// import { useRouter } from "next/navigation"; // Décommenter pour la redirection
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Stack,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Calendar,
  Clock,
  MapPin,
  FileText,
  Image as ImageIcon,
  Plus,
  X,
  Save,
  Tag,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

/**
 * Couleurs disponibles pour les tags personnalisés
 */
const TAG_COLORS = [
  { name: "Rouge", value: "#EF4444", light: "#FEE2E2" },
  { name: "Orange", value: "#F97316", light: "#FFEDD5" },
  { name: "Jaune", value: "#EAB308", light: "#FEF9C3" },
  { name: "Vert", value: "#22C55E", light: "#DCFCE7" },
  { name: "Bleu", value: "#3B82F6", light: "#DBEAFE" },
  { name: "Indigo", value: "#6366F1", light: "#E0E7FF" },
  { name: "Violet", value: "#A855F7", light: "#F3E8FF" },
  { name: "Rose", value: "#EC4899", light: "#FCE7F3" },
  { name: "Gris", value: "#6B7280", light: "#F3F4F6" },
  { name: "Noir", value: "#1F2937", light: "#E5E7EB" },
];

/**
 * Page de création d'événement
 * Mobile-first, simple et moderne
 */
export default function CreateEventPage() {
  // const router = useRouter(); // Décommenter pour la redirection

  const { token } = useAuth();

  // ========================================
  // ÉTATS DU FORMULAIRE
  // ========================================
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState("");

  // Gestion des tags
  const [tags, setTags] = useState([]); // Liste des tags sélectionnés
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0].value);

  // États de chargement et messages
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ========================================
  // GESTION DES TAGS
  // ========================================
  const handleAddTag = () => {
    if (!newTagName.trim()) {
      return;
    }

    const newTag = {
      id: Date.now(), // ID temporaire
      name: newTagName.trim(),
      color: newTagColor,
    };

    setTags([...tags, newTag]);
    setNewTagName("");
    setNewTagColor(TAG_COLORS[0].value);
    setShowTagDialog(false);
  };

  const handleRemoveTag = (tagId) => {
    setTags(tags.filter((tag) => tag.id !== tagId));
  };

  // ========================================
  // GESTION DE L'IMAGE
  // ========================================
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(file);
      // Créer une preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setCoverImage(null);
    setCoverImagePreview("");
  };

  // ========================================
  // VALIDATION ET SOUMISSION
  // ========================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Réinitialiser les messages
    setError("");
    setSuccess("");

    // Validation : Nom et Date obligatoires
    if (!name.trim()) {
      setError("Le nom de l'événement est obligatoire");
      return;
    }

    if (!date) {
      setError("La date de l'événement est obligatoire");
      return;
    }

    setLoading(true);

    try {
      // Préparer les données de l'événement
      // Combiner date et heure pour créer startDate
      const startDateTime = time
        ? `${date}T${time}:00`
        : `${date}T00:00:00`;

      // Ajouter les tags à la description si présents
      let fullDescription = description.trim();
      if (tags.length > 0) {
        const tagsText = tags.map((tag) => `#${tag.name}`).join(" ");
        fullDescription = fullDescription
          ? `${fullDescription}\n\nTags: ${tagsText}`
          : `Tags: ${tagsText}`;
      }

      const eventData = {
        title: name.trim(),
        startDate: startDateTime,
        endDate: null, // Pour l'instant, pas de date de fin
        location: location.trim() || null,
        description: fullDescription || null,
        coverUrl: null, // Pour l'instant, pas d'upload d'image
        settings: {
          isGuestListVisible: true,
          allowGuestInvite: false,
          maxParticipants: null,
        },
      };

      // Appel API pour créer l'événement
      const res = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(eventData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la création de l'événement");
      }

      // Succès !
      setSuccess("Événement créé avec succès !");

      // Redirection vers la page de l'événement (à décommenter plus tard)
      // setTimeout(() => {
      //   router.push(`/events/${data.id}`);
      // }, 1000);

      // Pour l'instant, on réinitialise le formulaire
      setTimeout(() => {
        setName("");
        setDate("");
        setTime("");
        setLocation("");
        setDescription("");
        setTags([]);
        setCoverImage(null);
        setCoverImagePreview("");
        setSuccess("");
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // RENDU DE LA PAGE
  // ========================================
  return (
    <Container maxWidth="md" sx={{ py: 4, px: 2 }}>
      {/* En-tête */}
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Créer un événement
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Organisez votre prochain événement entre amis
        </Typography>
      </Box>

      {/* Formulaire */}
      <Paper
        elevation={2}
        sx={{
          p: { xs: 2, sm: 4 },
          borderRadius: 3,
        }}
      >
        <Box component="form" onSubmit={handleSubmit}>
          {/* Messages d'erreur et de succès */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess("")}>
              {success}
            </Alert>
          )}

          <Stack spacing={3}>
            {/* ========================================
                SECTION 1 : INFORMATIONS PRINCIPALES
                ======================================== */}
            <Typography variant="h6" fontWeight="bold" color="primary">
              Informations principales
            </Typography>

            {/* Nom de l'événement */}
            <TextField
              fullWidth
              required
              label="Nom de l'événement"
              placeholder="Ex: Soirée jeux de société"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              InputProps={{
                startAdornment: <FileText size={20} style={{ marginRight: 8 }} />,
              }}
            />

            {/* Date et Heure */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                fullWidth
                required
                type="date"
                label="Date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={loading}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: <Calendar size={20} style={{ marginRight: 8 }} />,
                }}
              />
              <TextField
                fullWidth
                type="time"
                label="Heure (optionnelle)"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={loading}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: <Clock size={20} style={{ marginRight: 8 }} />,
                }}
              />
            </Stack>

            {/* Lieu */}
            <TextField
              fullWidth
              label="Lieu"
              placeholder="Ex: Chez Marie, 12 rue de la Paix"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={loading}
              InputProps={{
                startAdornment: <MapPin size={20} style={{ marginRight: 8 }} />,
              }}
            />

            <Divider />

            {/* ========================================
                SECTION 2 : DESCRIPTION
                ======================================== */}
            <Typography variant="h6" fontWeight="bold" color="primary">
              Description
            </Typography>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Description (optionnelle)"
              placeholder="Décrivez votre événement..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />

            <Divider />

            {/* ========================================
                SECTION 3 : TAGS
                ======================================== */}
            <Typography variant="h6" fontWeight="bold" color="primary">
              Tags
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Ajoutez des tags pour catégoriser votre événement
            </Typography>

            {/* Liste des tags */}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {tags.map((tag) => {
                const tagColorObj = TAG_COLORS.find((c) => c.value === tag.color);
                return (
                  <Chip
                    key={tag.id}
                    label={tag.name}
                    onDelete={() => handleRemoveTag(tag.id)}
                    sx={{
                      bgcolor: tagColorObj?.light || "#F3F4F6",
                      color: tag.color,
                      fontWeight: 600,
                      "& .MuiChip-deleteIcon": {
                        color: tag.color,
                      },
                    }}
                  />
                );
              })}
              <Chip
                icon={<Plus size={16} />}
                label="Ajouter un tag"
                onClick={() => setShowTagDialog(true)}
                variant="outlined"
                sx={{ cursor: "pointer" }}
              />
            </Box>

            <Divider />

            {/* ========================================
                SECTION 4 : IMAGE DE COUVERTURE
                ======================================== */}
            <Typography variant="h6" fontWeight="bold" color="primary">
              Image de couverture
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Ajoutez une image pour illustrer votre événement (optionnel)
            </Typography>

            {/* Preview de l'image */}
            {coverImagePreview ? (
              <Box sx={{ position: "relative", width: "100%", maxWidth: 400 }}>
                <Box
                  component="img"
                  src={coverImagePreview}
                  alt="Aperçu"
                  sx={{
                    width: "100%",
                    height: 200,
                    objectFit: "cover",
                    borderRadius: 2,
                  }}
                />
                <IconButton
                  onClick={handleRemoveImage}
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    bgcolor: "background.paper",
                    "&:hover": { bgcolor: "error.light" },
                  }}
                  size="small"
                >
                  <X size={18} />
                </IconButton>
              </Box>
            ) : (
              <Button
                variant="outlined"
                component="label"
                startIcon={<ImageIcon size={20} />}
                sx={{ alignSelf: "flex-start" }}
              >
                Choisir une image
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </Button>
            )}

            {/* Bouton de soumission */}
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Save size={20} />}
              sx={{ mt: 2 }}
            >
              {loading ? "Création en cours..." : "Créer l'événement"}
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* ========================================
          DIALOG : CRÉER UN TAG
          ======================================== */}
      <Dialog
        open={showTagDialog}
        onClose={() => setShowTagDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Créer un tag</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Nom du tag */}
            <TextField
              fullWidth
              label="Nom du tag"
              placeholder="Ex: Sport, Soirée, Anniversaire..."
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              InputProps={{
                startAdornment: <Tag size={20} style={{ marginRight: 8 }} />,
              }}
            />

            {/* Sélection de la couleur */}
            <Box>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                Couleur
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                {TAG_COLORS.map((color) => (
                  <Box
                    key={color.value}
                    onClick={() => setNewTagColor(color.value)}
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      bgcolor: color.value,
                      cursor: "pointer",
                      border:
                        newTagColor === color.value
                          ? "3px solid #000"
                          : "2px solid transparent",
                      transition: "all 0.2s",
                      "&:hover": {
                        transform: "scale(1.1)",
                      },
                    }}
                    title={color.name}
                  />
                ))}
              </Box>
            </Box>

            {/* Aperçu du tag */}
            {newTagName && (
              <Box>
                <Typography variant="body2" fontWeight="bold" gutterBottom>
                  Aperçu
                </Typography>
                <Chip
                  label={newTagName}
                  sx={{
                    bgcolor:
                      TAG_COLORS.find((c) => c.value === newTagColor)?.light ||
                      "#F3F4F6",
                    color: newTagColor,
                    fontWeight: 600,
                  }}
                />
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTagDialog(false)}>Annuler</Button>
          <Button
            onClick={handleAddTag}
            variant="contained"
            disabled={!newTagName.trim()}
          >
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
