import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const IV_BYTES = 12;
const VERSION = "v1";

/** Clé de 32 octets lue en base64 (`openssl rand -base64 32`) ; refuse toute autre longueur. */
export function parseSecretKey(base64: string): Buffer {
  const key = Buffer.from(base64, "base64");
  if (key.length !== KEY_BYTES) {
    throw new Error(`La clé de chiffrement doit faire ${String(KEY_BYTES)} octets en base64.`);
  }
  return key;
}

export interface SecretBox {
  /** Chiffre un texte : `v1.<iv>.<étiquette>.<chiffré>` (base64url). Un nouvel IV à chaque appel. */
  seal: (text: string) => string;
  /** Déchiffre ; `null` si le texte est altéré, d'une autre clé ou d'un autre format. Ne lève jamais. */
  open: (sealed: string) => string | null;
}

/**
 * Chiffrement authentifié (AES-256-GCM) d'un secret stocké en base, ici le lien privé d'un agenda. L'altération est
 * détectée. La clé vient de l'environnement ; la perdre rend les secrets illisibles (l'utilisateur recolle son lien).
 */
export function createSecretBox(key: Buffer): SecretBox {
  if (key.length !== KEY_BYTES) throw new Error("Clé de chiffrement invalide.");
  return {
    seal: (text) => {
      const iv = randomBytes(IV_BYTES);
      const cipher = createCipheriv(ALGORITHM, key, iv);
      const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
      return [VERSION, iv, cipher.getAuthTag(), encrypted]
        .map((part) => (typeof part === "string" ? part : part.toString("base64url")))
        .join(".");
    },
    open: (sealed) => {
      const [version, iv, tag, encrypted, ...rest] = sealed.split(".");
      if (version !== VERSION || rest.length > 0 || !iv || !tag || encrypted === undefined)
        return null;
      try {
        const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, "base64url"));
        decipher.setAuthTag(Buffer.from(tag, "base64url"));
        return Buffer.concat([
          decipher.update(Buffer.from(encrypted, "base64url")),
          decipher.final(),
        ]).toString("utf8");
      } catch {
        return null;
      }
    },
  };
}
