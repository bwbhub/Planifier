import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const IV_BYTES = 12;
const TAG_BYTES = 16;
const VERSION = "v1";

/** Clé de 32 octets lue en base64 (`openssl rand -base64 32`) ; refuse toute autre longueur. */
export function parseSecretKey(base64: string): Buffer {
  // Node ignore les caractères hors base64 : sans ce contrôle, une clé mal copiée serait lue de travers sans erreur.
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64))
    throw new Error("La clé de chiffrement n'est pas en base64.");
  const key = Buffer.from(base64, "base64");
  if (key.length !== KEY_BYTES) {
    throw new Error(`La clé de chiffrement doit faire ${String(KEY_BYTES)} octets en base64.`);
  }
  return key;
}

export interface SecretBox {
  /**
   * Chiffre un texte : `v1.<iv>.<étiquette>.<chiffré>` (base64url). Un nouvel IV à chaque appel. `context` (identifiant
   * de la ressource) est authentifié avec le texte : un chiffré recopié sur une autre ressource ne s'ouvre pas.
   */
  seal: (text: string, context: string) => string;
  /** Déchiffre ; `null` si le texte est altéré, d'une autre clé, d'un autre contexte ou d'un autre format. Ne lève jamais. */
  open: (sealed: string, context: string) => string | null;
}

/**
 * Chiffrement authentifié (AES-256-GCM) d'un secret stocké en base, ici le lien privé d'un agenda. L'altération est
 * détectée. La clé vient de l'environnement ; la perdre rend les secrets illisibles (l'utilisateur recolle son lien).
 * Une seule version de clé (`v1`) : changer de clé demande de faire recoller les liens.
 */
export function createSecretBox(key: Buffer): SecretBox {
  if (key.length !== KEY_BYTES) throw new Error("Clé de chiffrement invalide.");
  return {
    seal: (text, context) => {
      const iv = randomBytes(IV_BYTES);
      const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_BYTES });
      cipher.setAAD(Buffer.from(context, "utf8"));
      const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
      return [VERSION, iv, cipher.getAuthTag(), encrypted]
        .map((part) => (typeof part === "string" ? part : part.toString("base64url")))
        .join(".");
    },
    open: (sealed, context) => {
      const [version, ivText, tagText, encryptedText, ...rest] = sealed.split(".");
      if (
        version !== VERSION ||
        rest.length > 0 ||
        !ivText ||
        !tagText ||
        encryptedText === undefined
      ) {
        return null;
      }
      const iv = Buffer.from(ivText, "base64url");
      const tag = Buffer.from(tagText, "base64url");
      // Longueurs exactes : un étiquette tronquée serait sinon acceptée (GCM accepte 4 à 16 octets).
      if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) return null;
      try {
        const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_BYTES });
        decipher.setAAD(Buffer.from(context, "utf8"));
        decipher.setAuthTag(tag);
        return Buffer.concat([
          decipher.update(Buffer.from(encryptedText, "base64url")),
          decipher.final(),
        ]).toString("utf8");
      } catch {
        return null;
      }
    },
  };
}
