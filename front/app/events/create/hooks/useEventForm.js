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
    endDate: null,
    endTime: null,
    location: "",
    description: "",
    color: "#ff6b35", // Orange par défaut
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

      if (!formData.time) {
        setError("L'heure de début est obligatoire");
        return false;
      }

      if (formData.endDate && !formData.endTime) {
        setError(
          "L'heure de fin est obligatoire si vous spécifiez une date de fin"
        );
        return false;
      }

      setLoading(true);

      try {
        // Préparer la date/heure de début
        const dateObj = new Date(formData.date);
        const timeObj = new Date(formData.time);
        dateObj.setHours(timeObj.getHours(), timeObj.getMinutes(), 0, 0);
        const startDateTime = dateObj.toISOString();

        // Préparer la date/heure de fin (optionnelle)
        let endDateTime = null;
        if (formData.endDate && formData.endTime) {
          const endDateObj = new Date(formData.endDate);
          const endTimeObj = new Date(formData.endTime);
          endDateObj.setHours(
            endTimeObj.getHours(),
            endTimeObj.getMinutes(),
            0,
            0
          );
          endDateTime = endDateObj.toISOString();
        }

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
          endDate: endDateTime,
          location: formData.location.trim() || null,
          description: fullDescription || null,
          coverUrl: null,
          color: formData.color,
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
