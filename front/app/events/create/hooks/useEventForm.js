/**
 * Hook personnalisé pour gérer le formulaire de création d'événement
 * Gère les états, la validation et la soumission
 */

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

/**
 * @param {string} token - Token d'authentification
 * @returns {Object} État et fonctions du formulaire
 */
export function useEventForm(token) {
  const router = useRouter();

  // États du formulaire
  const [formData, setFormData] = useState({
    name: "",
    date: null,
    time: null,
    location: "",
    description: "",
  });

  const [coverImage, setCoverImage] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Mise à jour d'un champ
  const updateField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Gestion de l'image
  const handleImageChange = useCallback((file) => {
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleRemoveImage = useCallback(() => {
    setCoverImage(null);
    setCoverImagePreview("");
  }, []);

  // Soumission du formulaire
  const submitEvent = useCallback(
    async (tags) => {
      setError("");
      setSuccess("");

      // Validation
      if (!formData.name.trim()) {
        setError("Le nom de l'événement est obligatoire");
        return false;
      }

      if (!formData.date) {
        setError("La date de l'événement est obligatoire");
        return false;
      }

      setLoading(true);

      try {
        // Préparer la date/heure
        const dateObj = new Date(formData.date);
        if (formData.time) {
          const timeObj = new Date(formData.time);
          dateObj.setHours(timeObj.getHours(), timeObj.getMinutes(), 0, 0);
        } else {
          dateObj.setHours(0, 0, 0, 0);
        }
        const startDateTime = dateObj.toISOString();

        // Ajouter les tags à la description
        let fullDescription = formData.description.trim();
        if (tags.length > 0) {
          const tagsText = tags.map((tag) => `#${tag.name}`).join(" ");
          fullDescription = fullDescription
            ? `${fullDescription}\n\nTags: ${tagsText}`
            : `Tags: ${tagsText}`;
        }

        const eventData = {
          title: formData.name.trim(),
          startDate: startDateTime,
          endDate: null,
          location: formData.location.trim() || null,
          description: fullDescription || null,
          coverUrl: null,
          settings: {
            isGuestListVisible: true,
            allowGuestInvite: false,
            maxParticipants: null,
          },
        };

        // Appel API
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
          throw new Error(
            data.error || "Erreur lors de la création de l'événement"
          );
        }

        setSuccess("Événement créé avec succès !");

        // Redirection après 1 seconde
        setTimeout(() => {
          router.push("/events");
        }, 1000);

        return true;
      } catch (err) {
        setError(err.message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [formData, token, router]
  );

  return {
    formData,
    updateField,
    coverImage,
    coverImagePreview,
    handleImageChange,
    handleRemoveImage,
    loading,
    error,
    success,
    setError,
    setSuccess,
    submitEvent,
  };
}
