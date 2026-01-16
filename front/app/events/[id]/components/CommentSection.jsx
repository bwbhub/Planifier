/**
 * Section des commentaires d'un événement
 */

import React from "react";
import {
  Paper,
  Typography,
  Stack,
  Box,
  Avatar,
  TextField,
  IconButton,
  Divider,
  CircularProgress,
} from "@mui/material";
import { Send, Trash2 } from "lucide-react";
import { formatDateTime } from "../utils/eventHelpers";

/**
 * @param {Object} props
 * @param {Array} props.comments - Liste des commentaires
 * @param {string} props.newComment - Nouveau commentaire
 * @param {Function} props.onCommentChange - Callback changement
 * @param {Function} props.onSend - Callback envoi
 * @param {boolean} props.sending - État d'envoi
 * @param {boolean} props.loading - Chargement des commentaires
 * @param {Function} props.onDelete - Callback suppression
 * @param {string} props.currentUserId - ID de l'utilisateur connecté
 * @param {boolean} props.isOwner - L'utilisateur est-il owner de l'événement
 */
export default function CommentSection({
  comments,
  newComment,
  onCommentChange,
  onSend,
  sending,
  loading,
  onDelete,
  currentUserId,
  isOwner,
}) {
  return (
    <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
        Commentaires
      </Typography>

      {/* Liste des commentaires */}
      <Stack spacing={2} sx={{ mb: 3, maxHeight: 400, overflowY: "auto" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : comments.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            py={4}
          >
            Aucun commentaire pour le moment
          </Typography>
        ) : (
          comments.map((comment) => {
            const canDelete = comment.user?.id === currentUserId || isOwner;

            return (
              <Box key={comment.id}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Avatar
                    src={comment.user?.avatarUrl}
                    sx={{ width: 32, height: 32 }}
                  >
                    {comment.user?.name?.[0]}
                  </Avatar>
                  <Box flex={1}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      mb={0.5}
                    >
                      <Typography variant="body2" fontWeight="600">
                        {comment.user?.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDateTime(comment.createdAt)}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                      {comment.text}
                    </Typography>
                  </Box>
                  {canDelete && (
                    <IconButton
                      size="small"
                      onClick={() => onDelete(comment.id)}
                      sx={{ color: "text.secondary" }}
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  )}
                </Stack>
              </Box>
            );
          })
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
          onChange={(e) => onCommentChange(e.target.value)}
          disabled={sending}
          size="small"
        />
        <IconButton
          color="primary"
          onClick={onSend}
          disabled={!newComment.trim() || sending}
        >
          <Send size={20} />
        </IconButton>
      </Stack>
    </Paper>
  );
}
