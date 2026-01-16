import React from "react";
import {
  Stack,
  Typography,
  Box,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { Crown, MoreVertical, Trash2, UserCog } from "lucide-react";

export default function ParticipantsView({
  participants,
  currentUserRole,
  anchorEl,
  selectedParticipant,
  onOpenMenu,
  onCloseMenu,
  onPromote,
  onDemote,
  onRemove,
}) {
  if (!participants || participants.length === 0) {
    return (
      <Box
        sx={{
          textAlign: "center",
          py: 4,
          color: "text.secondary",
        }}
      >
        <Typography variant="body2">
          Aucun participant pour le moment
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Stack spacing={1.5}>
        {participants.map((participant) => {
          const isOwner = participant.role === "OWNER";
          const isOrganizer = participant.role === "ORGANIZER";
          const canManage =
            currentUserRole === "OWNER" ||
            (currentUserRole === "ORGANIZER" && !isOwner);

          return (
            <Stack
              key={participant.id}
              direction="row"
              spacing={2}
              alignItems="center"
              justifyContent="space-between"
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: "background.paper",
                border: 1,
                borderColor: "divider",
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar
                  src={participant.user?.avatarUrl}
                  sx={{ width: 40, height: 40 }}
                >
                  {participant.user?.name?.[0]}
                </Avatar>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" fontWeight="500">
                      {participant.user?.name || "Sans nom"}
                    </Typography>
                    {isOwner && (
                      <Crown size={14} style={{ color: "#FFD700" }} />
                    )}
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {participant.user?.email}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  label={participant.role}
                  size="small"
                  color={
                    isOwner ? "primary" : isOrganizer ? "secondary" : "default"
                  }
                />
                <Chip
                  label={participant.status}
                  size="small"
                  variant="outlined"
                  color={
                    participant.status === "GOING"
                      ? "success"
                      : participant.status === "MAYBE"
                      ? "warning"
                      : participant.status === "NOT_GOING"
                      ? "error"
                      : "default"
                  }
                />

                {canManage && !isOwner && (
                  <IconButton
                    size="small"
                    onClick={(e) => onOpenMenu(e, participant)}
                  >
                    <MoreVertical size={18} />
                  </IconButton>
                )}
              </Stack>
            </Stack>
          );
        })}
      </Stack>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onCloseMenu}>
        {selectedParticipant?.role !== "ORGANIZER" && (
          <MenuItem onClick={onPromote}>
            <ListItemIcon>
              <UserCog size={18} />
            </ListItemIcon>
            <ListItemText>Promouvoir Organisateur</ListItemText>
          </MenuItem>
        )}

        {selectedParticipant?.role === "ORGANIZER" &&
          currentUserRole === "OWNER" && (
            <MenuItem onClick={onDemote}>
              <ListItemIcon>
                <UserCog size={18} />
              </ListItemIcon>
              <ListItemText>Rétrograder en Guest</ListItemText>
            </MenuItem>
          )}

        <MenuItem onClick={onRemove} sx={{ color: "error.main" }}>
          <ListItemIcon>
            <Trash2 size={18} color="currentColor" />
          </ListItemIcon>
          <ListItemText>Retirer du groupe</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
