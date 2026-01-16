import React from "react";
import {
  Stack,
  Typography,
  Box,
  CircularProgress,
  Avatar,
  Button,
  Chip,
} from "@mui/material";
import { Users, UserPlus } from "lucide-react";

export default function FriendsList({
  friends,
  loading,
  inviting,
  isAlreadyParticipant,
  handleInviteFriend,
}) {
  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Users size={20} />
        <Typography variant="h6" fontWeight="bold">
          Mes amis ({friends.length})
        </Typography>
      </Stack>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : friends.length === 0 ? (
        <Box
          sx={{
            textAlign: "center",
            py: 4,
            color: "text.secondary",
          }}
        >
          <Typography variant="body2">
            Vous n&apos;avez pas encore d&apos;amis dans votre liste.
          </Typography>
          <Typography variant="caption">
            Ajoutez des amis depuis votre profil pour les inviter rapidement.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {friends.map((friend) => {
            const isParticipant = isAlreadyParticipant(friend.id);
            const isInviting = inviting === friend.id;

            return (
              <Stack
                key={friend.id}
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
                  <Avatar src={friend.avatarUrl} sx={{ width: 40, height: 40 }}>
                    {friend.name?.[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight="500">
                      {friend.name || "Sans nom"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {friend.email}
                    </Typography>
                  </Box>
                </Stack>

                {isParticipant ? (
                  <Chip label="Déjà invité" size="small" color="success" />
                ) : (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={
                      isInviting ? (
                        <CircularProgress size={16} />
                      ) : (
                        <UserPlus size={16} />
                      )
                    }
                    onClick={() => handleInviteFriend(friend.id)}
                    disabled={isInviting}
                  >
                    Inviter
                  </Button>
                )}
              </Stack>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
