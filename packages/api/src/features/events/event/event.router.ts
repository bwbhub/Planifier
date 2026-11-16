import { userProcedure } from "../../../procedures";
import { eventGuard } from "../event-guard";
import { listParticipants, removeParticipant, setRole } from "./event-participants.service";
import { listEvents } from "./event-list.service";
import { respondToEvent } from "./event-respond.service";
import { createEvent, deleteEvent, getEvent, setEventSpace, updateEvent } from "./event.service";

export const eventRouter = {
  // Filtré par l'appelant : ce qu'il voit (participe, invité par e-mail, Espace).
  list: userProcedure.events.event.list.handler(({ context, input }) =>
    listEvents(context.getDb(), { userId: context.user.id, email: context.user.email }, input),
  ),
  get: userProcedure.events.event.get
    .use(eventGuard("view"))
    .handler(({ context, input }) =>
      getEvent(
        context.getDb(),
        { userId: context.user.id, email: context.user.email },
        input.eventId,
      ),
    ),
  // Tout compte peut créer un événement : il en est le propriétaire.
  create: userProcedure.events.event.create.handler(({ context, input }) =>
    createEvent(context.getDb(), { userId: context.user.id, email: context.user.email }, input),
  ),
  update: userProcedure.events.event.update
    .use(eventGuard("update"))
    .handler(({ context, input }) =>
      updateEvent(context.getDb(), { userId: context.user.id, email: context.user.email }, input),
    ),
  setSpace: userProcedure.events.event.setSpace
    .use(eventGuard("change_space"))
    .handler(({ context, input }) =>
      setEventSpace(context.getDb(), { userId: context.user.id, email: context.user.email }, input),
    ),
  delete: userProcedure.events.event.delete
    .use(eventGuard("delete"))
    .handler(async ({ context, input }) => {
      await deleteEvent(context.getDb(), input.eventId);
      return {};
    }),
  respond: userProcedure.events.event.respond
    .use(eventGuard("react"))
    .handler(({ context, input }) =>
      respondToEvent(
        context.getDb(),
        { userId: context.user.id, email: context.user.email },
        input,
      ),
    ),
  participants: userProcedure.events.event.participants
    .use(eventGuard("view"))
    .handler(({ context, input }) =>
      listParticipants(context.getDb(), context.eventCaller, input.eventId),
    ),
  setRole: userProcedure.events.event.setRole
    .use(eventGuard("manage_roles"))
    .handler(async ({ context, input }) => {
      await setRole(context.getDb(), context.user.id, input);
      return {};
    }),
  removeParticipant: userProcedure.events.event.removeParticipant
    .use(eventGuard("remove_guest"))
    .handler(async ({ context, input }) => {
      await removeParticipant(
        context.getDb(),
        { callerId: context.user.id, access: context.eventCaller.access },
        input,
      );
      return {};
    }),
};
