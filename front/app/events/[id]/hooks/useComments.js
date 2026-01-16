/**
 * Hook personnalisé pour gérer les commentaires d'un événement
 */

import { useState, useCallback, useEffect } from "react";

/**
 * @param {string} token - Token d'authentification
 * @param {string} eventId - ID de l'événement
 * @returns {Object} État et fonctions des commentaires
 */
export function useComments(token, eventId) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Charger les commentaires
  const loadComments = useCallback(async () => {
    if (!token || !eventId) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `http://localhost:4000/api/events/${eventId}/comments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error("Erreur de chargement des commentaires");

      const data = await res.json();
      setComments(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, eventId]);

  // Envoyer un commentaire
  const handleSendComment = useCallback(async () => {
    if (!newComment.trim() || !token || !eventId) return;

    setSendingComment(true);
    try {
      const res = await fetch(
        `http://localhost:4000/api/events/${eventId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: newComment }),
        }
      );

      if (!res.ok) throw new Error("Erreur lors de l'envoi du commentaire");

      const comment = await res.json();
      setComments((prev) => [comment, ...prev]);
      setNewComment("");
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSendingComment(false);
    }
  }, [newComment, token, eventId]);

  // Supprimer un commentaire
  const handleDeleteComment = useCallback(
    async (commentId) => {
      if (!token) return;

      try {
        const res = await fetch(
          `http://localhost:4000/api/comments/${commentId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error("Erreur lors de la suppression");

        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    },
    [token]
  );

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  return {
    comments,
    newComment,
    setNewComment,
    sendingComment,
    loading,
    error,
    handleSendComment,
    handleDeleteComment,
    loadComments,
  };
}
