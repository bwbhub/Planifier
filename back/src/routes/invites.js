/**
 * Routes pour la gestion des invitations
 */

import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import * as inviteController from "../controllers/inviteController.js";

const router = express.Router();

// Route protégée pour récupérer les invitations de l'utilisateur
router.get("/", protect, inviteController.getUserInvites);

// Route publique pour récupérer les infos d'une invitation par token
router.get("/:token", inviteController.getInviteByToken);

// Route protégée pour accepter une invitation
router.post("/:token/accept", protect, inviteController.acceptInvite);

export default router;
