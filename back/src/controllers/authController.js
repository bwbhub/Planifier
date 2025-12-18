import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../utils/db.js";
import { asyncHandler } from "../middlewares/errorHandler.js";

// Utilitaire pour générer le token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "default_secret_change_me", {
    expiresIn: "30d",
  });
};

// @desc    Inscrire un nouvel utilisateur
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Veuillez remplir tous les champs");
  }

  // Vérifier si l'utilisateur existe déjà
  const userExists = await prisma.user.findUnique({
    where: { email },
  });

  if (userExists) {
    res.status(400);
    throw new Error("Cet utilisateur existe déjà");
  }

  // Hasher le mot de passe
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Créer l'utilisateur
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: hashedPassword,
    },
  });

  if (user) {
    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      token: generateToken(user.id),
    });
  } else {
    res.status(400);
    throw new Error("Données utilisateur invalides");
  }
});

// @desc    Connecter un utilisateur
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Vérifier l'email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (user && (await bcrypt.compare(password, user.passwordHash))) {
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      token: generateToken(user.id),
    });
  } else {
    res.status(401);
    throw new Error("Email ou mot de passe incorrect");
  }
});

// @desc    Récupérer les infos de l'utilisateur courant
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  // req.user est défini par le middleware protect
  res.json(req.user);
});

// @desc    Mettre à jour le profil de l'utilisateur courant
// @route   PUT /api/auth/me
// @access  Private
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Récupérer l'utilisateur actuel
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
  });

  if (!user) {
    res.status(404);
    throw new Error("Utilisateur non trouvé");
  }

  // Vérifier si le nouvel email est déjà utilisé par un autre utilisateur
  if (email && email !== user.email) {
    const emailExists = await prisma.user.findUnique({
      where: { email },
    });

    if (emailExists) {
      res.status(400);
      throw new Error("Cet email est déjà utilisé");
    }
  }

  // Préparer les données à mettre à jour
  const updateData = {
    name: name || user.name,
    email: email || user.email,
  };

  // Si un nouveau mot de passe est fourni, le hasher
  if (password && password.trim() !== "") {
    const salt = await bcrypt.genSalt(10);
    updateData.passwordHash = await bcrypt.hash(password, salt);
  }

  // Mettre à jour l'utilisateur
  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: updateData,
  });

  res.json({
    id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    token: generateToken(updatedUser.id),
  });
});

// @desc    Supprimer l'utilisateur courant
// @route   DELETE /api/auth/me
// @access  Private
export const deleteUser = asyncHandler(async (req, res) => {
  // req.user est défini par le middleware protect
  await prisma.user.delete({
    where: { id: req.user.id }
  });
  res.json({ message: "Utilisateur supprimé avec succès" });
});