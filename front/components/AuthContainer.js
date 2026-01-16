"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Box,
  TextField,
  Button,
  Typography,
  Stack,
  useTheme,
  alpha,
  IconButton,
  InputAdornment,
  Alert,
} from "@mui/material";
import { Eye, EyeOff, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function AuthContainer({ isRegister = false }) {
  const [isSignUp, setIsSignUp] = useState(isRegister);
  const { login } = useAuth();
  const theme = useTheme();
  const searchParams = useSearchParams();
  const router = useRouter();
  const inviteToken = searchParams?.get("inviteToken");
  const emailFromUrl = searchParams?.get("email");
  const eventTitleFromUrl = searchParams?.get("eventTitle");
  const [inviteData, setInviteData] = useState(null);

  // États pour Sign In
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInError, setSignInError] = useState("");
  const [signInLoading, setSignInLoading] = useState(false);
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // États pour Sign Up
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState(emailFromUrl || "");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
  const [signUpError, setSignUpError] = useState("");
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] =
    useState(false);

  // Charger les données de l'invitation depuis l'URL en priorité
  useEffect(() => {
    if (inviteToken && isRegister && eventTitleFromUrl) {
      // Utiliser les données de l'URL directement
      setInviteData({
        email: emailFromUrl,
        event: {
          title: eventTitleFromUrl,
        },
      });
    }
  }, [inviteToken, isRegister, emailFromUrl, eventTitleFromUrl]);

  const handleToggle = () => {
    if (!isRegister) {
      setIsSignUp(!isSignUp);
      // Reset errors
      setSignInError("");
      setSignUpError("");
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setSignInError("");
    setSignInLoading(true);

    const res = await login(signInEmail, signInPassword);

    if (!res.success) {
      setSignInError(res.error);
      setSignInLoading(false);
    } else {
      // Rediriger vers le dashboard après connexion réussie
      router.push("/dashboard");
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setSignUpError("");

    if (signUpPassword !== signUpConfirmPassword) {
      setSignUpError("Les mots de passe ne correspondent pas");
      return;
    }

    setSignUpLoading(true);

    try {
      const res = await fetch("http://localhost:4000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: signUpName.trim(),
          email: signUpEmail.trim(),
          password: signUpPassword.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'inscription");
      }

      // Auto-login après inscription
      const loginRes = await login(signUpEmail, signUpPassword);
      if (!loginRes.success) {
        setSignUpError("Inscription réussie mais erreur de connexion");
        setSignUpLoading(false);
        return;
      }

      // Si inscription via invitation, accepter l'invitation
      if (inviteToken) {
        try {
          console.log(
            "Tentative d'acceptation de l'invitation avec token:",
            inviteToken
          );
          const acceptRes = await fetch(
            `http://localhost:4000/api/invites/${inviteToken}/accept`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${loginRes.token}`,
              },
            }
          );

          const acceptData = await acceptRes.json();
          console.log("Réponse acceptation invitation:", acceptData);

          if (acceptRes.ok && acceptData.eventId) {
            console.log("Redirection vers l'événement:", acceptData.eventId);
            router.push(`/events/${acceptData.eventId}`);
            return; // Important : empêcher la redirection par défaut
          } else {
            console.error("Erreur lors de l'acceptation:", acceptData);
            setSignUpError(
              acceptData.error || "Erreur lors de l'acceptation de l'invitation"
            );
            setSignUpLoading(false);
            return;
          }
        } catch (inviteError) {
          console.error("Erreur acceptation invitation:", inviteError);
          setSignUpError("Erreur lors de l'acceptation de l'invitation");
          setSignUpLoading(false);
          return;
        }
      }

      // Si pas d'invitation, rediriger vers le dashboard
      router.push("/dashboard");
    } catch (error) {
      setSignUpError(error.message);
      setSignUpLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        bgcolor: "background.default",
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: { xs: "100%", sm: 500, md: 768 },
          height: { xs: 600, md: 480 },
          bgcolor: "background.paper",
          borderRadius: { xs: "48px", md: "60px" },
          overflow: "hidden",
          boxShadow:
            theme.palette.mode === "light"
              ? "0 5px 15px rgba(0,0,0,0.1)"
              : "0 5px 15px rgba(0,0,0,0.4)",
        }}
      >
        {/* Sign In Form */}
        {!isRegister && (
          <Box
            component="form"
            onSubmit={handleSignIn}
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: { xs: "100%", md: "50%" },
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              p: { xs: 3, md: 5 },
              transition: "all 0.6s ease-in-out",
              transform: isSignUp
                ? { xs: "translateY(-100%)", md: "translateX(100%)" }
                : "translateX(0)",
              opacity: isSignUp ? 0 : 1,
              visibility: isSignUp ? "hidden" : "visible",
              pointerEvents: isSignUp ? "none" : "auto",
              zIndex: isSignUp ? 1 : 2,
            }}
          >
            <Typography
              variant="h4"
              fontWeight="bold"
              color="primary"
              gutterBottom
            >
              Connexion
            </Typography>

            {signInError && (
              <Typography variant="caption" color="error" sx={{ mb: 1 }}>
                {signInError}
              </Typography>
            )}

            <Stack spacing={2} sx={{ width: "100%" }}>
              <TextField
                fullWidth
                size="small"
                type="email"
                placeholder="Email"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                disabled={signInLoading}
              />
              <TextField
                fullWidth
                size="small"
                type={showSignInPassword ? "text" : "password"}
                placeholder="Mot de passe"
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                disabled={signInLoading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() =>
                          setShowSignInPassword(!showSignInPassword)
                        }
                        edge="end"
                        size="small"
                      >
                        {showSignInPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Typography
                variant="caption"
                color="primary"
                sx={{ cursor: "pointer", textAlign: "right" }}
              >
                Mot de passe oublié ?
              </Typography>
              <Button
                fullWidth
                variant="contained"
                type="submit"
                disabled={signInLoading}
                sx={{ mt: 2 }}
              >
                {signInLoading ? "Connexion..." : "Se connecter"}
              </Button>
            </Stack>
          </Box>
        )}

        {/* Sign Up Form */}
        <Box
          component="form"
          onSubmit={handleSignUp}
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: { xs: "100%", md: "50%" },
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: { xs: 3, md: 5 },
            transition: "all 0.6s ease-in-out",
            transform: isSignUp
              ? { xs: "translateY(0)", md: "translateX(100%)" }
              : { xs: "translateY(100%)", md: "translateX(0)" },
            opacity: isSignUp ? 1 : 0,
            visibility: isSignUp ? "visible" : "hidden",
            pointerEvents: isSignUp ? "auto" : "none",
            zIndex: isSignUp ? 5 : 1,
          }}
        >
          <Typography
            variant="h4"
            fontWeight="bold"
            color="primary"
            gutterBottom
          >
            {isRegister ? "Créer votre compte" : "Inscription"}
          </Typography>

          {isRegister && inviteData && (
            <Alert
              severity="info"
              icon={<Mail size={20} />}
              sx={{ mb: 2, width: "100%" }}
            >
              Vous avez été invité à l&apos;événement{" "}
              <strong>{inviteData.event?.title}</strong>
            </Alert>
          )}

          {signUpError && (
            <Typography variant="caption" color="error" sx={{ mb: 1 }}>
              {signUpError}
            </Typography>
          )}

          <Stack spacing={2} sx={{ width: "100%" }}>
            <TextField
              fullWidth
              size="small"
              type="text"
              placeholder="Nom"
              value={signUpName}
              onChange={(e) => setSignUpName(e.target.value)}
              disabled={signUpLoading}
            />
            <TextField
              fullWidth
              size="small"
              type="email"
              placeholder="Email"
              value={signUpEmail}
              onChange={(e) => setSignUpEmail(e.target.value)}
              disabled={signUpLoading || (isRegister && inviteToken)}
            />
            <TextField
              fullWidth
              size="small"
              type={showSignUpPassword ? "text" : "password"}
              placeholder="Mot de passe"
              value={signUpPassword}
              onChange={(e) => setSignUpPassword(e.target.value)}
              disabled={signUpLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      edge="end"
                      size="small"
                    >
                      {showSignUpPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              size="small"
              type={showSignUpConfirmPassword ? "text" : "password"}
              placeholder="Confirmer le mot de passe"
              value={signUpConfirmPassword}
              onChange={(e) => setSignUpConfirmPassword(e.target.value)}
              disabled={signUpLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() =>
                        setShowSignUpConfirmPassword(!showSignUpConfirmPassword)
                      }
                      edge="end"
                      size="small"
                    >
                      {showSignUpConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              fullWidth
              variant="contained"
              type="submit"
              disabled={signUpLoading}
              sx={{ mt: 2 }}
            >
              {signUpLoading ? "Inscription..." : "S'inscrire"}
            </Button>
          </Stack>
        </Box>

        {/* Toggle Panel */}

        <Box
          sx={{
            position: "absolute",
            top: { xs: "auto", md: 0 },
            bottom: { xs: 0, md: "auto" },
            left: { xs: 0, md: "50%" },
            width: { xs: "100%", md: "50%" },
            height: { xs: "40%", md: "100%" },
            overflow: "hidden",
            transition: "all 0.6s ease-in-out",
            transform: isSignUp
              ? { xs: "translateY(0)", md: "translateX(-100%)" }
              : { xs: "translateY(0)", md: "translateX(0)" },
            borderRadius: isSignUp
              ? { xs: "48px 48px 0 0", md: "60px 0 0 60px" }
              : { xs: "48px 48px 0 0", md: "0 60px 60px 0" },
            zIndex: 1000,
          }}
        >
          <Box
            sx={{
              position: "relative",
              width: { xs: "100%", md: "200%" },
              height: "100%",
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              color: "#fff",
              left: { xs: 0, md: "-100%" },
              transition: "all 0.6s ease-in-out",
              transform: isSignUp
                ? { xs: "translateX(0)", md: "translateX(50%)" }
                : "translateX(0)",
            }}
          >
            {/* Toggle Left (visible when Sign Up is active) */}
            <Box
              sx={{
                position: "absolute",
                width: { xs: "100%", md: "50%" },
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                p: 4,
                textAlign: "center",
                left: 0,
                transition: "all 0.6s ease-in-out",
                transform: isSignUp
                  ? { xs: "translateX(0)", md: "translateX(0)" }
                  : { xs: "translateX(0)", md: "translateX(-200%)" },
              }}
            >
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {isRegister ? "Vous avez été invité" : "Déjà inscrit ?"}
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, opacity: 0.9 }}>
                {isRegister
                  ? "Créez un compte pour accéder à l'application"
                  : "Vous pouvez maintenant vous connecter"}
              </Typography>
              {!isRegister && (
                <Button
                  variant="outlined"
                  onClick={handleToggle}
                  sx={{
                    color: "#fff",
                    borderColor: "#fff",
                    "&:hover": {
                      borderColor: "#fff",
                      bgcolor: alpha("#fff", 0.1),
                    },
                  }}
                >
                  Se connecter
                </Button>
              )}
            </Box>

            {/* Toggle Right (visible when Sign In is active) */}
            <Box
              sx={{
                position: "absolute",
                width: { xs: "100%", md: "50%" },
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                p: 4,
                textAlign: "center",
                right: 0,
                transition: "all 0.6s ease-in-out",
                transform: isSignUp
                  ? { xs: "translateX(0)", md: "translateX(200%)" }
                  : { xs: "translateX(0)", md: "translateX(0)" },
              }}
            >
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Nouveau ici ?
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, opacity: 0.9 }}>
                Inscrivez-vous pour profiter de toutes les fonctionnalités
              </Typography>
              <Button
                variant="outlined"
                onClick={handleToggle}
                sx={{
                  color: "#fff",
                  borderColor: "#fff",
                  "&:hover": {
                    borderColor: "#fff",
                    bgcolor: alpha("#fff", 0.1),
                  },
                }}
              >
                S&apos;inscrire
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
