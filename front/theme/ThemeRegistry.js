"use client";
import * as React from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter"; // Adapté pour Next.js 14+
import { getTheme } from "./theme";
import useMediaQuery from "@mui/material/useMediaQuery";

export default function ThemeRegistry({ children }) {
  // Détection du mode système
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  
  // On mémorise le thème pour éviter des recréations inutiles
  const theme = React.useMemo(
    () => getTheme(prefersDarkMode ? "dark" : "light"),
    [prefersDarkMode]
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
