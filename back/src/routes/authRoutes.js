import express from "express";
import * as authController from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", protect, authController.getMe);
router.put("/me", protect, authController.updateProfile);
router.delete("/me", protect, authController.deleteUser);

export default router;
