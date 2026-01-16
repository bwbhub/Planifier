import express from "express";
import authRoutes from "./authRoutes.js";
import eventRoutes from "./eventRoutes.js";
import friendRoutes from "./friends.js";
import inviteRoutes from "./invites.js";
import commentRoutes from "./comments.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    message: "API Root",
    endpoints: {
      health: "/health",
      auth: "/auth",
      events: "/events",
      friends: "/friends",
      invites: "/invites",
      comments: "/comments",
    },
  });
});

router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

router.use("/auth", authRoutes);
router.use("/events", eventRoutes);
router.use("/friends", friendRoutes);
router.use("/invites", inviteRoutes);
router.use("/", commentRoutes);

export default router;
