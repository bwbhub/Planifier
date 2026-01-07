/**
 * Actions principales de l'événement (footer sticky)
 */

import React from "react";
import { Paper, Button } from "@mui/material";
import { Share2 } from "lucide-react";

/**
 * @param {Object} props
 * @param {boolean} props.hasParticipation - L'utilisateur participe-t-il
 * @param {Function} props.onJoinLeave - Callback rejoindre/quitter
 * @param {Function} props.onShare - Callback partager
 */
export default function EventActions({
  hasParticipation,
  onJoinLeave,
  onShare,
}) {
  return (
    <Paper
      elevation={3}
      sx={{
        position: "fixed",
        bottom: { xs: 100, md: 20 },
        left: { xs: 16, md: "50%" },
        transform: { xs: "none", md: "translateX(-50%)" },
        right: { xs: 16, md: "auto" },
        p: 2,
        borderRadius: 2,
        zIndex: 1100,
        display: "flex",
        gap: 2,
        justifyContent: "center",
        flexWrap: "wrap",
      }}
    >
      <Button
        variant="contained"
        size="large"
        onClick={onJoinLeave}
        sx={{ minWidth: 150 }}
      >
        {hasParticipation ? "Quitter l'événement" : "Rejoindre"}
      </Button>
      <Button
        variant="outlined"
        size="large"
        startIcon={<Share2 size={18} />}
        onClick={onShare}
      >
        Partager
      </Button>
    </Paper>
  );
}
