/**
 * Hook personnalisé pour gérer les tags d'un événement
 * Gère l'ajout, la suppression et la modale de création
 */

import { useState, useCallback } from "react";
import { TAG_COLORS } from "../utils/tagColors";

/**
 * @returns {Object} État et fonctions de gestion des tags
 */
export function useTags() {
  const [tags, setTags] = useState([]);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0].value);

  const handleAddTag = useCallback(() => {
    if (!newTagName.trim()) {
      return;
    }

    const newTag = {
      id: Date.now(),
      name: newTagName.trim(),
      color: newTagColor,
    };

    setTags((prev) => [...prev, newTag]);
    setNewTagName("");
    setNewTagColor(TAG_COLORS[0].value);
    setShowTagDialog(false);
  }, [newTagName, newTagColor]);

  const handleRemoveTag = useCallback((tagId) => {
    setTags((prev) => prev.filter((tag) => tag.id !== tagId));
  }, []);

  const openTagDialog = useCallback(() => {
    setShowTagDialog(true);
  }, []);

  const closeTagDialog = useCallback(() => {
    setShowTagDialog(false);
    setNewTagName("");
    setNewTagColor(TAG_COLORS[0].value);
  }, []);

  return {
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
  };
}
