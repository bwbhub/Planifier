import express from "express";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes/index.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

// Middleware pour les logs et le parsing
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Routes API
app.use("/api", routes);

// Route racine pour vérifier que le serveur tourne
app.get("/", (req, res) => {
  res.json({ message: "Event App API is running 🚀" });
});

// Ignorer favicon
app.get("/favicon.ico", (req, res) => res.status(204).end());

// Route 404 pour les URL non trouvées
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// Gestionnaire d'erreurs global
app.use(errorHandler);

export default app;
