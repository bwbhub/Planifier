"use client";
import * as React from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter"; // Adapté pour Next.js 14+
import { getTheme } from "./theme";
import { useAuth } from "../context/AuthContext";

export default function ThemeRegistry({ children }) {
  const { user } = useAuth();

  console.log("User data in ThemeRegistry:", user);
  
  // Utiliser le thème préféré de l'utilisateur, sinon "light" par défaut
  const themeMode = user?.preferredTheme || "light";
  
  // On mémorise le thème pour éviter des recréations inutiles
  const theme = React.useMemo(
    () => getTheme(themeMode),
    [themeMode]
  );

  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
