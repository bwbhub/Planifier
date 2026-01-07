/**
 * Section de chat d'un événement
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
} from "@mui/material";
import { Send } from "lucide-react";
import { formatDateTime } from "../utils/eventHelpers";

/**
 * @param {Object} props
 * @param {Array} props.messages - Liste des messages
 * @param {string} props.newMessage - Nouveau message
 * @param {Function} props.onMessageChange - Callback changement
 * @param {Function} props.onSend - Callback envoi
 * @param {boolean} props.sending - État d'envoi
 * @param {Object} props.chatEndRef - Référence pour auto-scroll
 */
export default function ChatSection({
  messages,
  newMessage,
  onMessageChange,
  onSend,
  sending,
  chatEndRef,
}) {
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <Paper
      elevation={1}
      sx={{
        p: 3,
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
        height: 500,
      }}
    >
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
          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            py={4}
          >
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
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={sending}
          size="small"
        />
        <IconButton
          color="primary"
          onClick={onSend}
          disabled={!newMessage.trim() || sending}
        >
          <Send size={20} />
        </IconButton>
      </Stack>
    </Paper>
  );
}
