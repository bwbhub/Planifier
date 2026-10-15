// Canal choisi par l'utilisateur. Push par défaut.
export const NOTIFICATION_CHANNELS = ["PUSH", "EMAIL", "BOTH", "NONE"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];
export const DEFAULT_NOTIFICATION_CHANNEL = "PUSH" as const satisfies NotificationChannel;

// Un invité sans compte ne reçoit jamais de notification (CONTEXT.md).
export const NOTIFICATION_TYPES = [
  "INVITE_RECEIVED",
  "INVITE_ACCEPTED",
  "EVENT_UPDATED",
  "EVENT_IMPORTANT_FIELD_CHANGED",
  "EVENT_IMPORTANT_COMMENT",
  "PROPOSAL_RECEIVED",
  "PROPOSAL_APPROVED",
  "TASK_ASSIGNED",
  "TASK_REMINDER",
  "TASK_NUDGE",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
