"use client";
import React, { useEffect } from "react";
import {
  Container,
  Paper,
  Box,
  Stack,
  Alert,
  Button,
  CircularProgress,
} from "@mui/material";
import { Save } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useSearchParams } from "next/navigation";

// Composants
import CreateEventHeader from "./components/CreateEventHeader.jsx";
import EventFormFields from "./components/EventFormFields.jsx";
import TagSection from "./components/TagSection.jsx";
import ImageUpload from "./components/ImageUpload.jsx";
import TagDialog from "./components/TagDialog.jsx";

// Hooks
import { useEventForm } from "./hooks/useEventForm";
import { useTags } from "./hooks/useTags";

/**
 * Page de création d'événement
 * Formulaire simple et moderne pour créer un nouvel événement
 */
export default function CreateEventPage() {
  const { token } = useAuth();
  const searchParams = useSearchParams();

  // Hooks personnalisés
  const {
    formData,
    updateField,
    coverImagePreview,
    handleImageChange,
    handleRemoveImage,
    loading,
    error,
    success,
    setError,
    setSuccess,
    submitEvent,
  } = useEventForm(token);

  const {
    tags,
    showTagDialog,
    newTagName,
    setNewTagName,
    newTagColor,
    setNewTagColor,
    handleAddTag,
    handleRemoveTag,
    openTagDialog,
    closeTagDialog,
  } = useTags();

  // Pré-remplir la date/heure depuis les paramètres URL
  useEffect(() => {
    const start = searchParams.get("start");
    if (start) {
      const startDate = new Date(start);
      updateField("date", startDate);
      updateField("time", startDate);
    }
  }, [searchParams, updateField]);

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    await submitEvent(tags);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4, px: 2 }}>
      <CreateEventHeader />

      <Paper elevation={2} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          {/* Messages d'erreur et de succès */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert
              severity="success"
              sx={{ mb: 3 }}
              onClose={() => setSuccess("")}
            >
              {success}
            </Alert>
          )}

          <Stack spacing={3}>
            {/* Champs du formulaire */}
            <EventFormFields
              formData={formData}
              updateField={updateField}
              disabled={loading}
            />

            {/* Section tags */}
            <TagSection
              tags={tags}
              onRemoveTag={handleRemoveTag}
              onOpenDialog={openTagDialog}
            />

            {/* Upload d'image */}
            <ImageUpload
              preview={coverImagePreview}
              onChange={handleImageChange}
              onRemove={handleRemoveImage}
            />

            {/* Bouton de soumission */}
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={
                loading ? <CircularProgress size={20} /> : <Save size={20} />
              }
              sx={{ mt: 2 }}
            >
              {loading ? "Création en cours..." : "Créer l'événement"}
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Modale de création de tag */}
      <TagDialog
        open={showTagDialog}
        onClose={closeTagDialog}
        tagName={newTagName}
        onTagNameChange={setNewTagName}
        tagColor={newTagColor}
        onTagColorChange={setNewTagColor}
        onAdd={handleAddTag}
      />
    </Container>
  );
}
