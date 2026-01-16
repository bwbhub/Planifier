/**
 * Controller pour la gestion des invitations par email
 * Gère l'invitation d'utilisateurs existants et nouveaux
 */

import prisma from "../utils/db.js";
import crypto from "crypto";
import { sendInvitationEmail } from "../services/emailService.js";

/**
 * Récupère les invitations en attente pour l'utilisateur connecté
 */
export const getUserInvites = async (req, res) => {
  try {
    const userEmail = req.user.email;

    // Filtrer par email car les invitations créées avant l'inscription ont userId=null
    const invites = await prisma.invite.findMany({
      where: {
        email: userEmail,
        status: "PENDING",
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            startDate: true,
            endDate: true,
            location: true,
          },
        },
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      invites,
      count: invites.length,
    });
  } catch (error) {
    console.error("Erreur getUserInvites:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

/**
 * Récupère les informations d'une invitation par son token
 * Route publique pour permettre l'affichage avant inscription
 */
export const getInviteByToken = async (req, res) => {
  try {
    const { token } = req.params;

    const invite = await prisma.invite.findUnique({
      where: { token },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            startDate: true,
          },
        },
        inviter: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!invite) {
      return res.status(404).json({ error: "Invitation introuvable" });
    }

    // Vérifier si l'invitation a expiré
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      return res.status(410).json({ error: "Cette invitation a expiré" });
    }

    // Vérifier si l'invitation a déjà été acceptée
    if (invite.status === "ACCEPTED") {
      return res
        .status(400)
        .json({ error: "Cette invitation a déjà été acceptée" });
    }

    res.json({
      invite: {
        email: invite.email,
        event: invite.event,
        inviterName: invite.inviter.name,
      },
    });
  } catch (error) {
    console.error("Erreur getInviteByToken:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

/**
 * Accepte une invitation et ajoute l'utilisateur comme participant
 */
export const acceptInvite = async (req, res) => {
  try {
    const { token } = req.params;
    const userId = req.user.id;

    const invite = await prisma.invite.findUnique({
      where: { token },
      include: {
        event: true,
      },
    });

    if (!invite) {
      return res.status(404).json({ error: "Invitation introuvable" });
    }

    // Vérifier si l'invitation a expiré
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      return res.status(410).json({ error: "Cette invitation a expiré" });
    }

    // Vérifier si l'invitation a déjà été acceptée
    if (invite.status === "ACCEPTED") {
      return res
        .status(400)
        .json({ error: "Cette invitation a déjà été acceptée" });
    }

    // Vérifier que l'email correspond (si l'utilisateur vient de s'inscrire)
    if (invite.email !== req.user.email) {
      return res
        .status(403)
        .json({ error: "Cette invitation n'est pas pour vous" });
    }

    // Vérifier si l'utilisateur est déjà participant
    const existingParticipant = await prisma.eventParticipant.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId: invite.eventId,
        },
      },
    });

    if (existingParticipant) {
      return res
        .status(400)
        .json({ error: "Vous êtes déjà participant à cet événement" });
    }

    // Créer le participant et mettre à jour l'invitation
    await prisma.$transaction([
      // Ajouter comme participant
      prisma.eventParticipant.create({
        data: {
          eventId: invite.eventId,
          userId,
          role: invite.role || "GUEST",
          status: "GOING", // L'utilisateur a accepté l'invitation, il participe
        },
      }),
      // Mettre à jour l'invitation
      prisma.invite.update({
        where: { id: invite.id },
        data: {
          status: "ACCEPTED",
          userId,
        },
      }),
      // Créer une notification pour l'organisateur
      prisma.notification.create({
        data: {
          type: "INVITE_ACCEPTED",
          userId: invite.inviterId,
          metadata: {
            eventId: invite.eventId,
            eventTitle: invite.event.title,
            userName: req.user.name,
          },
        },
      }),
    ]);

    res.json({
      success: true,
      eventId: invite.eventId,
      message: "Invitation acceptée avec succès",
    });
  } catch (error) {
    console.error("Erreur acceptInvite:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

/**
 * Invite un utilisateur par email à un événement
 * - Si l'utilisateur existe : crée une invitation liée au compte
 * - Si l'utilisateur n'existe pas : crée une invitation avec token pour inscription
 */
export const inviteByEmail = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { email } = req.body;
    const inviterId = req.user.id;

    if (!email) {
      return res.status(400).json({ error: "Email requis" });
    }

    // Vérifier que l'événement existe et que l'inviteur a les droits
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        participants: {
          where: { userId: inviterId },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ error: "Événement introuvable" });
    }

    const participant = event.participants[0];
    if (
      !participant ||
      (participant.role !== "OWNER" && participant.role !== "ORGANIZER")
    ) {
      return res
        .status(403)
        .json({ error: "Vous n'avez pas les droits pour inviter" });
    }

    // Vérifier si l'invitation existe déjà
    let existingInvite = await prisma.invite.findUnique({
      where: {
        eventId_email: {
          eventId,
          email,
        },
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
          },
        },
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    let invite;
    let isResend = false;

    if (existingInvite) {
      // L'invitation existe déjà, on la renvoie
      invite = existingInvite;
      isResend = true;
    } else {
      // Chercher si l'utilisateur existe
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      // Générer un token unique
      const token = crypto.randomBytes(32).toString("hex");

      // Créer l'invitation
      invite = await prisma.invite.create({
        data: {
          email,
          token,
          eventId,
          inviterId,
          userId: existingUser?.id || null,
          role: "GUEST",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
            },
          },
          user: {
            select: {
              id: true,
            },
          },
        },
      });

      // Si l'utilisateur existe, créer une notification
      if (existingUser) {
        await prisma.notification.create({
          data: {
            type: "INVITE_RECEIVED",
            userId: existingUser.id,
            metadata: {
              eventId: event.id,
              eventTitle: event.title,
              inviterName: req.user.name,
              inviteId: invite.id,
            },
          },
        });
      }
    }

    // Envoyer l'email d'invitation (nouveau ou renvoi)
    try {
      await sendInvitationEmail({
        to: email,
        eventTitle: event.title,
        inviterName: req.user.name || "Un organisateur",
        token: invite.token,
        isNewUser: !invite.user?.id,
      });
    } catch (emailError) {
      console.error("Erreur envoi email:", emailError);
      // On continue même si l'email échoue
    }

    res.json({
      success: true,
      userExists: !!invite.user?.id,
      isResend,
      invite: {
        id: invite.id,
        email: invite.email,
        token: invite.token,
        eventTitle: invite.event.title,
      },
      message: isResend
        ? "Email d'invitation renvoyé avec succès"
        : invite.user?.id
        ? "Invitation envoyée à l'utilisateur"
        : "Invitation créée. Un email a été envoyé avec le lien d'inscription",
    });
  } catch (error) {
    console.error("Erreur inviteByEmail:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
