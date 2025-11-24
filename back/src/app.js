import express from "express";
import cors from "cors";
import morgan from "morgan";

const app = express();

// Middleware pour les logs et le parsing
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Route de base pour tester l'API
app.get("/", (req, res) => {
  res.json({ message: "API running" });
});

export default app;
