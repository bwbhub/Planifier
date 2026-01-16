import React from "react";
import {
  Stack,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Mail, Send } from "lucide-react";

export default function InviteByEmail({
  email,
  setEmail,
  invitingByEmail,
  successMessage,
  setSuccessMessage,
  handleInviteByEmail,
}) {
  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Mail size={20} />
        <Typography variant="h6" fontWeight="bold">
          Inviter par email
        </Typography>
      </Stack>

      <Typography variant="body2" color="text.secondary">
        Invitez quelqu&apos;un qui n&apos;est pas dans votre liste d&apos;amis.
        Si la personne n&apos;a pas de compte, elle recevra un lien pour
        s&apos;inscrire.
      </Typography>

      <Stack direction="row" spacing={1.5}>
        <TextField
          fullWidth
          size="small"
          placeholder="email@exemple.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !invitingByEmail) {
              handleInviteByEmail();
            }
          }}
          disabled={invitingByEmail}
        />
        <Button
          variant="contained"
          startIcon={
            invitingByEmail ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <Send size={16} />
            )
          }
          onClick={handleInviteByEmail}
          disabled={invitingByEmail || !email}
        >
          Inviter
        </Button>
      </Stack>

      {successMessage && (
        <Alert severity="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}
    </Stack>
  );
}
