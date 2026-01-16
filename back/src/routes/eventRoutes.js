import express from "express";
import * as eventController from "../controllers/eventController.js";
import * as inviteController from "../controllers/inviteController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Toutes les routes events sont protégées
router.use(protect);

router
  .route("/")
  .get(eventController.getMyEvents)
  .post(eventController.createEvent);

router
  .route("/:id")
  .get(eventController.getEventById)
  .put(eventController.updateEvent)
  .delete(eventController.deleteEvent);

// Route pour inviter par email
router.post("/:eventId/invite-by-email", inviteController.inviteByEmail);

export default router;
