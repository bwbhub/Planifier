import jwt from "jsonwebtoken";
import { asyncHandler } from "./errorHandler.js";
import prisma from "../utils/db.js";

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Extraire le token du header "Bearer <token>"
      token = req.headers.authorization.split(" ")[1];

      // Vérifier le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret_change_me");

      // Récupérer l'utilisateur sans le mot de passe
      req.user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, name: true, email: true, avatarUrl: true },
      });

      if (!req.user) {
        res.status(401);
        throw new Error("Utilisateur non trouvé");
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error("Non autorisé, token invalide");
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("Non autorisé, aucun token fourni");
  }
});
