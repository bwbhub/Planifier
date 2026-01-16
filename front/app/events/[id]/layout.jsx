import AuthGuard from "../../../components/AuthGuard";
import Navbar from "../../../components/Navbar";
import { Box } from "@mui/material";

/**
 * Layout pour la page de détail d'événement
 * Protège la route avec AuthGuard et ajoute la Navbar
 */
export default function EventDetailLayout({ children }) {
  return (
    <AuthGuard>
      <Navbar />
      <Box
        sx={{
          pb: { xs: "120px", md: 0 }, // Padding bottom sur mobile pour la navbar
          pl: { xs: 0, md: "100px" }, // Padding left sur desktop pour la navbar
        }}
      >
        {children}
      </Box>
    </AuthGuard>
  );
}
