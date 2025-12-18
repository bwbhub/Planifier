"use client";
import { createTheme } from "@mui/material/styles";

// Définition des tokens de couleurs
export const tokens = {
  light: {
    text: "#363636",
    background: "#fafafa",
    primary: "#f05000",
    secondary: "#ff9585",
    accent: "#ffbb3d",
  },
  dark: {
    text: "#c9c9c9",
    background: "#050505",
    primary: "#ff5f0f",
    secondary: "#7a1000",
    accent: "#c27e00",
  },
};

export const getTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      ...(mode === "light"
        ? {
            // Light palette
            primary: { main: tokens.light.primary },
            secondary: { main: tokens.light.secondary },
            background: {
              default: tokens.light.background,
              paper: "#ffffff",
            },
            text: {
              primary: tokens.light.text,
            },
          }
        : {
            // Dark palette
            primary: { main: tokens.dark.primary },
            secondary: { main: tokens.dark.secondary },
            background: {
              default: tokens.dark.background,
              paper: "#1a1a1a", // Légèrement plus clair que le fond noir
            },
            text: {
              primary: tokens.dark.text,
            },
          }),
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 700 },
      h2: { fontWeight: 600 },
      h3: { fontWeight: 600 },
      button: { textTransform: "none", fontWeight: 600 },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            padding: "10px 24px",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 16,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: mode === "light" 
              ? "0 4px 20px rgba(0,0,0,0.05)" 
              : "0 4px 20px rgba(0,0,0,0.3)",
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: 12,
            },
          },
        },
      },
    },
  });
