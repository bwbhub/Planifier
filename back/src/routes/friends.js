/**
 * Routes pour la gestion des amis/contacts
 */

import express from "express";
import * as friendController from "../controllers/friendController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// GET /api/friends - Liste des amis
router.get("/", friendController.getFriends);

// POST /api/friends - Ajouter un ami
router.post("/", friendController.addFriend);

// DELETE /api/friends/:friendId - Supprimer un ami
router.delete("/:friendId", friendController.removeFriend);

export default router;
