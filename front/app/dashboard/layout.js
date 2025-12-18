import Navbar from "../../components/Navbar";
import { Box } from "@mui/material";
import AuthGuard from "../../components/AuthGuard";

export default function DashboardLayout({ children }) {
  return (
    <AuthGuard>
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        <Navbar />
        
        {/* Contenu principal avec padding adaptatif */}
        <Box
          component="main"
          sx={{
            // Desktop: marge à gauche pour la navbar verticale
            pl: { xs: 2, md: "100px" },
            pr: 2,
            pt: 4,
            // Mobile: marge en bas pour la navbar horizontale
            pb: { xs: "100px", md: 4 },
            maxWidth: 1600,
            mx: "auto",
          }}
        >
          {children}
        </Box>
      </Box>
    </AuthGuard>
  );
}
