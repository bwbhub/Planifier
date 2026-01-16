/**
 * Liste des participants d'un événement
 */

import React from "react";
import {
  Paper,
  Typography,
  Stack,
  Box,
  Avatar,
  Chip,
  IconButton,
  Button,
} from "@mui/material";
import { UserPlus } from "lucide-react";
import {
  getRoleLabel,
  getStatusLabel,
  getStatusIcon,
  getStatusColor,
} from "../../constants/participantConstants";

/**
 * @param {Object} props
 * @param {Array} props.participants - Liste des participants
 * @param {boolean} props.isOrganizer - L'utilisateur est-il organisateur
 * @param {Function} props.onAddParticipant - Callback ajout participant
 * @param {Function} props.onManageInvitations - Callback gestion invitations
 */

export default function ParticipantsList({
  participants,
  isOrganizer,
  onAddParticipant,
  onManageInvitations,
}) {
  return (
    <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      >
        <Typography variant="h6" fontWeight="bold">
          Participants ({participants?.length || 0})
        </Typography>
        {isOrganizer && (
          <IconButton size="small" onClick={onAddParticipant}>
            <UserPlus size={18} />
          </IconButton>
        )}
      </Stack>

      <Stack spacing={1.5} sx={{ maxHeight: 300, overflowY: "auto" }}>
        {participants?.map((participant) => (
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
                  {getRoleLabel(participant.role)}
                </Typography>
              </Box>
            </Stack>
            <Chip
              icon={getStatusIcon(participant.status)}
              label={getStatusLabel(participant.status)}
              color={getStatusColor(participant.status)}
              size="small"
            />
          </Stack>
        ))}
      </Stack>

      {isOrganizer && (
        <Button
          variant="outlined"
          fullWidth
          sx={{ mt: 2 }}
          onClick={onManageInvitations}
        >
          Gérer les invitations
        </Button>
      )}
    </Paper>
  );
}
