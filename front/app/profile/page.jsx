"use client";
import React from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  CircularProgress,
  Divider,
} from "@mui/material";
import { useAuth } from "../../context/AuthContext";

// Composants
import ProfileHeader from "./components/ProfileHeader.jsx";
import ProfileForm from "./components/ProfileForm.jsx";

// Hooks
import { useProfile } from "./hooks/useProfile";

/**
 * Page de profil utilisateur
 * Permet de voir et modifier les informations du profil
 */
export default function ProfilePage() {
  const { token, updateUser } = useAuth();

  const {
    profile,
    loading,
    saving,
    error,
    success,
    setError,
    setSuccess,
    saveProfile,
  } = useProfile(token, updateUser);

  // Affichage pendant le chargement
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "80vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Mon Profil
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Gérez vos informations personnelles
      </Typography>

      <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
        <ProfileHeader name={profile.name} email={profile.email} />

        <Divider sx={{ my: 3 }} />

        <ProfileForm
          profile={profile}
          saving={saving}
          error={error}
          success={success}
          onSubmit={saveProfile}
          onErrorClose={() => setError("")}
          onSuccessClose={() => setSuccess("")}
        />
      </Paper>
    </Container>
  );
}
