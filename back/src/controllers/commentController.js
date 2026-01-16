import prisma from "../utils/db.js";

/**
 * Récupérer tous les commentaires d'un événement
 */
export const getEventComments = async (req, res) => {
  try {
    const { eventId } = req.params;

    const comments = await prisma.comment.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(comments);
  } catch (error) {
    console.error("Erreur getEventComments:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

/**
 * Créer un nouveau commentaire
 */
export const createComment = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    if (!text || !text.trim()) {
      return res
        .status(400)
        .json({ error: "Le commentaire ne peut pas être vide" });
    }

    // Vérifier que l'utilisateur est participant de l'événement
    const participant = await prisma.eventParticipant.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    if (!participant) {
      return res
        .status(403)
        .json({ error: "Vous devez être participant pour commenter" });
    }

    const comment = await prisma.comment.create({
      data: {
        text: text.trim(),
        userId,
        eventId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error("Erreur createComment:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

/**
 * Supprimer un commentaire
 */
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        event: {
          include: {
            participants: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!comment) {
      return res.status(404).json({ error: "Commentaire introuvable" });
    }

    // Seul l'auteur ou l'owner de l'événement peut supprimer
    const isAuthor = comment.userId === userId;
    const isOwner = comment.event.participants.some(
      (p) => p.userId === userId && p.role === "OWNER"
    );

    if (!isAuthor && !isOwner) {
      return res.status(403).json({ error: "Non autorisé" });
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    res.json({ message: "Commentaire supprimé" });
  } catch (error) {
    console.error("Erreur deleteComment:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
