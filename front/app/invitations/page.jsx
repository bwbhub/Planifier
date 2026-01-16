"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Calendar, MapPin, User, Mail } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";

export default function InvitationsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingInvite, setProcessingInvite] = useState(null);

  const fetchInvites = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:4000/api/invites", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setInvites(data.invites || []);
      } else {
        setError("Erreur lors du chargement des invitations");
      }
    } catch (err) {
      console.error("Erreur fetchInvites:", err);
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    fetchInvites();
  }, [token, fetchInvites]);

  const handleAcceptInvite = async (inviteToken) => {
    try {
      setProcessingInvite(inviteToken);
      const res = await fetch(
        `http://localhost:4000/api/invites/${inviteToken}/accept`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (res.ok) {
        // Rediriger vers l'événement
        if (data.eventId) {
          router.push(`/events/${data.eventId}`);
        }
      } else {
        alert(data.error || "Erreur lors de l'acceptation");
        setProcessingInvite(null);
      }
    } catch (err) {
      console.error("Erreur acceptation:", err);
      alert("Erreur de connexion");
      setProcessingInvite(null);
    }
  };

  const handleDeclineInvite = async (inviteId) => {
    // TODO: Implémenter la logique de refus d'invitation
    console.log("Refuser invitation:", inviteId);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Mes invitations
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {invites.length === 0 ? (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
            px: 2,
          }}
        >
          <Mail size={64} style={{ opacity: 0.3, marginBottom: 16 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Aucune invitation en attente
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Vous n&apos;avez pas d&apos;invitation pour le moment
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {invites.map((invite) => (
            <Card
              key={invite.id}
              sx={{
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: 4,
                },
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" component="div">
                    {invite.event.title}
                  </Typography>
                  <Chip
                    label={invite.role}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>

                {invite.event.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {invite.event.description}
                  </Typography>
                )}

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Calendar size={16} />
                    <Typography variant="body2">
                      {formatDate(invite.event.startDate)}
                    </Typography>
                  </Box>

                  {invite.event.location && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <MapPin size={16} />
                      <Typography variant="body2">
                        {invite.event.location}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <User size={16} />
                    <Typography variant="body2">
                      Invité par {invite.inviter.name}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>

              <CardActions sx={{ justifyContent: "flex-end", px: 2, pb: 2 }}>
                <Button
                  size="small"
                  onClick={() => handleDeclineInvite(invite.id)}
                  disabled={processingInvite === invite.token}
                >
                  Refuser
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => handleAcceptInvite(invite.token)}
                  disabled={processingInvite === invite.token}
                >
                  {processingInvite === invite.token ? (
                    <CircularProgress size={20} />
                  ) : (
                    "Accepter"
                  )}
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
