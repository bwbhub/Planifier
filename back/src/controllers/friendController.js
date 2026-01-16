/**
 * Controller pour la gestion des amis/contacts
 * Permet d'ajouter, lister et supprimer des amis pour un ajout rapide aux événements
 */

import prisma from "../utils/db.js";

/**
 * Récupère la liste d'amis de l'utilisateur connecté
 */
export const getFriends = async (req, res) => {
  try {
    const userId = req.user.id;

    const friendships = await prisma.friendship.findMany({
      where: { userId },
      include: {
        friend: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const friends = friendships.map((f) => f.friend);

    res.json(friends);
  } catch (error) {
    console.error("Erreur getFriends:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

/**
 * Ajoute un ami à la liste
 */
export const addFriend = async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId } = req.body;

    if (!friendId) {
      return res.status(400).json({ error: "friendId requis" });
    }

    // Vérifier que l'ami existe
    const friendExists = await prisma.user.findUnique({
      where: { id: friendId },
    });

    if (!friendExists) {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }

    // Vérifier qu'on ne s'ajoute pas soi-même
    if (userId === friendId) {
      return res
        .status(400)
        .json({ error: "Vous ne pouvez pas vous ajouter vous-même" });
    }

    // Créer l'amitié (ou ignorer si existe déjà)
    const friendship = await prisma.friendship.upsert({
      where: {
        userId_friendId: {
          userId,
          friendId,
        },
      },
      create: {
        userId,
        friendId,
      },
      update: {},
      include: {
        friend: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.json(friendship.friend);
  } catch (error) {
    console.error("Erreur addFriend:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

/**
 * Supprime un ami de la liste
 */
export const removeFriend = async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId } = req.params;

    await prisma.friendship.deleteMany({
      where: {
        userId,
        friendId,
      },
    });

    res.json({ message: "Ami supprimé" });
  } catch (error) {
    console.error("Erreur removeFriend:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
