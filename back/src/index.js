import app from "./app.js";
import dotenv from "dotenv";

// Chargement des variables d'environnement
dotenv.config();

const PORT = process.env.PORT || 4000;

// Démarrage du serveur
app.listen(PORT, () => {
  console.log("Backend running on port", PORT);
});
