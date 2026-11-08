import { type APIRequestContext, expect } from "@playwright/test";
import { z } from "zod";

import { getE2eEnv } from "./env";

// Réponses de l'API de Mailpit : seuls ces champs sont lus.
const searchSchema = z.object({ messages: z.array(z.object({ ID: z.string() })) });
const messageSchema = z.object({ Text: z.string() });

/** Textes de tous les e-mails reçus par `email`. */
async function textsSentTo(request: APIRequestContext, email: string): Promise<string[]> {
  const base = getE2eEnv().MAILPIT_URL;
  const search = await request.get(new URL("/api/v1/search", base).toString(), {
    params: { query: `to:"${email}"` },
  });
  const { messages } = searchSchema.parse(await search.json());
  const texts = [];
  for (const { ID } of messages) {
    const message = await request.get(new URL(`/api/v1/message/${ID}`, base).toString());
    texts.push(messageSchema.parse(await message.json()).Text);
  }
  return texts;
}

/** Attend un e-mail reçu par `email` dont le texte contient `fragment` (un avis sans lien, par exemple). */
export async function waitForMailText(
  request: APIRequestContext,
  email: string,
  fragment: string,
): Promise<void> {
  await expect
    .poll(async () => (await textsSentTo(request, email)).some((text) => text.includes(fragment)))
    .toBe(true);
}

/** Liens reçus par `email`, du plus récent au plus ancien. */
async function linksSentTo(request: APIRequestContext, email: string): Promise<string[]> {
  const base = getE2eEnv().MAILPIT_URL;
  const search = await request.get(new URL("/api/v1/search", base).toString(), {
    params: { query: `to:"${email}"` },
  });
  const { messages } = searchSchema.parse(await search.json());
  const links = [];
  for (const { ID } of messages) {
    const message = await request.get(new URL(`/api/v1/message/${ID}`, base).toString());
    const { Text } = messageSchema.parse(await message.json());
    links.push(...(/https?:\/\/\S+/.exec(Text) ?? []));
  }
  return links;
}

/**
 * Attend le `count`-ième e-mail reçu par `email` et rend son lien. L'API envoie sans attendre la fin de l'envoi
 * (pour ne rien révéler par la durée de réponse) : le message arrive peu après la réponse.
 */
export async function waitForLink(
  request: APIRequestContext,
  email: string,
  count: number,
): Promise<string> {
  let links: string[] = [];
  await expect
    .poll(async () => {
      links = await linksSentTo(request, email);
      return links.length;
    })
    .toBeGreaterThanOrEqual(count);
  const [latest = ""] = links;
  return latest;
}
