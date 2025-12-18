import express from "express";
import * as eventController from "../controllers/eventController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Toutes les routes events sont protégées
router.use(protect);

router.route("/")
  .get(eventController.getMyEvents)
  .post(eventController.createEvent);

router.route("/:id")
  .get(eventController.getEventById)
  .put(eventController.updateEvent)
  .delete(eventController.deleteEvent);

export default router;
