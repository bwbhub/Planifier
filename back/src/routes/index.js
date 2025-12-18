import express from "express";
import authRoutes from "./authRoutes.js";
import eventRoutes from "./eventRoutes.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    message: "API Root",
    endpoints: {
      health: "/health",
      auth: "/auth",
      events: "/events"
    }
  });
});

router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

router.use("/auth", authRoutes);
router.use("/events", eventRoutes);

export default router;
