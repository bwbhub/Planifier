import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  getEventComments,
  createComment,
  deleteComment,
} from "../controllers/commentController.js";

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Routes pour les commentaires d'un événement
router.get("/events/:eventId/comments", getEventComments);
router.post("/events/:eventId/comments", createComment);
router.delete("/comments/:commentId", deleteComment);

export default router;
