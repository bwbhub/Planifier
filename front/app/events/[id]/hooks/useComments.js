/**
 * Hook personnalisé pour gérer les commentaires d'un événement
 */

import { useState, useCallback } from "react";

/**
 * @param {Object} user - Utilisateur connecté
 * @returns {Object} État et fonctions des commentaires
 */
export function useComments(user) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  const handleSendComment = useCallback(async () => {
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
      setComments((prev) => [mockComment, ...prev]);
      setNewComment("");
    } catch (err) {
      console.error(err);
    } finally {
      setSendingComment(false);
    }
  }, [newComment, user]);

  return {
    comments,
    newComment,
    setNewComment,
    sendingComment,
    handleSendComment,
  };
}
