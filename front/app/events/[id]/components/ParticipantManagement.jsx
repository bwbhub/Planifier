/**
 * Drawer de gestion des invitations et participants
 * Permet d'inviter de nouveaux participants et de gérer les invitations en attente
 */

import React, { useState } from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
} from "@mui/material";
import { X, UserPlus, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ParticipantManagementView } from "@/app/constants/uiConstants";
import { useParticipantManagement } from "../hooks/useParticipantManagement";
import InviteByEmail from "./InviteByEmail";
import FriendsList from "./FriendsList";
import ParticipantsView from "./ParticipantsView";

/**
 * @param {Object} props
 * @param {boolean} props.open - État d'ouverture du drawer
 * @param {Function} props.onClose - Callback de fermeture
 * @param {Object} props.event - Données de l'événement
 */
export default function ParticipantManagement({ open, onClose, event }) {
  const { token } = useAuth();
  const [view, setView] = useState(ParticipantManagementView.PARTICIPANTS);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedParticipant, setSelectedParticipant] = useState(null);

  const {
    friends,
    loading,
    error,
    inviting,
    email,
    setEmail,
    invitingByEmail,
    successMessage,
    setError,
    setSuccessMessage,
    handleInviteFriend,
    handleInviteByEmail,
  } = useParticipantManagement(token, event?.id, open);

  const isAlreadyParticipant = (friendId) => {
    return event?.participants?.some((p) => p.userId === friendId);
  };

  const currentUserRole = event?.participants?.find(
    (p) => p.userId === event.currentUserId
  )?.role;

  const handleOpenMenu = (e, participant) => {
    setAnchorEl(e.currentTarget);
    setSelectedParticipant(participant);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedParticipant(null);
  };

  const handlePromote = () => {
    console.log("Promouvoir", selectedParticipant);
    handleCloseMenu();
  };

  const handleDemote = () => {
    console.log("Rétrograder", selectedParticipant);
    handleCloseMenu();
  };

  const handleRemove = () => {
    console.log("Supprimer", selectedParticipant);
    handleCloseMenu();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 800 },
          p: 3,
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
          borderTopLeftRadius: { xs: 0, sm: 16 },
          borderBottomLeftRadius: { xs: 0, sm: 16 },
        },
      }}
    >
      {/* En-tête */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h5" fontWeight="bold">
          Gestion des invitations
        </Typography>
        <IconButton onClick={onClose} size="small">
          <X size={20} />
        </IconButton>
      </Stack>

      {/* Description */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Invitez de nouveaux participants à votre événement et gérez les
        invitations en attente. Vous pouvez également modifier les rôles des
        participants existants.
      </Typography>

      <Divider sx={{ mb: 3 }} />

      {/* Toggle entre Ajouter et Participants */}
      <ToggleButtonGroup
        value={view}
        exclusive
        onChange={(e, newView) => newView && setView(newView)}
        fullWidth
        sx={{ mb: 3, height: 40 }}
      >
        <ToggleButton
          value={ParticipantManagementView.PARTICIPANTS}
          sx={{
            "&.Mui-selected": {
              backgroundColor: "primary.main",
              padding: "8px 16px",
              color: "white",
            },
            borderRadius: "8px 0 0 8px",
          }}
        >
          <Users size={18} style={{ marginRight: 8 }} />
          Participants ({event?.participants?.length || 0})
        </ToggleButton>
        <ToggleButton
          value={ParticipantManagementView.ADD}
          sx={{
            "&.Mui-selected": {
              backgroundColor: "primary.main",
              padding: "8px 16px",
              color: "white",
            },
            borderRadius: "0 8px 8px 0",
          }}
        >
          <UserPlus size={18} style={{ marginRight: 8 }} />
          Ajouter
        </ToggleButton>
      </ToggleButtonGroup>

      {/* Contenu */}
      <Box>
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {view === ParticipantManagementView.ADD ? (
          <>
            <InviteByEmail
              email={email}
              setEmail={setEmail}
              invitingByEmail={invitingByEmail}
              successMessage={successMessage}
              setSuccessMessage={setSuccessMessage}
              handleInviteByEmail={handleInviteByEmail}
            />

            <Divider sx={{ my: 3 }} />

            <FriendsList
              friends={friends}
              loading={loading}
              inviting={inviting}
              isAlreadyParticipant={isAlreadyParticipant}
              handleInviteFriend={handleInviteFriend}
            />
          </>
        ) : (
          <ParticipantsView
            participants={event?.participants}
            currentUserRole={currentUserRole}
            anchorEl={anchorEl}
            selectedParticipant={selectedParticipant}
            onOpenMenu={handleOpenMenu}
            onCloseMenu={handleCloseMenu}
            onPromote={handlePromote}
            onDemote={handleDemote}
            onRemove={handleRemove}
          />
        )}
      </Box>
    </Drawer>
  );
}
