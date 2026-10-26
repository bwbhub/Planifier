import { z } from "zod";

// Seul fichier du package autorisé à lire process.env (règle ESLint). Variables décrites dans .env.example.
const commonSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  /** Adresse d'expédition, sur le domaine vérifié chez Resend en production. */
  MAIL_FROM: z.email(),
});

const transportSchema = z.discriminatedUnion("MAIL_TRANSPORT", [
  z.object({
    MAIL_TRANSPORT: z.literal("resend"),
    /** Secret. Clé d'API Resend, distincte par environnement. */
    RESEND_API_KEY: z.string().min(1),
  }),
  z.object({
    MAIL_TRANSPORT: z.literal("mailpit"),
    /** Boîte de réception locale (docker-compose) : rien ne sort de la machine. */
    MAILPIT_URL: z.url(),
  }),
]);

const mailEnvSchema = z
  .intersection(commonSchema, transportSchema)
  .refine((env) => env.NODE_ENV !== "production" || env.MAIL_TRANSPORT === "resend", {
    message: "en production, les e-mails partent par Resend",
    path: ["MAIL_TRANSPORT"],
  });

export type MailEnv = z.infer<typeof mailEnvSchema>;

export function parseMailEnv(source: Record<string, string | undefined>): MailEnv {
  return mailEnvSchema.parse(source);
}

export function getMailEnv(): MailEnv {
  return parseMailEnv(process.env);
}
