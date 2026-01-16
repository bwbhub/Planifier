import { asyncHandler } from "../middlewares/errorHandler.js";
import prisma from "../utils/db.js";

// @desc    Créer un nouvel événement
// @route   POST /api/events
// @access  Private
export const createEvent = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    location,
    startDate,
    endDate,
    coverUrl,
    color,
    settings,
  } = req.body;

  if (!title || !startDate) {
    res.status(400);
    throw new Error("Le titre et la date de début sont requis");
  }

  // Transaction pour s'assurer que tout est créé ou rien du tout
  const result = await prisma.$transaction(async (prisma) => {
    // 1. Créer l'événement
    const event = await prisma.event.create({
      data: {
        title,
        description,
        location,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        coverUrl,
        color,
        // 2. Créer les settings par défaut ou personnalisés
        settings: {
          create: {
            isGuestListVisible: settings?.isGuestListVisible ?? true,
            allowGuestInvite: settings?.allowGuestInvite ?? false,
            maxParticipants: settings?.maxParticipants ?? null,
          },
        },
        // 3. Ajouter le créateur comme participant OWNER
        participants: {
          create: {
            userId: req.user.id,
            role: "OWNER",
            status: "GOING",
          },
        },
      },
      include: {
        settings: true,
        participants: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
        },
      },
    });

    return event;
  });

  res.status(201).json(result);
});

// @desc    Récupérer tous les événements de l'utilisateur (où il participe)
// @route   GET /api/events
// @access  Private
export const getMyEvents = asyncHandler(async (req, res) => {
  const events = await prisma.event.findMany({
    where: {
      participants: {
        some: {
          userId: req.user.id,
        },
      },
    },
    include: {
      participants: {
        where: { userId: req.user.id }, // Pour avoir mon rôle et statut dans cet event
        select: { role: true, status: true },
      },
      _count: {
        select: { participants: true }, // Compter le nombre total de participants
      },
    },
    orderBy: {
      startDate: "asc",
    },
  });

  // Transformer la réponse pour aplanir la structure
  const formattedEvents = events.map((event) => {
    const myParticipation = event.participants[0];
    return {
      ...event,
      myRole: myParticipation.role,
      myStatus: myParticipation.status,
      participantsCount: event._count.participants,
      participants: undefined, // Nettoyage
      _count: undefined,
    };
  });

  res.json(formattedEvents);
});

// @desc    Récupérer un événement par son ID
// @route   GET /api/events/:id
// @access  Private
export const getEventById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      settings: true,
      participants: {
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      },
    },
  });

  if (!event) {
    res.status(404);
    throw new Error("Événement non trouvé");
  }

  // Vérifier si l'utilisateur a le droit de voir cet événement
  // (Ici on suppose que tout participant peut voir, ou un invité avec token - à implémenter plus tard)
  // Pour l'instant : seuls les participants peuvent voir
  const isParticipant = event.participants.some(
    (p) => p.user.id === req.user.id
  );

  if (!isParticipant) {
    res.status(403);
    throw new Error("Vous n'avez pas accès à cet événement");
  }

  res.json(event);
});

// @desc    Mettre à jour un événement
// @route   PUT /api/events/:id
// @access  Private (Owner/Organizer only)
export const updateEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    location,
    startDate,
    endDate,
    coverUrl,
    color,
    settings,
  } = req.body;

  // Vérifier les droits
  const participant = await prisma.eventParticipant.findUnique({
    where: {
      userId_eventId: {
        userId: req.user.id,
        eventId: id,
      },
    },
  });

  if (
    !participant ||
    (participant.role !== "OWNER" && participant.role !== "ORGANIZER")
  ) {
    res.status(403);
    throw new Error("Non autorisé à modifier cet événement");
  }

  const updatedEvent = await prisma.event.update({
    where: { id },
    data: {
      title,
      description,
      location,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      coverUrl,
      color,
      settings: settings
        ? {
            update: {
              isGuestListVisible: settings.isGuestListVisible,
              allowGuestInvite: settings.allowGuestInvite,
              maxParticipants: settings.maxParticipants,
            },
          }
        : undefined,
    },
    include: {
      settings: true,
    },
  });

  res.json(updatedEvent);
});

// @desc    Supprimer un événement
// @route   DELETE /api/events/:id
// @access  Private (Owner only)
export const deleteEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Vérifier les droits (Seul le OWNER peut supprimer)
  const participant = await prisma.eventParticipant.findUnique({
    where: {
      userId_eventId: {
        userId: req.user.id,
        eventId: id,
      },
    },
  });

  if (!participant || participant.role !== "OWNER") {
    res.status(403);
    throw new Error("Seul le créateur peut supprimer l'événement");
  }

  await prisma.event.delete({
    where: { id },
  });

  res.json({ message: "Événement supprimé avec succès" });
});
