import "./globals.css";
import ThemeRegistry from "../theme/ThemeRegistry";
import { AuthProvider } from "../context/AuthContext";

export const metadata = {
  title: "Event App",
  description: "Planifier vos événements simplement",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <ThemeRegistry>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
